import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  XMarkIcon,
  CameraIcon,
  PlayIcon,
  StopIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { io } from "socket.io-client";

export default function CameraModal({
  open,
  onClose,
  setNotification,
  autoStart = false,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState({ faces: [], packages: [] });
  const detectionIntervalRef = useRef(null);
  const autoStartRef = useRef(autoStart);
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });
        if (!mounted) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (err) {
        console.error("Camera access error", err);
        setNotification &&
          setNotification({
            message: "Camera access denied or unavailable",
            type: "error",
          });
        onClose && onClose();
      }
    }

    if (open) start();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      setIsDetecting(false);
      setReady(false);
    };
  }, [open, onClose, setNotification]);

  // Listen for live detections from main.py via Socket.IO
  useEffect(() => {
    if (!open) return;

    const socket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("liveDetections", (data) => {
      // Update detections with data from main.py (YOLOv8 + face recognition)
      console.log("📡 Live detections from main.py:", data);

      const newDetections = {
        faces: data.faces || [],
        packages: data.packages || [],
      };

      console.log(
        `✅ Main.py detections: ${newDetections.faces.length} faces, ${newDetections.packages.length} packages`
      );

      setDetections(newDetections);

      // Show notifications
      if (data.stranger_detected) {
        setNotification &&
          setNotification({
            message: "🚨 Stranger detected!",
            type: "stranger",
          });
      }
      if (data.package_stolen) {
        setNotification &&
          setNotification({
            message: "⚠️ Package theft detected!",
            type: "error",
          });
      }
      if (data.package_detected && data.packages && data.packages.length > 0) {
        console.log(`📦 Package detected: ${data.packages.length} item(s)`);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [open, setNotification]);

  // Define processFrame first
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !ready) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!canvas) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Capture frame
    const blob = await new Promise((resolve) => {
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, "image/jpeg", 0.8);
    });

    if (!blob) return;

    // Send to backend for processing
    const form = new FormData();
    form.append("image", blob, "frame.jpg");

    try {
      const res = await fetch("http://localhost:3001/api/process_image", {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        console.log("📊 Detection data received:", data);

        const newDetections = {
          faces: data.faces || [],
          packages: data.packages || [],
        };

        console.log(
          `✅ Detections: ${newDetections.faces.length} faces, ${newDetections.packages.length} packages`
        );

        setDetections(newDetections);

        // Show notifications for important events
        if (data.stranger_detected) {
          setNotification &&
            setNotification({
              message: "🚨 Stranger detected!",
              type: "stranger",
            });
        }
        if (data.package_stolen) {
          setNotification &&
            setNotification({
              message: "⚠️ Package theft detected!",
              type: "error",
            });
        }
      } else {
        console.error("Detection API error:", res.status, await res.text());
      }
    } catch (err) {
      console.error("Detection error:", err);
      setNotification &&
        setNotification({
          message: `Detection error: ${err.message}`,
          type: "error",
        });
    }
  }, [ready, setNotification]);

  // Define startDetection after processFrame
  const startDetection = useCallback(() => {
    if (!ready || isDetecting) return;
    setIsDetecting(true);
    // Process frame every 2 seconds for real-time detection
    detectionIntervalRef.current = setInterval(() => {
      processFrame();
    }, 2000);
    // Process immediately
    processFrame();
  }, [ready, isDetecting, processFrame]);

  // Update autoStart ref when prop changes and auto-start detection if needed
  useEffect(() => {
    autoStartRef.current = autoStart;
    if (autoStart && ready && !isDetecting) {
      // Small delay to ensure video stream is fully ready
      const timer = setTimeout(() => {
        startDetection();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, ready, isDetecting, startDetection]);

  const stopDetection = () => {
    setIsDetecting(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setDetections({ faces: [], packages: [] });
  };

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  // Draw detection overlays
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const video = videoRef.current;

    const draw = () => {
      if (!video.videoWidth || !video.videoHeight) {
        requestAnimationFrame(draw);
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw face detections
      if (detections.faces && detections.faces.length > 0) {
        detections.faces.forEach((face) => {
          if (!face.location || face.location.length !== 4) return;

          const [left, top, right, bottom] = face.location;
          const isStranger = face.is_stranger;

          // Ensure coordinates are valid
          if (isNaN(left) || isNaN(top) || isNaN(right) || isNaN(bottom))
            return;

          // Draw rectangle
          ctx.strokeStyle = isStranger ? "#ef4444" : "#10b981";
          ctx.lineWidth = 3;
          ctx.strokeRect(left, top, right - left, bottom - top);

          // Draw label background
          ctx.fillStyle = isStranger ? "#ef4444" : "#10b981";
          ctx.fillRect(left, Math.max(0, top - 30), right - left, 30);

          // Draw label text
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(
            face.name || (isStranger ? "Stranger" : "Family"),
            left + 5,
            Math.max(15, top - 8)
          );
        });
      }

      // Draw package detections
      if (detections.packages && detections.packages.length > 0) {
        detections.packages.forEach((pkg) => {
          if (!pkg.location || pkg.location.length !== 4) return;

          const [x1, y1, x2, y2] = pkg.location;

          // Ensure coordinates are valid
          if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return;

          // Draw rectangle
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 3;
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

          // Draw label
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(x1, Math.max(0, y1 - 25), x2 - x1, 25);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 14px sans-serif";
          const label = `${pkg.label || "Package"} (${(
            (pkg.confidence || 0) * 100
          ).toFixed(0)}%)`;
          ctx.fillText(label, x1 + 5, Math.max(15, y1 - 8));
        });
      }

      requestAnimationFrame(draw);
    };

    // Always show overlays if we have detections (from main.py or frontend detection)
    // Also show canvas when detecting to prepare for overlays
    if (ready) {
      const hasDetections =
        (detections.faces && detections.faces.length > 0) ||
        (detections.packages && detections.packages.length > 0);

      if (isDetecting || hasDetections) {
        console.log("🎨 Drawing overlays:", {
          faces: detections.faces?.length || 0,
          packages: detections.packages?.length || 0,
          isDetecting,
        });
        draw();
      } else {
        // Just draw video without overlays
        const drawVideo = () => {
          if (video.videoWidth && video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
          if (ready) {
            requestAnimationFrame(drawVideo);
          }
        };
        drawVideo();
      }
    }
  }, [detections, isDetecting, ready]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <CameraIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Live Security Camera
              </h3>
              <p className="text-xs text-gray-600">
                {ready
                  ? isDetecting
                    ? "🔴 Frontend detection active"
                    : detections.faces.length > 0 ||
                      detections.packages.length > 0
                    ? "📡 Receiving detections from main.py"
                    : "Ready to start detection"
                  : "Initializing..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Video Feed with Overlay Canvas */}
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center min-h-[480px] overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            autoPlay
            muted
            style={{
              display:
                isDetecting ||
                (detections.faces && detections.faces.length > 0) ||
                (detections.packages && detections.packages.length > 0)
                  ? "none"
                  : "block",
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              display:
                isDetecting ||
                (detections.faces && detections.faces.length > 0) ||
                (detections.packages && detections.packages.length > 0)
                  ? "block"
                  : "none",
            }}
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                <p className="text-white/80">Initializing camera...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {(isDetecting ||
                (detections.faces && detections.faces.length > 0) ||
                (detections.packages && detections.packages.length > 0)) && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>
                      {isDetecting
                        ? "Frontend detecting"
                        : "Receiving from main.py (YOLOv8)"}
                    </span>
                  </div>
                  {detections.faces && detections.faces.length > 0 && (
                    <span className="text-blue-600 font-medium">
                      {detections.faces.length} face(s)
                      {detections.faces.some((f) => f.is_stranger) && (
                        <span className="text-red-600 ml-1">(1 stranger)</span>
                      )}
                    </span>
                  )}
                  {detections.packages && detections.packages.length > 0 && (
                    <span className="text-orange-600 font-medium">
                      {detections.packages.length} package(s) via YOLOv8
                    </span>
                  )}
                </div>
              )}
              {!isDetecting &&
                (!detections.faces || detections.faces.length === 0) &&
                (!detections.packages || detections.packages.length === 0) &&
                ready &&
                'Click "Start Detection" or run main.py to see detections'}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
              >
                Close
              </button>
              {!isDetecting ? (
                <button
                  onClick={startDetection}
                  disabled={!ready}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg shadow-green-500/30 flex items-center space-x-2"
                >
                  <PlayIcon className="w-5 h-5" />
                  <span>Start Detection</span>
                </button>
              ) : (
                <button
                  onClick={stopDetection}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all duration-200 font-medium shadow-lg shadow-red-500/30 flex items-center space-x-2"
                >
                  <StopIcon className="w-5 h-5" />
                  <span>Stop Detection</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
