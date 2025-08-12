// Import library dan komponen yang diperlukan untuk To-Do List onboarding
import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  ChevronRight,
  X,
  LucideLayoutDashboard,
  Cpu,
  ClipboardList,
  ClipboardCheck,
  AlarmClockPlus,
  ChartNoAxesCombined,
  CircuitBoard,
  Goal,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/helper";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/providers/user-provider";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "next-view-transitions";
import confetti from "canvas-confetti"; // Import confetti untuk celebrasi
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog"; // Import ResponsiveDialog untuk celebration modal

/**
 * Komponen ToDoList
 * 
 * Komponen panduan onboarding interaktif untuk pengguna baru aplikasi IoT.
 * Menampilkan daftar tugas yang harus diselesaikan untuk memulai menggunakan
 * sistem IoT dengan progress tracking real-time dan animasi yang menarik.
 * 
 * Fitur utama:
 * - Progress tracking dengan API backend
 * - Animasi smooth dengan Framer Motion
 * - Mode minimized untuk UX yang tidak mengganggu
 * - Event listener untuk task completion
 * - Responsive design untuk mobile dan desktop
 * - Auto-hide ketika semua task selesai
 */
const ToDoList = () => {
  // State management untuk komponen
  const [completedTasks, setCompletedTasks] = useState([]); // Daftar task yang sudah selesai
  const [isMinimized, setIsMinimized] = useState(false); // Status minimize widget
  const [loading, setLoading] = useState(true); // Status loading data
  const [showCelebration, setShowCelebration] = useState(false); // Status celebrasi completion
  const [celebrationTriggered, setCelebrationTriggered] = useState(false); // Flag untuk mencegah celebrasi berulang
  // Hooks untuk otentikasi dan data pengguna
  const { isAuthenticated } = useAuth();
  const { user } = useUser();

  /**
   * Fungsi untuk mengambil data progress dari backend
   * Menggunakan useCallback untuk optimasi performa dan mencegah re-render berlebihan
   */
  const fetchProgress = useCallback(async () => {
    // Cek apakah user sudah login dan memiliki ID
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Request ke API untuk mendapatkan progress onboarding user
      const res = await fetchFromBackend("/user/onboarding-progress");
      if (res.ok) {
        const data = await res.json();
        // Backend mengembalikan { success: true, progress: [...], completed: boolean }
        setCompletedTasks(data.progress || []);
        // console.log("ToDoList: Fetched progress:", data.progress);
      }
    } catch (error) {
      console.error("Error fetching onboarding progress:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Fetch onboarding progress from API
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Listen for task completion events
  useEffect(() => {
    const handleTaskCompletion = async (event) => {
      const { taskId } = event.detail;
      // console.log("ToDoList: Received task completion event for task", taskId);

      // Update backend first
      try {
        await updateProgress(taskId, true);
        
        // Refresh data from backend to ensure consistency
        await fetchProgress();
        
      } catch (error) {
        console.error("ToDoList: Error updating progress:", error);
        // On error, still try to refresh from backend
        await fetchProgress();
      }
    };

    window.addEventListener("onboarding-task-completed", handleTaskCompletion);
    return () => {
      window.removeEventListener(
        "onboarding-task-completed",
        handleTaskCompletion
      );
    };
  }, [fetchProgress]); // Add fetchProgress dependency

  const updateProgress = async (taskId, completed) => {
    // console.log(
    //   "ToDoList: Updating progress for task",
    //   taskId,
    //   "completed:",
    //   completed
    // );
    try {
      const response = await fetchFromBackend("/user/onboarding-progress", {
        method: "POST",
        body: JSON.stringify({ taskId, completed }),
      });

      if (response.ok) {
        // console.log("ToDoList: Progress updated successfully");
      } else {
        console.error("ToDoList: Failed to update progress");
      }
    } catch (error) {
      console.error("ToDoList: Error updating progress:", error);
    }
  };

  /**
   * Daftar task onboarding yang harus diselesaikan pengguna baru
   * Setiap task memiliki ID unik, judul, deskripsi, ikon, dan URL tujuan
   * Urutan task dirancang untuk memandu user secara logis dalam setup IoT
   */
  const tasks = [
    {
      id: 1,
      title: "Buat Device",
      description: "untuk mulai mengumpulkan data",
      icon: <Cpu className="w-5 h-5 text-gray-500" />,
      url: "/devices",
    },
    {
      id: 2,
      title: "Buat Datastream", 
      description: "untuk mengelola aliran data dari device",
      icon: <CircuitBoard className="w-5 h-5 text-gray-500" />,
      url: "/datastreams",
    },
    {
      id: 3,
      title: "Buat Dashboard",
      description: "untuk memvisualisasikan data",
      icon: <LucideLayoutDashboard className="w-5 h-5 text-gray-500" />,
      url: "/dashboards",
    },
    {
      id: 4,
      title: "Buat Widget",
      description: "untuk tampilan yang lebih interaktif",
      icon: <ChartNoAxesCombined className="w-5 h-5 text-gray-500" />,
      url: "/dashboards",
    },
    {
      id: 5,
      title: "Buat Alarm",
      description: "untuk notifikasi otomatis",
      icon: <AlarmClockPlus className="w-5 h-5 text-gray-500" />,
      url: "/alarms",
    },
  ];

  // Kalkulasi persentase completion berdasarkan task yang sudah selesai
  const completionPercentage = (completedTasks.length / tasks.length) * 100;

  /**
   * Function untuk memicu efek confetti fireworks saat onboarding selesai
   * Menggunakan animasi confetti yang spektakuler dengan multiple origins
   */
  const triggerCelebrationFireworks = useCallback(() => {
    const duration = 5 * 1000; // Durasi celebrasi 5 detik
    const animationEnd = Date.now() + duration;
    const defaults = { 
      startVelocity: 30, 
      spread: 360, 
      ticks: 60, 
      zIndex: 9999 // Pastikan confetti tampil di atas semua element
    };

    // Function untuk generate random number dalam range
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    // Interval untuk continuous confetti
    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Confetti dari kiri
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      
      // Confetti dari kanan
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Confetti burst awal yang lebih spektakuler
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 9999
    });
  }, []);

  // Effect untuk trigger celebrasi ketika semua task selesai
  useEffect(() => {
    if (completionPercentage === 100 && !celebrationTriggered && !loading) {
      setShowCelebration(true);
      setCelebrationTriggered(true);
      triggerCelebrationFireworks();
      
      // Modal akan ditutup manual oleh user, tidak auto-hide
      // User mengontrol kapan modal ditutup dengan tombol "Lanjutkan"
    }
  }, [completionPercentage, celebrationTriggered, loading, triggerCelebrationFireworks]);

  /**
   * Fungsi untuk toggle status minimize/maximize widget
   */
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Kondisi render: jangan tampilkan jika masih loading
  if (loading) {
    // console.log("ToDoList: Still loading...");
    return null;
  }

  // Debug logging untuk development (dapat dihapus di production)
  //   console.log('ToDoList render:', {
  //     loading,
  //     completedTasks,
  //     completionPercentage,
  //     isAuthenticated,
  //     userId: user?.id
  //   });

  // Kondisi render: sembunyikan widget jika semua task sudah selesai DAN modal sudah ditutup user
  // Memberikan clean UX setelah onboarding selesai
  if (completionPercentage === 100 && !showCelebration && celebrationTriggered) {
    // console.log("ToDoList: All tasks completed and celebration dismissed by user, hiding");
    return null;
  }

  /**
   * Komponen CircularProgress
   * 
   * Komponen progress bar circular untuk menampilkan persentase completion
   * dengan SVG yang responsif dan animasi smooth. Mendukung dua ukuran
   * berbeda untuk mode normal dan minimized.
   * 
   * @param {number} percentage - Persentase progress (0-100)
   * @param {string} size - Ukuran progress ("normal" atau "small")
   */
  const CircularProgress = ({ percentage, size = "normal" }) => {
    // Kalkulasi dimensi berdasarkan ukuran
    const radius = size === "small" ? 16 : 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const svgSize = size === "small" ? 36 : 40;

    return (
      <div className={`relative ${size === "small" ? "w-9 h-9" : "w-10 h-10"}`}>
        {/* SVG progress circle dengan transformasi rotasi -90 derajat */}
        <svg
          className={`${size === "small" ? "w-9 h-9" : "w-10 h-10"} transform -rotate-90`}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          {/* Background circle (track) */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={size === "small" ? "#fed7d7" : "#fecaca"}
            strokeWidth="3"
            fill="none"
            className="dark:stroke-gray-600"
          />
          {/* Progress circle (actual progress) */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="#dc2626"
            strokeWidth="3"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out dark:stroke-red-400"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {percentage === 100 ? (
            <Goal
              className={`${size === "small" ? "w-3 h-3" : "w-4 h-4"} text-red-600 dark:text-red-400`}
            />
          ) : (
            <span
              className={`${size === "small" ? "text-xs" : "text-xs"} font-semibold text-white`}
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
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50">
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
      <div className="bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-red-100 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-white/20 dark:bg-white/25 p-1.5 sm:p-2 rounded-full">
              <Goal className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-md font-bold">Panduan Pengguna Baru!</h2>
              <p className="text-red-100 dark:text-red-200 text-xs sm:text-sm">
                {completedTasks.length}/{tasks.length} langkah sudah selesai
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-white/20 dark:bg-white/25 p-0.5 sm:p-1 rounded-full">
              <CircularProgress percentage={completionPercentage} />
            </div>
            <button
              onClick={toggleMinimize}
              className="p-1 hover:bg-white/20 dark:hover:bg-white/25 rounded-full transition-colors duration-200"
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
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Progres
              </span>
              <span className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">
                {completionPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-red-100 dark:bg-gray-700 rounded-full h-2 sm:h-2.5">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 h-2 sm:h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-2 sm:space-y-3">
            {tasks.map((task, index) => {
              const isCompleted = completedTasks.includes(task.id);
              return (
                <Link
                  key={task.id}
                  href={task.url}
                  className="block"
                >
                  <div
                    className={`group relative flex items-center p-3 sm:p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-lg ${
                      isCompleted
                        ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700 shadow-md"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
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
                          ? "bg-red-600 dark:bg-red-500 text-white shadow-lg transform scale-110"
                          : "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 group-hover:border-red-300 dark:group-hover:border-red-500"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
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
                            ? "text-red-800 dark:text-red-300 line-through"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {task.title}
                      </h3>
                    </div>
                    <p
                      className={`text-xs sm:text-sm transition-all duration-200 ${
                        isCompleted ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {task.description}
                    </p>
                  </div>

                  {/* Arrow - Status indicator only */}
                  <div className="flex-shrink-0 ml-3">
                    {isCompleted ? (
                      <ClipboardCheck className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <ClipboardList className="w-5 h-5 text-gray-600 dark:text-gray-400"/>
                    )}
                  </div>
                </div>
                </Link>
              );
            })}
          </div>

          {/* Completion Message dengan Celebrasi dalam Modal */}
          <ResponsiveDialog
            open={showCelebration}
            setOpen={setShowCelebration}
            title="🎉 Selamat! Luar Biasa! 🎉"
            description="Anda telah berhasil menyelesaikan semua langkah panduan! Sistem IoT Anda siap digunakan!"
            content={
              <div className="text-center space-y-4">
                {/* Celebrasi Header - Simplified untuk mobile */}
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="inline-block"
                >
                  <div className="bg-gradient-to-r from-red-500 to-yellow-500 dark:from-red-400 dark:to-yellow-400 p-3 rounded-full shadow-lg mx-auto w-fit">
                    <Goal className="w-6 h-6 text-white" />
                  </div>
                </motion.div>

                {/* Achievement Stats - Kompak untuk mobile */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-3 gap-2 max-w-xs mx-auto"
                >
                  <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {tasks.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Tugas
                    </div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      100%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Selesai
                    </div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      ✨
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Status
                    </div>
                  </div>
                </motion.div>

                {/* Motivational Message - Simplified */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center p-3 bg-gradient-to-r from-red-100 to-yellow-100 dark:from-red-900/40 dark:to-yellow-900/40 rounded-lg border border-red-200 dark:border-red-700 max-w-sm mx-auto"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">
                    🚀 <strong>Sekarang Anda dapat:</strong>
                  </p>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>✅ Memantau device IoT real-time</div>
                    <div>✅ Mengelola data sensor</div>
                    <div>✅ Membuat visualisasi data</div>
                    <div>✅ Mengatur alarm otomatis</div>
                  </div>
                </motion.div>
              </div>
            }
            confirmText="Tutup"
            oneButton={true}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ToDoList;
