const express = require('express');
const router = express.Router();
const Opportunity = require('../models/scholarship.model');

// POST /api/recommendations - Finds matching opportunities
router.post('/', async (req, res) => {
  try {
    const userProfile = req.body;

    const query = { status: 'Open' };

    if (userProfile['degree-level']) {
      query.degreeLevel = userProfile['degree-level'];
    }
    if (userProfile.field) {
      query.fieldOfStudy = { $in: Array.isArray(userProfile.field) ? userProfile.field : [userProfile.field] };
    }
    if (userProfile['country[]'] && userProfile['country[]'].length > 0) {
      query.country = { $in: userProfile['country[]'] };
    }
    if (userProfile.opportunity && userProfile.opportunity !== 'both') {
        query.type = userProfile.opportunity;
    }

    console.log('Searching database with query:', query);
    const matches = await Opportunity.find(query);
    res.json(matches);

  } catch (error) {
    console.error('Error finding recommendations:', error);
    res.status(500).json({ message: 'An error occurred while finding matches.' });
  }
});

module.exports = router;