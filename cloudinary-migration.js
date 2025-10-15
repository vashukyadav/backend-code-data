require("dotenv").config({ path: './.env' });
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const Gallery = require("./models/Gallery");

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MONGO_URI = "mongodb+srv://vashuuyadav08_db_user:XbhTDJqbX9E1fnOF@photography-portfolio.3xmu9a2.mongodb.net/photography-portfolio?retryWrites=true&w=majority";

async function migrateImages() {
  try {
    await mongoose.connect(MONGO_URI, {
      ssl: true,
      tlsAllowInvalidCertificates: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000
    });
    console.log("✅ MongoDB Connected");

    const photos = await Gallery.find();
    console.log(`Found ${photos.length} photos to process`);

    let migrated = 0, skipped = 0, failed = 0;

    for (const photo of photos) {
      console.log(`\nProcessing: ${photo.title}`);
      
      // Skip if already a Cloudinary URL
      if (photo.imageUrl.includes('cloudinary.com')) {
        console.log(`✅ Already on Cloudinary: ${photo.imageUrl}`);
        skipped++;
        continue;
      }
      
      try {
        let result;
        
        // Check if it's a URL (starts with http/https)
        if (photo.imageUrl.startsWith('http')) {
          console.log(`⬇️ Downloading from URL: ${photo.imageUrl}`);
          result = await cloudinary.uploader.upload(photo.imageUrl, {
            folder: "portfolioImages",
          });
        } else {
          // Handle local file path
          const localPath = path.join(__dirname, photo.imageUrl);
          console.log(`📁 Local path: ${localPath}`);
          
          if (!fs.existsSync(localPath)) {
            console.log(`❌ File not found: ${localPath}`);
            failed++;
            continue;
          }
          
          console.log(`⬆️ Uploading local file...`);
          result = await cloudinary.uploader.upload(localPath, {
            folder: "portfolioImages",
          });
        }
        
        // Update MongoDB with new URL
        await Gallery.findByIdAndUpdate(photo._id, { imageUrl: result.secure_url });
        
        console.log(`✅ Migrated successfully!`);
        console.log(`   Old: ${photo.imageUrl}`);
        console.log(`   New: ${result.secure_url}`);
        migrated++;
        
      } catch (uploadError) {
        console.log(`❌ Upload failed: ${uploadError.message}`);
        failed++;
      }
    }
    
    console.log('\n🎉 Migration Summary:');
    console.log(`   Total photos: ${photos.length}`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️ Skipped (already on Cloudinary): ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateImages();