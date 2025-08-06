/**
 * ===== ADVANCED HEALTH CHECK ENDPOINT =====
 * Comprehensive health monitoring untuk semua komponen sistem
 */

import { Elysia } from 'elysia';
import { MySQLDatabase, performanceMonitor } from '../lib/middleware';

export function healthCheckRoutes(mqttClient: any) {
  return new Elysia({ prefix: '/health' })
    // ===== BASIC HEALTH CHECK =====
    .get('/', async () => {
      const startTime = Date.now();
      const health: any = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      };

      // Database health check
      try {
        const dbHealthy = await MySQLDatabase.healthCheck();
        health.database = {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          connection: dbHealthy ? 'connected' : 'disconnected'
        };
      } catch (error) {
        health.database = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // MQTT health check
      try {
        health.mqtt = {
          status: mqttClient.connected ? 'connected' : 'disconnected',
          clientId: mqttClient.options?.clientId || 'unknown'
        };
      } catch (error) {
        health.mqtt = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // System metrics (auto-detect runtime)
      const isNode = typeof process !== 'undefined' && process.versions?.node;
      const isBun = typeof process !== 'undefined' && process.versions?.bun;
      const runtime = isBun ? 'bun' : (isNode ? 'node' : 'unknown');
      
      health.system = {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        cpu: process.cpuUsage ? process.cpuUsage() : { user: 0, system: 0 },
        loadAverage: process.platform !== 'win32' && require('os').loadavg ? require('os').loadavg() : [0, 0, 0],
        runtime
      };

      health.responseTime = Date.now() - startTime;
      
      // Set HTTP status based on overall health
      const isHealthy = health.database.status === 'healthy' && 
                       health.mqtt.status === 'connected';
      
      return new Response(JSON.stringify(health), {
        status: isHealthy ? 200 : 503,
        headers: { 'Content-Type': 'application/json' }
      });
    })

    // ===== DETAILED HEALTH CHECK =====
    .get('/detailed', async () => {
      const health: any = {
        timestamp: new Date().toISOString(),
        services: {}
      };

      // Database detailed check
      try {
        const dbHealthy = await MySQLDatabase.healthCheck();
        const connectionStats = await MySQLDatabase.getInstance().execute(
          "SHOW STATUS WHERE Variable_name IN ('Connections', 'Max_used_connections', 'Threads_connected')"
        );
        
        health.services.database = {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          connectionPool: 'active',
          stats: connectionStats[0]
        };
      } catch (error) {
        health.services.database = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Performance metrics (simplified)
      health.system = performanceMonitor.getSystemMetrics();

      return health;
    })

    // ===== READINESS CHECK =====
    .get('/ready', async () => {
      try {
        // Check all critical services
        const dbHealthy = await MySQLDatabase.healthCheck();
        const mqttConnected = mqttClient.connected;
        
        const ready = dbHealthy && mqttConnected;
        
        return new Response(JSON.stringify({
          ready,
          checks: {
            database: dbHealthy,
            mqtt: mqttConnected
          }
        }), {
          status: ready ? 200 : 503,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          ready: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })

    // ===== LIVENESS CHECK =====
    .get('/live', () => {
      return {
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };
    });
}
