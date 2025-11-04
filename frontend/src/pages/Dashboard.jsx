import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import EventCard from "../components/EventCard";
import EventModal from "../components/EventModal";
import CameraModal from "../components/CameraModal";
import Toast from "../components/Toast";
import { fetchLatestEvents, fetchAllEvents } from "../services/api";
import { motion } from "framer-motion";
import {
  ShieldExclamationIcon,
  UserIcon,
  CubeIcon,
  WifiIcon,
  WifiIcon as WifiIconOffline,
  CameraIcon
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [stats, setStats] = useState({ total: 0, strangers: 0, family: 0, packages: 0 });
  const [showCamera, setShowCamera] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Socket connection
    const socket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("newEvent", (newEvent) => {
      setEvents((prev) => {
        const updated = [newEvent, ...prev.slice(0, 5)];
        return updated;
      });
      // Update stats separately
      fetchAllEvents().then(updateStats);
    });

    // Fetch initial data
    let mounted = true;
    Promise.all([fetchLatestEvents(), fetchAllEvents()])
      .then(([latest, all]) => {
        if (mounted) {
          setEvents(latest);
          updateStats(all);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  const updateStats = React.useCallback((eventsList) => {
    const total = eventsList.length;
    const strangers = eventsList.filter((e) => e.type === "stranger").length;
    const family = eventsList.filter((e) => e.type === "family").length;
    const packages = eventsList.filter((e) => e.type === "package_stolen").length;
    setStats({ total, strangers, family, packages });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Monitor your home security in real-time</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCamera(true)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/30"
          >
            <CameraIcon className="w-5 h-5" />
            <span>Start Camera</span>
          </button>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${socketConnected
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-gray-50 text-gray-600 border border-gray-200"
            }`}>
            {socketConnected ? (
              <WifiIcon className="w-5 h-5" />
            ) : (
              <WifiIconOffline className="w-5 h-5" />
            )}
            <span className="font-medium text-sm">
              {socketConnected ? "Live" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <CubeIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Strangers</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.strangers}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <ShieldExclamationIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Family</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.family}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Alerts</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.packages}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <CubeIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Events */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Events</h2>
        {events.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <div className="text-gray-400 mb-2">No events yet</div>
            <p className="text-sm text-gray-500">Events will appear here when detected</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev, index) => (
              <motion.div
                key={ev._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <EventCard event={ev} onClick={setSelected} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <EventModal event={selected} onClose={() => setSelected(null)} />
      )}

      {showCamera && (
        <CameraModal
          open={showCamera}
          onClose={() => setShowCamera(false)}
          setNotification={setNotification}
          autoStart={true}
        />
      )}

      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
