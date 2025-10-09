const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-secret-key';
const ADMIN_PASSWORD = 'admin123';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Load gallery data
const loadGalleryData = () => {
  const dataPath = path.join(__dirname, 'data', 'gallery.json');
  const rawData = fs.readFileSync(dataPath);
  return JSON.parse(rawData);
};

// Load contacts data
const loadContactsData = () => {
  const dataPath = path.join(__dirname, 'data', 'contacts.json');
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]');
  }
  const rawData = fs.readFileSync(dataPath);
  return JSON.parse(rawData);
};

// Save contacts data
const saveContactsData = (contacts) => {
  const dataPath = path.join(__dirname, 'data', 'contacts.json');
  fs.writeFileSync(dataPath, JSON.stringify(contacts, null, 2));
};

// API Routes
app.get('/api/gallery', (req, res) => {
  try {
    const gallery = loadGalleryData();
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load gallery data' });
  }
});

app.get('/api/gallery/:id', (req, res) => {
  try {
    const gallery = loadGalleryData();
    const photo = gallery.find(item => item.id === parseInt(req.params.id));
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load photo data' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.post('/api/admin/gallery', authenticateAdmin, upload.single('image'), (req, res) => {
  try {
    const { title, category, description } = req.body;
    const gallery = loadGalleryData();
    const newId = Math.max(...gallery.map(item => item.id)) + 1;
    
    const newPhoto = {
      id: newId,
      title,
      category,
      imageUrl: `/uploads/${req.file.filename}`,
      description
    };
    
    gallery.push(newPhoto);
    fs.writeFileSync(path.join(__dirname, 'data', 'gallery.json'), JSON.stringify(gallery, null, 2));
    res.json(newPhoto);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

app.delete('/api/admin/gallery/:id', authenticateAdmin, (req, res) => {
  try {
    const gallery = loadGalleryData();
    const photoIndex = gallery.findIndex(item => item.id === parseInt(req.params.id));
    
    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    const photo = gallery[photoIndex];
    const imagePath = path.join(__dirname, 'public', photo.imageUrl);
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    gallery.splice(photoIndex, 1);
    fs.writeFileSync(path.join(__dirname, 'data', 'gallery.json'), JSON.stringify(gallery, null, 2));
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Contact form API
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const contacts = loadContactsData();
    const newContact = {
      id: Date.now(),
      name,
      email,
      phone,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    contacts.push(newContact);
    saveContactsData(contacts);
    res.json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// Get all contacts (admin only)
app.get('/api/admin/contacts', authenticateAdmin, (req, res) => {
  try {
    const contacts = loadContactsData();
    res.json(contacts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load contacts' });
  }
});

// Mark contact as read
app.put('/api/admin/contacts/:id/read', authenticateAdmin, (req, res) => {
  try {
    const contacts = loadContactsData();
    const contactIndex = contacts.findIndex(c => c.id === parseInt(req.params.id));
    if (contactIndex === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    contacts[contactIndex].read = true;
    saveContactsData(contacts);
    res.json({ message: 'Contact marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete contact
app.delete('/api/admin/contacts/:id', authenticateAdmin, (req, res) => {
  try {
    const contacts = loadContactsData();
    const contactIndex = contacts.findIndex(c => c.id === parseInt(req.params.id));
    if (contactIndex === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    contacts.splice(contactIndex, 1);
    saveContactsData(contacts);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Serve React app in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../frontend/build')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
//   });
// }

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});