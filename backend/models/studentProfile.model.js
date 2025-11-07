const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// A sub-schema for academic degrees
const degreeSchema = new Schema({
    level: { type: String, required: true },
    field: { type: String, required: true },
    status: { type: String, required: true },
    gpa: { type: String, required: true },
});

// A sub-schema for test scores
const testScoreSchema = new Schema({
    name: { type: String },
    score: { type: String },
});

const studentProfileSchema = new Schema({
    degrees: [degreeSchema],
    testScores: [testScoreSchema],
    personalInfo: {
        dob: { type: Date, required: true },
        gender: String,
        nationality: { type: String, required: true },
        disability: String,
    },
    financialInfo: {
        income: String,
        funding: String,
    },
    preferences: {
        opportunity: { type: String, required: true },
        countries: { type: [String], required: true }, // Changed from 'country[]'
        mode: String,
        deadline: { type: String, required: true },
    },
    extraDetails: {
        languages: { type: [String], required: true }, // Changed from 'languages[]'
        extracurricular: String,
        research: String,
        work: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;

