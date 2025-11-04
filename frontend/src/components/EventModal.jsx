import React from "react";
import { XMarkIcon, ClockIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function EventModal({ event, onClose }) {
  if (!event) return null;

  // Handle both absolute and relative paths
  const getImageSrc = () => {
    if (!event || !event.imagePath) return "";

    // If already absolute URL, return as is
    if (event.imagePath.startsWith('http://') || event.imagePath.startsWith('https://')) {
      return event.imagePath;
    }

    // If relative path, prepend backend URL
    const path = event.imagePath.startsWith('/') ? event.imagePath : `/${event.imagePath}`;
    return `http://localhost:3001${path}`;
  };

  const src = getImageSrc();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 capitalize">
              {event.type?.replace(/_/g, " ")}
            </h2>
            <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
              <ClockIcon className="w-4 h-4" />
              <span>
                {new Date(event.timestamp).toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Image */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center min-h-[400px] max-h-[600px] overflow-hidden">
          {src ? (
            <img
              src={src}
              alt="event"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                // If image fails to load, show placeholder
                e.target.style.display = 'none';
                const placeholder = e.target.nextElementSibling;
                if (placeholder) placeholder.style.display = 'block';
              }}
            />
          ) : null}
          <div className="text-white/60 text-lg" style={{ display: src ? 'none' : 'block' }}>
            No image available
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Event ID: <span className="font-mono text-gray-900">{event._id}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
