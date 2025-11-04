require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const Event = require("./models/Event");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    // Preserve original extension and ensure unique filename
    const ext = path.extname(file.originalname) || '.jpg';
    const name = Date.now() + "-" + file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, '_');
    // Ensure extension is present
    const finalName = name.endsWith(ext) ? name : name + ext;
    cb(null, finalName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/home_security";
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// POST event with image
app.post("/api/events", upload.single("image"), async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: "No image file provided" });
    }

    // Ensure file was saved correctly
    const filePath = path.join(__dirname, "uploads", file.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ success: false, error: "Failed to save image" });
    }

    const event = new Event({
      type: type || "unknown",
      imagePath: `/uploads/${file.filename}`,
      timestamp: new Date(),
    });

    await event.save();

    // Populate the event object with full path for response
    const eventObj = event.toObject();
    eventObj.imagePath = `/uploads/${file.filename}`;

    // Emit the new event to all connected clients
    io.emit("newEvent", eventObj);

    // If it's a stranger, emit a special alert
    if (type === "stranger") {
      io.emit("strangerAlert", eventObj);
    }

    console.log(`✅ Event created: ${type} - Image: ${file.filename}`);
    res.json({ success: true, event: eventObj });
  } catch (err) {
    console.error("Error creating event:", err);
    // Clean up uploaded file if event creation failed
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ timestamp: -1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET latest events
app.get("/api/events/latest", async (req, res) => {
  try {
    const events = await Event.find().sort({ timestamp: -1 }).limit(6);
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET stranger events
app.get("/api/events/strangers", async (req, res) => {
  try {
    const events = await Event.find({ type: "stranger" }).sort({
      timestamp: -1,
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// --- Proxy routes to Python ML service (Flask) ---
const PYTHON_API = process.env.PYTHON_API || "http://127.0.0.1:5001";

// Process image for face and package detection
app.post("/api/process_image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Forward image to Python API
    const FormData = require("form-data");
    const form = new FormData();
    form.append("image", require("fs").createReadStream(req.file.path), {
      filename: req.file.filename,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(`${PYTHON_API}/process_image`, form, {
      headers: form.getHeaders(),
    });

    const detectionData = response.data;
    const savedFilename = req.file.filename;

    // Verify file exists
    const filePath = path.join(__dirname, "uploads", savedFilename);
    if (!fs.existsSync(filePath)) {
      console.error(`Image file not found: ${filePath}`);
    }

    // If stranger detected, create event
    if (detectionData.stranger_detected) {
      const event = new Event({
        type: "stranger",
        imagePath: `/uploads/${savedFilename}`,
        timestamp: new Date(),
      });
      await event.save();
      const eventObj = event.toObject();
      eventObj.imagePath = `/uploads/${savedFilename}`;
      io.emit("strangerAlert", eventObj);
      io.emit("newEvent", eventObj);
      console.log(`🚨 Stranger event created: ${savedFilename}`);
    }

    // If package stolen, create event
    if (detectionData.package_stolen) {
      const event = new Event({
        type: "package_stolen",
        imagePath: `/uploads/${savedFilename}`,
        timestamp: new Date(),
      });
      await event.save();
      const eventObj = event.toObject();
      eventObj.imagePath = `/uploads/${savedFilename}`;
      io.emit("newEvent", eventObj);
      console.log(`📦 Package stolen event created: ${savedFilename}`);
    }

    // If family member detected
    if (detectionData.faces && detectionData.faces.length > 0) {
      const familyFaces = detectionData.faces.filter((f) => !f.is_stranger);
      if (familyFaces.length > 0) {
        const event = new Event({
          type: "family",
          imagePath: `/uploads/${savedFilename}`,
          timestamp: new Date(),
        });
        await event.save();
        const eventObj = event.toObject();
        eventObj.imagePath = `/uploads/${savedFilename}`;
        io.emit("newEvent", eventObj);
        console.log(`👨‍👩‍👧 Family event created: ${savedFilename}`);
      }
    }

    res.json(detectionData);
  } catch (err) {
    console.error("Error processing image:", err.message || err);
    res.status(500).json({ error: "Failed to process image", details: err.message });
  }
});

app.post("/api/detect_faces", async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API}/detect_faces`);
    res.json(response.data);
  } catch (err) {
    console.error("Error communicating with Python API:", err.message || err);
    res.status(500).json({ error: "Python API not reachable" });
  }
});

app.post("/api/monitor_parcel", async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API}/monitor_parcel`);
    res.json(response.data);
  } catch (err) {
    console.error("Error communicating with Python API:", err.message || err);
    res.status(500).json({ error: "Python API not reachable" });
  }
});

// Trigger frontend camera via socket event (used by main.py or other services)
app.post("/api/trigger_camera", (req, res) => {
  try {
    io.emit("openCamera");
    res.json({ success: true, message: "Camera trigger emitted" });
  } catch (err) {
    console.error("Error emitting openCamera:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Receive live detection data from main.py and forward to frontend
app.post("/api/live_detections", express.json(), (req, res) => {
  try {
    const detectionData = req.body;
    // Emit detection data to all connected frontend clients
    io.emit("liveDetections", detectionData);
    res.json({ success: true });
  } catch (err) {
    console.error("Error handling live detections:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
