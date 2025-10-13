require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Gallery = require('./models/Gallery');

async function migrateGallery() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const galleryData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'gallery.json')));
    
    for (const item of galleryData) {
      await Gallery.create({
        title: item.title,
        category: item.category,
        description: item.description,
        imageUrl: item.imageUrl
      });
    }
    
    console.log('✅ Gallery data migrated!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateGallery();