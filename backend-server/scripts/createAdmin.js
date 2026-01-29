const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to database');
    
    const adminData = {
      email: 'admin@civic.com',
      password: 'admin123456'
    };

    const existingAdmin = await Admin.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('✅ Admin already exists:', adminData.email);
      console.log('Use these credentials to login:');
      console.log('Email:', adminData.email);
      console.log('Password:', adminData.password);
      return;
    }

    const admin = await Admin.create(adminData);
    console.log('✅ Admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Password:', adminData.password);
    console.log('\nYou can now login to the admin panel with these credentials.');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

createAdmin();