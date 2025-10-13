require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Gallery = require('./models/Gallery');
const Contact = require('./models/Contact');

async function migrateData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await Gallery.deleteMany({});
    await Contact.deleteMany({});
    console.log('🗑️ Cleared existing data');
    
    // Migrate Gallery Data
    const galleryPath = path.join(__dirname, 'data', 'gallery.json');
    
    if (fs.existsSync(galleryPath)) {
      const galleryData = JSON.parse(fs.readFileSync(galleryPath));
      console.log(`📸 Found ${galleryData.length} photos to migrate`);
      
      for (const item of galleryData) {
        await Gallery.create({
          title: item.title,
          category: item.category,
          description: item.description,
          imageUrl: item.imageUrl
        });
      }
      console.log('✅ Gallery data migrated successfully');
    } else {
      console.log('📸 No gallery.json found, creating sample data...');
      
      const sampleGallery = [
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
        },
        {
          title: "Wedding Ceremony",
          category: "WEDDING",
          description: "Beautiful wedding moment",
          imageUrl: "/uploads/sample-wedding.jpg"
        }
      ];
      
      for (const item of sampleGallery) {
        await Gallery.create(item);
      }
      console.log('✅ Sample gallery data created');
    }
    
    // Migrate Contact Data
    const contactsPath = path.join(__dirname, 'data', 'contacts.json');
    
    if (fs.existsSync(contactsPath)) {
      const contactsData = JSON.parse(fs.readFileSync(contactsPath));
      console.log(`📧 Found ${contactsData.length} contacts to migrate`);
      
      for (const item of contactsData) {
        await Contact.create({
          name: item.name,
          email: item.email,
          phone: item.phone || '',
          message: item.message,
          isRead: item.read || false
        });
      }
      console.log('✅ Contact data migrated successfully');
    } else {
      console.log('📧 No contacts.json found, skipping contact migration');
    }
    
    // Verify migration
    const galleryCount = await Gallery.countDocuments();
    const contactCount = await Contact.countDocuments();
    
    console.log(`\n🎉 Migration Complete!`);
    console.log(`📸 Gallery photos: ${galleryCount}`);
    console.log(`📧 Contact messages: ${contactCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();