import React, { useState, useEffect } from "react";
import EventCard from "../components/EventCard";
import EventModal from "../components/EventModal";
import { fetchAllEvents } from "../services/api";
import { motion } from "framer-motion";
import { DocumentTextIcon, FunnelIcon } from "@heroicons/react/24/outline";

export default function Logs() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    fetchAllEvents()
      .then((data) => {
        if (mounted) {
          setEvents(data);
          setFilteredEvents(data);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    if (filter === "all") {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter((e) => e.type === filter));
    }
  }, [filter, events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading logs...</p>
        </div>
      </div>
    );
  }

  const filterOptions = [
    { value: "all", label: "All Events", count: events.length },
    { value: "stranger", label: "Strangers", count: events.filter((e) => e.type === "stranger").length },
    { value: "family", label: "Family", count: events.filter((e) => e.type === "family").length },
    { value: "package_stolen", label: "Alerts", count: events.filter((e) => e.type === "package_stolen").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Logs</h1>
        <p className="text-gray-600">Complete history of all security events</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <FunnelIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${filter === option.value
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-400 mb-2">No events found</div>
          <p className="text-sm text-gray-500">Try selecting a different filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev, index) => (
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
