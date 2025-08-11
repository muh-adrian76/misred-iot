/**
 * ===== MQTT TOPIC MANAGER =====
 * Service untuk mengelola subscription MQTT topics secara efisien
 * Mencegah duplicate subscription dan mengelola usage count per topic
 * 
 * Fitur utama:
 * - Smart topic subscription/unsubscription management
 * - Usage count tracking per topic 
 * - Prevent duplicate subscriptions
 * - Auto cleanup unused topics
 * - Batch topic operations
 * - Subscription status monitoring
 */
import { Pool } from "mysql2/promise";

export class MQTTTopicManager {
  private db: Pool;
  private subscribedTopics = new Set<string>(); // Track topics yang sedang di-subscribe
  private topicUsageCount = new Map<string, number>(); // Count berapa device yang menggunakan topic

  constructor(db: Pool) {
    this.db = db;
  }

  // ===== GET TOPIC USAGE COUNT =====
  // Mengecek berapa banyak device yang menggunakan topic tertentu
  private async getTopicUsageCount(topic: string): Promise<number> {
    try {
      const [rows]: any = await this.safeDbQuery(
        "SELECT COUNT(*) as count FROM devices WHERE mqtt_topic = ? AND protocol = 'MQTT'",
        [topic]
      );
      return rows[0]?.count || 0;
    } catch (error) {
      console.error("Gagal mengambil jumlah penggunaan topik:", error);
      return 0; // Kembalikan 0 sebagai fallback yang aman
    }
  }

  // ===== GET ALL ACTIVE TOPICS =====
  // Mendapatkan semua unique topics yang digunakan oleh devices
  async getAllActiveTopics(): Promise<string[]> {
    try {
      // Gunakan metode query aman dengan auto-retry
      const [rows]: any = await this.safeDbQuery(
        "SELECT DISTINCT mqtt_topic FROM devices WHERE mqtt_topic IS NOT NULL AND protocol = 'MQTT'"
      );
      return rows.map((row: any) => row.mqtt_topic).filter(Boolean);
    } catch (error) {
      console.error("Gagal mengambil semua topik aktif:", error);
      return []; // Return array kosong untuk fallback yang aman
    }
  }

  // ===== SAFE DATABASE QUERY =====
  // Method untuk execute database query dengan error handling
  private async safeDbQuery(sql: string, params: any[] = []): Promise<any> {
    try {
      return await (this.db as any).safeQuery(sql, params);
    } catch (error: any) {
      // Cek jika error disebabkan pool tertutup atau koneksi terputus
      if (error.message?.includes('Pool is closed') || 
          error.code === 'PROTOCOL_CONNECTION_LOST' ||
          error.code === 'ER_CONNECTION_LOST') {
        console.warn('🔄 Masalah koneksi database pada MQTT Topic Manager, mencoba pemulihan...');
        
        // Impor MySQLDatabase untuk memaksa koneksi ulang
        const { MySQLDatabase } = await import('../lib/middleware');
        this.db = MySQLDatabase.forceReconnect();
        
        // Coba ulang eksekusi query dengan koneksi baru
        return await (this.db as any).safeQuery(sql, params);
      }
      throw error; // Lempar ulang jika bukan error koneksi
    }
  }

  // ===== UPDATE TOPIC USAGE CACHE =====
  // Update cache count usage topic
  private async updateTopicUsageCache(topic: string): Promise<void> {
    const count = await this.getTopicUsageCount(topic);
    if (count > 0) {
      this.topicUsageCount.set(topic, count);
    } else {
      this.topicUsageCount.delete(topic);
    }
  }

  // ===== SUBSCRIBE IF NEEDED =====
  // Subscribe ke topic jika belum di-subscribe
  async subscribeIfNeeded(
    topic: string, 
    subscribeFn: (topic: string) => void
  ): Promise<boolean> {
    if (!topic) return false;

    // Update usage count
    await this.updateTopicUsageCache(topic);
    
    // Jika topic belum di-subscribe, subscribe sekarang
    if (!this.subscribedTopics.has(topic)) {
      try {
        subscribeFn(topic);
        this.subscribedTopics.add(topic);
        return true;
      } catch (error) {
        console.error(`❌ MQTT: Gagal subscribe ke topik '${topic}':`, error);
        return false;
      }
    } else {
    //   console.log(`ℹ️ MQTT: Topic '${topic}' already subscribed (${this.topicUsageCount.get(topic)} devices using it)`);
      return false;
    }
  }

  /**
   * Unsubscribe dari topic jika tidak ada device yang menggunakannya
   */
  async unsubscribeIfUnused(
    topic: string, 
    unsubscribeFn: (topic: string) => void
  ): Promise<boolean> {
    if (!topic || !this.subscribedTopics.has(topic)) return false;

    // Check apakah masih ada device yang menggunakan topic ini
    const usageCount = await this.getTopicUsageCount(topic);
    
    if (usageCount === 0) {
      try {
        unsubscribeFn(topic);
        this.subscribedTopics.delete(topic);
        this.topicUsageCount.delete(topic);
        return true;
      } catch (error) {
        console.error(`❌ MQTT: Gagal unsubscribe dari topik '${topic}':`, error);
        return false;
      }
    } else {
      // Update cache
      this.topicUsageCount.set(topic, usageCount);
      return false;
    }
  }

  /**
   * Handle topic change untuk device (dipanggil saat device update)
   */
  async handleTopicChange(
    oldTopic: string | null,
    newTopic: string | null,
    subscribeFn: (topic: string) => void,
    unsubscribeFn: (topic: string) => void
  ): Promise<void> {
    // Unsubscribe dari old topic jika tidak digunakan lagi
    if (oldTopic && oldTopic !== newTopic) {
      await this.unsubscribeIfUnused(oldTopic, unsubscribeFn);
    }

    // Subscribe ke new topic jika belum di-subscribe
    if (newTopic && newTopic !== oldTopic) {
      await this.subscribeIfNeeded(newTopic, subscribeFn);
    }
  }

  /**
   * Subscribe ke semua topics yang aktif (dipanggil saat server start)
   */
  async subscribeToAllActiveTopics(subscribeFn: (topic: string) => void): Promise<void> {
    const activeTopics = await this.getAllActiveTopics();
    
    for (const topic of activeTopics) {
      await this.subscribeIfNeeded(topic, subscribeFn);
    }
  }

  /**
   * Ambil status subscription saat ini
   */
  getSubscriptionStatus(): {
    subscribedTopics: string[];
    topicUsage: { [topic: string]: number };
  } {
    return {
      subscribedTopics: Array.from(this.subscribedTopics),
      topicUsage: Object.fromEntries(this.topicUsageCount)
    };
  }

  /**
   * Manual sync untuk memastikan consistency (bisa dipanggil periodic)
   */
  async syncSubscriptions(
    subscribeFn: (topic: string) => void,
    unsubscribeFn: (topic: string) => void
  ): Promise<void> {
    // Get semua active topics dari database
    const activeTopics = await this.getAllActiveTopics();
    const activeTopicsSet = new Set(activeTopics);
    
    // Subscribe ke topics yang belum di-subscribe
    for (const topic of activeTopics) {
      await this.subscribeIfNeeded(topic, subscribeFn);
    }
    
    // Unsubscribe dari topics yang tidak aktif lagi
    const subscribedTopicsArray = Array.from(this.subscribedTopics);
    for (const topic of subscribedTopicsArray) {
      if (!activeTopicsSet.has(topic)) {
        await this.unsubscribeIfUnused(topic, unsubscribeFn);
      }
    }
  }
}
