require('dotenv').config();
const mongoose = require('mongoose');
const Gallery = require('./models/Gallery');
const galleryData = require('./data/gallery.json');

const migrateGalleryData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Gallery.deleteMany({});
    console.log('🗑️ Cleared existing gallery data');

    // Insert new data
    const galleryItems = galleryData.map(item => ({
      title: item.title,
      category: item.category,
      imageUrl: item.imageUrl,
      description: item.description
    }));

    await Gallery.insertMany(galleryItems);
    console.log(`✅ Migrated ${galleryItems.length} gallery items to MongoDB`);

    await mongoose.disconnect();
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateGalleryData();