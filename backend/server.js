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
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/counsellor', counsellorRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/scholarships', scholarshipRoutes); // Keep for backward compatibility
app.use('/api/recommendations', recommendationRoutes); // Keep for backward compatibility