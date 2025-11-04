import React from "react";
import { ClockIcon, UserIcon, ShieldExclamationIcon, CubeIcon } from "@heroicons/react/24/outline";

export default function EventCard({ event, onClick }) {
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

  const getEventConfig = (type) => {
    switch (type) {
      case "stranger":
        return {
          icon: ShieldExclamationIcon,
          gradient: "from-red-500 to-rose-600",
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
        };
      case "family":
        return {
          icon: UserIcon,
          gradient: "from-green-500 to-emerald-600",
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
        };
      case "package_stolen":
        return {
          icon: CubeIcon,
          gradient: "from-orange-500 to-amber-600",
          bg: "bg-orange-50",
          text: "text-orange-700",
          border: "border-orange-200",
        };
      default:
        return {
          icon: ClockIcon,
          gradient: "from-gray-500 to-slate-600",
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
        };
    }
  };

  const config = getEventConfig(event?.type);
  const Icon = config.icon;
  const typeLabel = event?.type?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Unknown";

  return (
    <div
      onClick={() => onClick && onClick(event)}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-gray-200"
    >
      {/* Image Container */}
      <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {src ? (
          <img
            src={src}
            alt="event"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // If image fails to load, show placeholder
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
            onLoad={(e) => {
              // Hide placeholder when image loads
              const placeholder = e.target.nextElementSibling;
              if (placeholder) placeholder.style.display = 'none';
            }}
          />
        ) : null}
        <div className="w-full h-full flex items-center justify-center" style={{ display: src ? 'none' : 'flex' }}>
          <div className="text-gray-400 text-sm">No image available</div>
        </div>

        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Event Type Badge */}
        <div className={`absolute top-3 right-3 ${config.bg} ${config.border} border rounded-full px-3 py-1.5 backdrop-blur-sm bg-white/90 shadow-sm`}>
          <div className="flex items-center space-x-2">
            <Icon className={`w-4 h-4 ${config.text}`} />
            <span className={`text-xs font-semibold ${config.text}`}>{typeLabel}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-500">
            <ClockIcon className="w-4 h-4" />
            <span className="text-xs font-medium">
              {event?.timestamp
                ? new Date(event.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "Unknown time"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
