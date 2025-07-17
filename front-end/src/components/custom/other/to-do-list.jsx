import React, { useState, useEffect } from "react";
import {
  Check,
  ChevronRight,
  X,
  Sparkles,
  LucideLayoutDashboard,
  Cpu,
  ClipboardList,
  ClipboardCheck,
  AlarmClockPlus,
  ChartNoAxesCombined,
  CircuitBoard,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/helper";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/providers/user-provider";
import { motion, AnimatePresence } from "framer-motion";

const ToDoList = () => {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useAuth();
  const { user } = useUser();

  // Fetch onboarding progress from API
  useEffect(() => {
    const fetchProgress = async () => {
      if (!isAuthenticated || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetchFromBackend("/user/onboarding-progress");
        if (res.ok) {
          const data = await res.json();
          setCompletedTasks(data.progress || []);
          console.log("ToDoList: Fetched progress:", data.progress);
        }
      } catch (error) {
        console.error("Error fetching onboarding progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [isAuthenticated, user?.id]);

  // Listen for task completion events
  useEffect(() => {
    const handleTaskCompletion = async (event) => {
      const { taskId } = event.detail;
      console.log("ToDoList: Received task completion event for task", taskId);

      if (!completedTasks.includes(taskId)) {
        console.log("ToDoList: Task not completed yet, updating...");
        setCompletedTasks((prev) => {
          const newTasks = [...prev, taskId];
          console.log("ToDoList: New completed tasks:", newTasks);
          return newTasks;
        });
        await updateProgress(taskId, true);
      } else {
        console.log("ToDoList: Task already completed");
      }
    };

    window.addEventListener("onboarding-task-completed", handleTaskCompletion);
    return () => {
      window.removeEventListener(
        "onboarding-task-completed",
        handleTaskCompletion
      );
    };
  }, [completedTasks]);

  const updateProgress = async (taskId, completed) => {
    console.log(
      "ToDoList: Updating progress for task",
      taskId,
      "completed:",
      completed
    );
    try {
      const response = await fetchFromBackend("/user/onboarding-progress", {
        method: "POST",
        body: JSON.stringify({ taskId, completed }),
      });

      if (response.ok) {
        console.log("ToDoList: Progress updated successfully");
      } else {
        console.error("ToDoList: Failed to update progress");
      }
    } catch (error) {
      console.error("ToDoList: Error updating progress:", error);
    }
  };

  const tasks = [
    {
      id: 1,
      title: "Buat Device",
      description: "Buat device pertama Anda untuk mulai mengumpulkan data.",
      icon: <Cpu className="w-5 h-5 text-gray-500" />,
    },
    {
      id: 2,
      title: "Buat Datastream",
      description:
        "Siapkan datastream untuk mengelola aliran data dari device.",
      icon: <CircuitBoard className="w-5 h-5 text-gray-500" />,
    },
    {
      id: 3,
      title: "Buat Dashboard",
      description: "Buat dashboard untuk memvisualisasikan data Anda.",
      icon: <LucideLayoutDashboard className="w-5 h-5 text-gray-500" />,
    },
    {
      id: 4,
      title: "Buat Widget",
      description:
        "Tambahkan widget ke dashboard untuk tampilan yang lebih interaktif.",
      icon: <ChartNoAxesCombined className="w-5 h-5 text-gray-500" />,
    },
    {
      id: 5,
      title: "Buat Alarm",
      description: "Siapkan alarm untuk notifikasi otomatis.",
      icon: <AlarmClockPlus className="w-5 h-5 text-gray-500" />,
    },
  ];

  const completionPercentage = (completedTasks.length / tasks.length) * 100;

  // Remove manual toggle task function - tasks can only be completed by actual actions
  // const toggleTask = async (taskId) => {
  //   // This is disabled - tasks are auto-completed when user performs actions
  // };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Don't show if loading
  if (loading) {
    console.log("ToDoList: Still loading...");
    return null;
  }

  // For debugging
  //   console.log('ToDoList render:', {
  //     loading,
  //     completedTasks,
  //     completionPercentage,
  //     isAuthenticated,
  //     userId: user?.id
  //   });

  // Don't show if all tasks are completed
  if (completionPercentage === 100) {
    console.log("ToDoList: All tasks completed, hiding");
    return null;
  }

  const CircularProgress = ({ percentage, size = "normal" }) => {
    const radius = size === "small" ? 16 : 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const svgSize = size === "small" ? 36 : 40;

    return (
      <div className={`relative ${size === "small" ? "w-9 h-9" : "w-10 h-10"}`}>
        <svg
          className={`${size === "small" ? "w-9 h-9" : "w-10 h-10"} transform -rotate-90`}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={size === "small" ? "#fed7d7" : "#fecaca"}
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="#dc2626"
            strokeWidth="3"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {percentage === 100 ? (
            <Sparkles
              className={`${size === "small" ? "w-3 h-3" : "w-4 h-4"} text-red-600`}
            />
          ) : (
            <span
              className={`${size === "small" ? "text-xs" : "text-xs"} font-semibold text-gray-700`}
            >
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    );
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <div
          className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-2xl cursor-pointer hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
          onClick={toggleMinimize}
        >
          <CircularProgress percentage={completionPercentage} size="small" />

          {/* Notification Badge */}
          {completedTasks.length < tasks.length && (
            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-700 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-white">
                {tasks.length - completedTasks.length}
              </span>
            </div>
          )}

          {/* Success Badge */}
          {completionPercentage === 100 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </div>
          )}

          {/* Pulse Animation */}
          <div className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed bottom-4 right-4 max-sm:w-8/9 max-sm:left-1/2 max-sm:-translate-x-1/2 sm:bottom-6 sm:right-6 sm:left-auto z-50 max-w-sm w-full sm:w-auto"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: .5, delay: .5, ease: "easeInOut" }}
    >
      <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-2xl border border-red-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-white/20 p-1.5 sm:p-2 rounded-full">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Mulai Sekarang!</h2>
              <p className="text-red-100 text-xs sm:text-sm">
                {completedTasks.length}/{tasks.length} tugas selesai
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-white/20 p-0.5 sm:p-1 rounded-full">
              <CircularProgress percentage={completionPercentage} />
            </div>
            <button
              onClick={toggleMinimize}
              className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-80 sm:max-h-96 overflow-y-auto">
          {/* Progress Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-xs sm:text-sm font-semibold text-red-600">
                {completionPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-red-100 rounded-full h-2 sm:h-2.5">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 h-2 sm:h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-2 sm:space-y-3">
            {tasks.map((task, index) => {
              const isCompleted = completedTasks.includes(task.id);
              return (
                <div
                  key={task.id}
                  className={`group relative flex items-center p-3 sm:p-4 rounded-xl border transition-all duration-300 ${
                    isCompleted
                      ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-md"
                      : "bg-white border-gray-200"
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Task Number/Check */}
                  <div className="flex-shrink-0 mr-3 sm:mr-4">
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-red-600 text-white shadow-lg transform scale-110"
                          : "bg-white border-2 border-gray-300 group-hover:border-red-300"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <span className="text-xs font-bold text-gray-600">
                          {task.id}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Task Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center space-x-2 mb-1 text-start">
                      {/* <span className="text-lg">{task.icon}</span> */}
                      <h3
                        className={`text-sm sm:text-base font-semibold transition-all duration-200 ${
                          isCompleted
                            ? "text-red-800 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </h3>
                    </div>
                    <p
                      className={`text-xs sm:text-sm transition-all duration-200 ${
                        isCompleted ? "text-red-600" : "text-gray-600"
                      }`}
                    >
                      {task.description}
                    </p>
                  </div>

                  {/* Arrow - Status indicator only */}
                  <div className="flex-shrink-0 ml-3">
                    {isCompleted ? (
                      <ClipboardCheck className="w-5 h-5 text-red-600" />
                    ) : (
                      <ClipboardList className="w-5 h-5 text-gray-600"/>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion Message */}
          {completionPercentage === 100 && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 animate-pulse">
              <div className="flex items-center justify-center space-x-2">
                <div className="bg-red-600 p-1.5 sm:p-2 rounded-full">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="text-center">
                  <h4 className="text-sm sm:text-base font-bold text-red-800">Selamat! 🎉</h4>
                  <p className="text-xs sm:text-sm text-red-600">
                    Anda telah menyelesaikan semua tugas onboarding.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ToDoList;
