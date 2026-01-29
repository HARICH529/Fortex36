require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function setupUser() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to MongoDB');

    const email = '23501a0529@pvpsit.ac.in';
    const password = 'password';

    // Check if user exists
    let user = await User.findOne({ email }).select('+password');
    
    if (user) {
      console.log('✅ User exists');
      const isValid = await user.comparePassword(password);
      console.log('Password valid:', isValid);
    } else {
      console.log('❌ User not found. Creating...');
      
      user = await User.create({
        name: 'Hari',
        email: email,
        password: password,
        mobile: '7671977355'
      });
      
      console.log('✅ User created:', user.email);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

setupUser();