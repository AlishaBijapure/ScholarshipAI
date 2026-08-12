const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // <-- ADD THIS
require('dotenv').config();

// Import all the route files
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const counsellorRoutes = require('./routes/counsellor.routes');
const universityRoutes = require('./routes/university.routes');
const todoRoutes = require('./routes/todo.routes');
const scholarshipRoutes = require('./routes/scholarship.routes'); // Keep for backward compatibility
const recommendationRoutes = require('./routes/recommendation.routes'); // Keep for backward compatibility

const app = express();
const port = 3000;

// MIDDLEWARE
app.use(cors()); // <-- ADD THIS to allow cross-origin requests
app.use(express.json()); // To parse JSON bodies

// Connect to MongoDB using Mongoose with fallback options
async function startDatabaseAndServer() {
  app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
  });

  let connected = false;
  const primaryUri = process.env.MONGO_URI;
  
  if (primaryUri) {
    try {
      await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 3000 });
      console.log("✅ Successfully connected to Primary MongoDB!");
      connected = true;
    } catch (err) {
      console.warn("⚠️ Primary MongoDB connection failed:", err.message);
    }
  }

  if (!connected) {
    const localUri = 'mongodb://127.0.0.1:27017/aicounsellor';
    try {
      console.log("🔄 Attempting fallback to local MongoDB...");
      await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
      console.log("✅ Successfully connected to Local MongoDB!");
      connected = true;
    } catch (err) {
      console.warn("⚠️ Local MongoDB connection failed:", err.message);
    }
  }

  if (!connected) {
    try {
      console.log("🔄 Attempting fallback to Mongo Memory Server...");
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log("✅ Successfully connected to Mongo Memory Server!");
      connected = true;
    } catch (err) {
      console.warn("⚠️ Memory server fallback deferred:", err.message);
    }
  }
}

startDatabaseAndServer();

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/counsellor', counsellorRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/scholarships', scholarshipRoutes); // Keep for backward compatibility
app.use('/api/recommendations', recommendationRoutes); // Keep for backward compatibility