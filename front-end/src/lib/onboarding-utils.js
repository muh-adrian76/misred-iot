// Fungsi utilitas untuk sistem onboarding - menangani pelacakan penyelesaian
// Menggunakan custom event untuk komunikasi dengan komponen to-do-list

// Enum untuk ID task onboarding - memudahkan pelacakan progres pengguna
export const onboardingTasks = {
  DEVICE: 1,        // Membuat perangkat pertama
  DATASTREAM: 2,    // Membuat datastream pertama  
  DASHBOARD: 3,     // Membuat dashboard pertama
  WIDGET: 4,        // Menambahkan widget ke dashboard
  ALARM: 5,         // Membuat alarm/notifikasi
};

// Fungsi inti untuk menandai task selesai melalui custom event
// Dipakai oleh semua helper penyelesaian task di bawah
export const completeOnboardingTask = async (taskId) => {
  // Dispatch custom event untuk memberi tahu komponen to-do-list
  const event = new CustomEvent('onboarding-task-completed', {
    detail: { taskId }
  });
  
  // console.log(`🎯 Mengirim event penyelesaian task onboarding ${taskId}`);
  window.dispatchEvent(event);
  
  // Jeda singkat untuk memastikan event diproses
  setTimeout(() => {
    // console.log(`✅ Event task onboarding ${taskId} berhasil dikirim`);
  }, 100);
};

// Helper untuk menandai penyelesaian task tertentu
// Dipanggil dari handler submit form di berbagai komponen

export const markDeviceCreated = () => {
  // console.log('Perangkat dibuat - menandai task onboarding 1 selesai');
  completeOnboardingTask(onboardingTasks.DEVICE);
};

export const markDatastreamCreated = () => {
  // console.log('Datastream dibuat - menandai task onboarding 2 selesai');
  completeOnboardingTask(onboardingTasks.DATASTREAM);
};

export const markDashboardCreated = () => {
  // console.log('Dashboard dibuat - menandai task onboarding 3 selesai');
  completeOnboardingTask(onboardingTasks.DASHBOARD);
};

export const markWidgetCreated = () => {
  // console.log('Widget dibuat - menandai task onboarding 4 selesai');
  completeOnboardingTask(onboardingTasks.WIDGET);
};

export const markAlarmCreated = () => {
  // console.log('Alarm dibuat - menandai task onboarding 5 selesai');
  completeOnboardingTask(onboardingTasks.ALARM);
};
