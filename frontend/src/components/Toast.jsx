import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function Toast({ message, type = "family", onClose }) {
  const getConfig = () => {
    switch (type) {
      case "stranger":
        return {
          icon: ExclamationTriangleIcon,
          bg: "bg-gradient-to-r from-red-600 to-rose-600",
          shadow: "shadow-red-500/30",
        };
      case "error":
        return {
          icon: ExclamationTriangleIcon,
          bg: "bg-gradient-to-r from-red-600 to-rose-600",
          shadow: "shadow-red-500/30",
        };
      case "success":
        return {
          icon: CheckCircleIcon,
          bg: "bg-gradient-to-r from-green-600 to-emerald-600",
          shadow: "shadow-green-500/30",
        };
      default:
        return {
          icon: CheckCircleIcon,
          bg: "bg-gradient-to-r from-green-600 to-emerald-600",
          shadow: "shadow-green-500/30",
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0, scale: 0.9 }}
        className={`fixed top-6 right-6 z-50 ${config.bg} text-white rounded-xl shadow-lg ${config.shadow} p-4 min-w-[300px] max-w-md`}
      >
        <div className="flex items-start space-x-3">
          <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
