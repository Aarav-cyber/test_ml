import React, { useState, useEffect } from "react";
import EventCard from "../components/EventCard";
import EventModal from "../components/EventModal";
import { fetchStrangers } from "../services/api";
import { motion } from "framer-motion";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";

export default function Strangers() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchStrangers()
      .then((data) => {
        if (mounted) {
          setEvents(data);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => (mounted = false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading stranger events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6 border border-red-100">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <ShieldExclamationIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Stranger Alerts</h1>
            <p className="text-gray-600">All detected unauthorized individuals</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Total Stranger Detections</p>
            <p className="text-4xl font-bold text-red-600 mt-2">{events.length}</p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {events[0] ? new Date(events[0].timestamp).toLocaleString() : "Never"}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <ShieldExclamationIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-400 mb-2">No stranger detections</div>
          <p className="text-sm text-gray-500">Your home is secure</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev, index) => (
            <motion.div
              key={ev._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <EventCard event={ev} onClick={setSelected} />
            </motion.div>
          ))}
        </div>
      )}

      {selected && (
        <EventModal event={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
