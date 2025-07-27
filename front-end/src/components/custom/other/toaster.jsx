"use client";

import React from "react";
import { toast as sonnerToast } from "sonner";
import { CheckCircle, Info, AlertTriangle } from "lucide-react";

function toast(toast) {
  return sonnerToast.custom((id) => (
    <Toast
      id={id}
      title={toast.title}
      description={toast.description}
      type={toast.type}
    />
  ));
}

function Toast(props) {
  const { title, description, type } = props;

  // Konfigurasi untuk setiap tipe toast
  const getToastConfig = (type) => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          iconBg: "bg-green-100 dark:bg-green-900",
          shadowColor: "shadow-sm dark:shadow-green-900",
        };
      case "info":
        return {
          icon: <Info className="h-4 w-4 text-blue-500" />,
          iconBg: "bg-blue-100 dark:bg-blue-900",
          shadowColor: "shadow-sm dark:shadow-blue-900",
        };
      case "error":
        return {
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          iconBg: "bg-red-100 dark:bg-red-900",
          shadowColor: "shadow-sm dark:shadow-red-900",
        };
      default:
        return {
          icon: <Info className="h-4 w-4 text-gray-500" />,
          iconBg: "bg-gray-100 dark:bg-gray-900",
          shadowColor: "shadow-sm dark:shadow-gray-900",
        };
    }
  };

  const config = getToastConfig(type);

  return (
    <div
      className={`
      flex justify-center items-center py-3 px-5 w-full md:min-w-[350px]
      bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-700
      rounded-lg ${config.shadowColor}
      transition-all duration-200 ease-in-out
      hover:shadow-lg
    `}
    >
      {/* Icon Container */}
      <div
        className={`
        flex-shrink-0 w-6 h-6 rounded-full
        ${config.iconBg}
        flex items-center justify-center
        mr-3
      `}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 font-sans">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {description}
        </p>
      </div>
    </div>
  );
}

// Fungsi helper untuk memanggil toast dengan mudah
export function successToast(title, description) {
  toast({
    type: "success",
    title,
    description,
  });
}

export function infoToast(title, description) {
  toast({
    type: "info",
    title,
    description,
  });
}

export function errorToast(title, description) {
  toast({
    type: "error",
    title,
    description,
  });
}
