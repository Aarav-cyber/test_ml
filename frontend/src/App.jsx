import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { io } from "socket.io-client";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import Strangers from "./pages/Strangers";
import Integration from "./pages/Integration";
import Toast from "./components/Toast";
import CameraModal from "./components/CameraModal";

// Small helper: play a beep using Web Audio API (no external asset required)
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.6);
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 700);
  } catch (e) {
    // ignore audio errors (browser autoplay policies may block until user interaction)
    console.warn("beep failed", e);
  }
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.28 }}
            >
              <Dashboard />
            </motion.div>
          }
        />
        <Route
          path="/logs"
          element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.28 }}
            >
              <Logs />
            </motion.div>
          }
        />
        <Route
          path="/strangers"
          element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.28 }}
            >
              <Strangers />
            </motion.div>
          }
        />
        <Route
          path="/integration"
          element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.28 }}
            >
              <Integration />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [notification, setNotification] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    // connect to backend socket
    const socket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setSocketConnected(true);
      console.log("connected to socket", socket.id);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("strangerAlert", (event) => {
      setNotification({
        message: "Stranger detected! Click to view.",
        type: "stranger",
        event,
      });
      playBeep();
    });

    socket.on("newEvent", (event) => {
      // show a subtle notification for family events
      if (event.type === "family") {
        setNotification({
          message: "Family member detected",
          type: "family",
          event,
        });
      }
    });

    socket.on("openCamera", () => {
      setShowCamera(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />

        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <AnimatedRoutes />
        </main>

        {notification && (
          <Toast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Camera modal triggered by backend (socket event 'openCamera' from main.py) */}
        <CameraModal
          open={showCamera}
          onClose={() => setShowCamera(false)}
          setNotification={setNotification}
          autoStart={true}
        />
      </div>
    </Router>
  );
}

export default App;
