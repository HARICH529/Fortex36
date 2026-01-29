require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createUser() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to MongoDB');

    const email = '23501a0529@pvpsit.ac.in';
    const password = 'password';

    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      console.log('User already exists:', user);
      return;
    }

    // Create the user
    user = new User({
      name: 'Student User',
      email: email,
      password: password,
      mobile: '9876543211'
    });

    await user.save();
    
    console.log('User created successfully:', {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile
    });

    // Test login
    const testUser = await User.findOne({ email }).select('+password');
    const isPasswordValid = await testUser.comparePassword(password);
    console.log('Password test result:', isPasswordValid);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createUser();