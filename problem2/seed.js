const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/problem2');

    await User.deleteMany({});

    const users = [
      { username: 'admin', role: 'admin' },
      { username: 'moderator', role: 'moderator' },
      { username: 'user', role: 'user' },
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`User ${user.username} created`);
    }

    console.log('Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedUsers();