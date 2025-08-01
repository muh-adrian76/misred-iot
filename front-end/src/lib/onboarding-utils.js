// Utility functions untuk onboarding system - menangani completion tracking
// Menggunakan custom events untuk komunikasi dengan to-do-list component

// Enum untuk onboarding task IDs - memudahkan tracking progress user
export const onboardingTasks = {
  DEVICE: 1,        // Membuat device pertama
  DATASTREAM: 2,    // Membuat datastream pertama  
  DASHBOARD: 3,     // Membuat dashboard pertama
  WIDGET: 4,        // Menambah widget ke dashboard
  ALARM: 5,         // Membuat alarm/notifikasi
};

// Core function untuk mark task completion via custom events
// Digunakan oleh semua task completion functions di bawah
export const completeOnboardingTask = async (taskId) => {
  // Dispatch custom event untuk notify to-do-list component
  const event = new CustomEvent('onboarding-task-completed', {
    detail: { taskId }
  });
  
  // console.log(`🎯 Dispatching onboarding task ${taskId} completion event`);
  window.dispatchEvent(event);
  
  // Small delay untuk ensure event processing
  setTimeout(() => {
    // console.log(`✅ Onboarding task ${taskId} event dispatched successfully`);
  }, 100);
};

// Helper functions untuk mark specific task completions
// Dipanggil dari form submission handlers di berbagai komponen

export const markDeviceCreated = () => {
  // console.log('Device created - marking onboarding task 1 complete');
  completeOnboardingTask(onboardingTasks.DEVICE);
};

export const markDatastreamCreated = () => {
  // console.log('Datastream created - marking onboarding task 2 complete');
  completeOnboardingTask(onboardingTasks.DATASTREAM);
};

export const markDashboardCreated = () => {
  // console.log('Dashboard created - marking onboarding task 3 complete');
  completeOnboardingTask(onboardingTasks.DASHBOARD);
};

export const markWidgetCreated = () => {
  // console.log('Widget created - marking onboarding task 4 complete');
  completeOnboardingTask(onboardingTasks.WIDGET);
};

export const markAlarmCreated = () => {
  // console.log('Alarm created - marking onboarding task 5 complete');
  completeOnboardingTask(onboardingTasks.ALARM);
};
