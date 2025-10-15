require("dotenv").config({ path: './.env' });

// Force override MONGO_URI (local testing)
process.env.MONGO_URI = "mongodb+srv://vashuuyadav08_db_user:XbhTDJqbX9E1fnOF@photography-portfolio.3xmu9a2.mongodb.net/photography-portfolio?retryWrites=true&w=majority";

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Gallery = require("./models/Gallery");
const Contact = require("./models/Contact");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const ADMIN_PASSWORD = "admin123";

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    ssl: true,
    tlsAllowInvalidCertificates: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// CORS Setup
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://frontend-code-data.vercel.app",
    "https://backend-code-data-3.onrender.com",
    
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Preflight for all routes
app.options('*', cors());

app.use(express.json());

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// Gallery endpoints
app.get("/api/gallery", async (req, res) => {
  try {
    const gallery = await Gallery.find();
    const mappedGallery = gallery.map((photo) => ({
      ...photo.toObject(),
      id: photo._id,
    }));
    res.json(mappedGallery);
  } catch (error) {
    res.status(500).json({ error: "Failed to load gallery data" });
  }
});

app.get("/api/gallery/:id", async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: "Failed to load photo data" });
  }
});

// Admin login
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// Migration endpoint to upload existing images to Cloudinary
app.post("/api/admin/migrate-images", authenticateAdmin, async (req, res) => {
  try {
    const fs = require('fs');
    const photos = await Gallery.find();
    const results = [];
    
    for (const photo of photos) {
      // Skip if already a Cloudinary URL
      if (photo.imageUrl.includes('cloudinary.com')) {
        results.push({ id: photo._id, status: 'already_migrated', url: photo.imageUrl });
        continue;
      }
      
      try {
        let result;
        
        // Check if it's a URL (starts with http/https)
        if (photo.imageUrl.startsWith('http')) {
          result = await cloudinary.uploader.upload(photo.imageUrl, {
            folder: "portfolioImages",
          });
        } else {
          // Handle local file path
          const localPath = path.join(__dirname, photo.imageUrl);
          
          if (!fs.existsSync(localPath)) {
            results.push({ id: photo._id, status: 'file_not_found', path: localPath });
            continue;
          }
          
          result = await cloudinary.uploader.upload(localPath, {
            folder: "portfolioImages",
          });
        }
        
        // Update MongoDB with new URL
        await Gallery.findByIdAndUpdate(photo._id, { imageUrl: result.secure_url });
        
        results.push({ 
          id: photo._id, 
          status: 'migrated', 
          oldUrl: photo.imageUrl, 
          newUrl: result.secure_url 
        });
      } catch (uploadError) {
        results.push({ 
          id: photo._id, 
          status: 'upload_failed', 
          error: uploadError.message 
        });
      }
    }
    
    res.json({ 
      message: 'Migration completed', 
      total: photos.length,
      results 
    });
  } catch (error) {
    res.status(500).json({ error: 'Migration failed: ' + error.message });
  }
});

// Admin gallery CRUD
app.post("/api/admin/gallery", upload.single("image"), async (req, res) => {
  try {
    const { title, category, description } = req.body;
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "portfolioImages",
    });
    const gallery = new Gallery({ title, category, description, imageUrl: result.secure_url });
    await gallery.save();
    res.status(201).json(gallery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/admin/gallery/:id", authenticateAdmin, async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });

    // Extract public_id from Cloudinary URL for deletion
    if (photo.imageUrl.includes('cloudinary.com')) {
      const publicId = photo.imageUrl.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

// Contact form
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }

    const newContact = new Contact({ name, email, phone: phone || "", message });
    const savedContact = await newContact.save();
    res.json({ message: "Contact form submitted successfully", id: savedContact._id });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit contact form: " + error.message });
  }
});

// Admin contacts
app.get("/api/admin/contacts", authenticateAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    const mappedContacts = contacts.map((contact) => ({
      ...contact.toObject(),
      id: contact._id,
      read: contact.isRead,
      timestamp: contact.createdAt,
    }));
    res.json(mappedContacts);
  } catch (error) {
    res.status(500).json({ error: "Failed to load contacts" });
  }
});

app.put("/api/admin/contacts/:id/read", authenticateAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json({ message: "Contact marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update contact" });
  }
});

app.delete("/api/admin/contacts/:id", authenticateAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} busy. Please use another port.`);
    process.exit(1);
  }
});
