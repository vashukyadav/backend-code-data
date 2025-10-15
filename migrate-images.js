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

async function migrateImages() {
  try {
    // Use the same URI as server.js
    const MONGO_URI = "mongodb+srv://vashuuyadav08_db_user:XbhTDJqbX9E1fnOF@photography-portfolio.3xmu9a2.mongodb.net/photography-portfolio?retryWrites=true&w=majority";
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      ssl: true,
      tlsAllowInvalidCertificates: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000
    });
    console.log("✅ MongoDB Connected");

    const photos = await Gallery.find();
    console.log(`Found ${photos.length} photos to process`);

    for (const photo of photos) {
      console.log(`\nProcessing: ${photo.title}`);
      
      // Skip if already a Cloudinary URL
      if (photo.imageUrl.includes('cloudinary.com')) {
        console.log(`✅ Already migrated: ${photo.imageUrl}`);
        continue;
      }
      
      const localPath = path.join(__dirname, photo.imageUrl);
      console.log(`Local path: ${localPath}`);
      
      // Check if local file exists
      if (!fs.existsSync(localPath)) {
        console.log(`❌ File not found: ${localPath}`);
        continue;
      }
      
      try {
        // Upload to Cloudinary
        console.log(`⬆️ Uploading to Cloudinary...`);
        const result = await cloudinary.uploader.upload(localPath, {
          folder: "portfolioImages",
        });
        
        // Update MongoDB with new URL
        await Gallery.findByIdAndUpdate(photo._id, { imageUrl: result.secure_url });
        
        console.log(`✅ Migrated successfully!`);
        console.log(`   Old: ${photo.imageUrl}`);
        console.log(`   New: ${result.secure_url}`);
      } catch (uploadError) {
        console.log(`❌ Upload failed: ${uploadError.message}`);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateImages();