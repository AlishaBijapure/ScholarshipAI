const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['Scholarship', 'Internship']
  },
  status: {
    type: String,
    required: true,
    enum: ['Open', 'Closed'],
    default: 'Open'
  },
  description: { type: String, required: true },
  about: { type: String, required: true },
  fieldOfStudy: { type: [String], required: true },
  degreeLevel: { type: String, required: true },
  country: { type: String, required: true },
  location: { type: String, required: true },
  
  // --- UPDATED ELIGIBILITY FIELDS ---
  eligibilitySummary: { type: String, required: true }, // For the card view
  eligibilityDetailed: { type: String, required: true }, // For the details page
  // --- END OF UPDATE ---

  fundingAmount: { type: String },
  companyName: { type: String },
  deadline: { type: Date },
  link: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

module.exports = Opportunity;
