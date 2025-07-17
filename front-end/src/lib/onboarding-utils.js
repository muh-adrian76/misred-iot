// Utility functions untuk menangani onboarding task completion
export const onboardingTasks = {
  DEVICE: 1,
  DATASTREAM: 2,
  DASHBOARD: 3,
  WIDGET: 4,
  ALARM: 5,
};

export const completeOnboardingTask = async (taskId) => {
  // Dispatch custom event untuk notify to-do-list
  window.dispatchEvent(new CustomEvent('onboarding-task-completed', {
    detail: { taskId }
  }));
  
  console.log(`Onboarding task ${taskId} completed event dispatched`);
};

export const markDeviceCreated = () => {
  console.log('Device created - marking onboarding task 1 complete');
  completeOnboardingTask(onboardingTasks.DEVICE);
};

export const markDatastreamCreated = () => {
  console.log('Datastream created - marking onboarding task 2 complete');
  completeOnboardingTask(onboardingTasks.DATASTREAM);
};

export const markDashboardCreated = () => {
  console.log('Dashboard created - marking onboarding task 3 complete');
  completeOnboardingTask(onboardingTasks.DASHBOARD);
};

export const markWidgetCreated = () => {
  console.log('Widget created - marking onboarding task 4 complete');
  completeOnboardingTask(onboardingTasks.WIDGET);
};

export const markAlarmCreated = () => {
  console.log('Alarm created - marking onboarding task 5 complete');
  completeOnboardingTask(onboardingTasks.ALARM);
};
