const express = require('express');
const router = express.Router();
const Opportunity = require('../models/scholarship.model');

// Route to CREATE a new opportunity (POST)
router.post('/', async (req, res) => {
  try {
    const newOpportunity = new Opportunity({
      title: req.body.title,
      type: req.body.type,
      status: req.body.status,
      description: req.body.description,
      about: req.body.about,
      fieldOfStudy: req.body.fieldOfStudy,
      degreeLevel: req.body.degreeLevel,
      country: req.body.country,
      location: req.body.location,
      
      // --- USE THE NEW ELIGIBILITY FIELDS ---
      eligibilitySummary: req.body.eligibilitySummary,
      eligibilityDetailed: req.body.eligibilityDetailed,
      // --- END OF UPDATE ---

      fundingAmount: req.body.fundingAmount,
      companyName: req.body.companyName,
      deadline: req.body.deadline,
      link: req.body.link,
    });

    const savedOpportunity = await newOpportunity.save();
    res.status(201).json(savedOpportunity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to GET all opportunities
router.get('/', async (req, res) => {
  try {
    const opportunities = await Opportunity.find();
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
