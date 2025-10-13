require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connection successful');
    
    console.log('Environment variables:');
    console.log('- PORT:', process.env.PORT);
    console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('- MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Missing');
    
    await mongoose.disconnect();
    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();