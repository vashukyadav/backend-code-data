require("dotenv").config({ path: './.env' });
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const path = require('path');
const Gallery = require("./models/Gallery");

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MONGO_URI = "mongodb+srv://vashuuyadav08_db_user:XbhTDJqbX9E1fnOF@photography-portfolio.3xmu9a2.mongodb.net/photography-portfolio?retryWrites=true&w=majority";

async function migrateGalleryJson() {
  try {
    await mongoose.connect(MONGO_URI, {
      ssl: true,
      tlsAllowInvalidCertificates: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000
    });
    console.log("✅ MongoDB Connected");

    // Read gallery.json
    const galleryPath = path.join(__dirname, 'data', 'gallery.json');
    const galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
    console.log(`Found ${galleryData.length} images in gallery.json`);

    let migrated = 0, skipped = 0, failed = 0;

    for (const item of galleryData) {
      console.log(`\nProcessing: ${item.title}`);
      
      // Skip if already a Cloudinary URL
      if (item.imageUrl.includes('cloudinary.com')) {
        console.log(`✅ Already on Cloudinary: ${item.imageUrl}`);
        skipped++;
        continue;
      }
      
      try {
        let result;
        
        // Check if it's a URL (starts with http/https)
        if (item.imageUrl.startsWith('http')) {
          console.log(`⬇️ Downloading from URL: ${item.imageUrl}`);
          result = await cloudinary.uploader.upload(item.imageUrl, {
            folder: "portfolioImages",
          });
        } else {
          // Handle local file path - convert /uploads/ to actual path
          let localPath;
          if (item.imageUrl.startsWith('/uploads/')) {
            localPath = path.join(__dirname, 'public', item.imageUrl);
          } else {
            localPath = path.join(__dirname, item.imageUrl);
          }
          
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
        
        // Update the item in memory
        item.imageUrl = result.secure_url;
        
        // Check if this item exists in MongoDB and update it
        const existingPhoto = await Gallery.findOne({ title: item.title });
        if (existingPhoto) {
          await Gallery.findByIdAndUpdate(existingPhoto._id, { imageUrl: result.secure_url });
          console.log(`📝 Updated MongoDB record`);
        }
        
        console.log(`✅ Migrated successfully!`);
        console.log(`   New URL: ${result.secure_url}`);
        migrated++;
        
      } catch (uploadError) {
        console.log(`❌ Upload failed: ${uploadError.message}`);
        failed++;
      }
    }
    
    // Write updated gallery.json back to file
    fs.writeFileSync(galleryPath, JSON.stringify(galleryData, null, 2));
    console.log(`\n📝 Updated gallery.json with new Cloudinary URLs`);
    
    console.log('\n🎉 Migration Summary:');
    console.log(`   Total images: ${galleryData.length}`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️ Skipped (already on Cloudinary): ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateGalleryJson();