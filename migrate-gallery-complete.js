require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Gallery = require('./models/Gallery');

async function migrateGallery() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing gallery data
    await Gallery.deleteMany({});
    console.log('Cleared existing gallery data');
    
    const galleryPath = path.join(__dirname, 'data', 'gallery.json');
    
    if (!fs.existsSync(galleryPath)) {
      console.log('No gallery.json found, creating sample data...');
      
      // Create sample gallery data
      const sampleData = [
        {
          title: "Beautiful Sunset",
          category: "LANDSCAPE",
          description: "A stunning sunset photograph",
          imageUrl: "/uploads/sample-sunset.jpg"
        },
        {
          title: "Portrait Session",
          category: "PORTRAIT", 
          description: "Professional portrait photography",
          imageUrl: "/uploads/sample-portrait.jpg"
        }
      ];
      
      for (const item of sampleData) {
        await Gallery.create(item);
      }
      console.log('Created sample gallery data');
    } else {
      const galleryData = JSON.parse(fs.readFileSync(galleryPath));
      console.log(`Found ${galleryData.length} photos to migrate`);
      
      for (const item of galleryData) {
        await Gallery.create({
          title: item.title,
          category: item.category,
          description: item.description,
          imageUrl: item.imageUrl
        });
      }
      console.log('Migrated existing gallery data');
    }
    
    console.log('✅ Gallery data migrated!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateGallery();