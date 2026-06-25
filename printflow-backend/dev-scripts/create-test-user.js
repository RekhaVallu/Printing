require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function run(){
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/printflow';
  await mongoose.connect(uri);
  console.log('Connected to', uri);
  const existing = await User.findOne({ clerkId: 'test-user-1' });
  if (existing) {
    console.log('User exists', existing._id.toString());
    process.exit(0);
  }
  const u = await User.create({ clerkId: 'test-user-1', email: 'test-user-1@example.com', name: 'Test User' });
  console.log('Created user', u._id.toString());
  process.exit(0);
}
run().catch(e=>{console.error(e); process.exit(1);});
