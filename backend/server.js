const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // <-- ADD THIS
require('dotenv').config();

// Import all the route files
const scholarshipRoutes = require('./routes/scholarship.routes');
const profileRoutes = require('./routes/profile.routes');
const recommendationRoutes = require('./routes/recommendation.routes');

const app = express();
const port = 3000;

// MIDDLEWARE
app.use(cors()); // <-- ADD THIS to allow cross-origin requests
app.use(express.json()); // To parse JSON bodies

// Get the MongoDB connection string from the .env file
const uri = process.env.MONGO_URI;

// Connect to MongoDB using Mongoose
mongoose.connect(uri)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB using Mongoose!");
    app.listen(port, () => {
      console.log(`✅ Server is running on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error("❌ Failed to connect to MongoDB", err);
    process.exit(1);
  });

// ROUTES
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/recommendations', recommendationRoutes);