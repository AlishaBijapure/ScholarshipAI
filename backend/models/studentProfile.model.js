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
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Academic Background
    currentEducationLevel: {
        type: String,
        enum: ['High School', 'Diploma', 'Bachelor\'s', 'Master\'s', 'PhD', 'Other']
    },
    degree: String,
    major: String,
    graduationYear: Number,
    gpa: String,
    // Study Goals
    intendedDegree: {
        type: String,
        enum: ['Bachelor\'s', 'Master\'s', 'MBA', 'PhD']
    },
    fieldOfStudy: String,
    targetIntakeYear: Number,
    preferredCountries: [String],
    // Budget
    budgetRange: {
        type: String,
        enum: ['< $10,000', '$10,000 - $30,000', '$30,000 - $50,000', '$50,000 - $100,000', '> $100,000']
    },
    fundingPlan: {
        type: String,
        enum: ['Self-funded', 'Scholarship-dependent', 'Loan-dependent', 'Mixed']
    },
    // Exams & Readiness
    ieltsStatus: {
        type: String,
        enum: ['Not started', 'In progress', 'Completed'],
        default: 'Not started'
    },
    ieltsScore: Number,
    toeflStatus: {
        type: String,
        enum: ['Not started', 'In progress', 'Completed'],
        default: 'Not started'
    },
    toeflScore: Number,
    greStatus: {
        type: String,
        enum: ['Not started', 'In progress', 'Completed'],
        default: 'Not started'
    },
    greScore: Number,
    gmatStatus: {
        type: String,
        enum: ['Not started', 'In progress', 'Completed'],
        default: 'Not started'
    },
    gmatScore: Number,
    sopStatus: {
        type: String,
        enum: ['Not started', 'Draft', 'Ready'],
        default: 'Not started'
    },
    // Legacy fields (keeping for backward compatibility)
    degrees: [degreeSchema],
    testScores: [testScoreSchema],
    personalInfo: {
        dob: { type: Date },
        gender: String,
        nationality: String,
        disability: String,
    },
    financialInfo: {
        income: String,
        funding: String,
    },
    preferences: {
        opportunity: String,
        countries: [String],
        mode: String,
        deadline: String,
    },
    extraDetails: {
        languages: [String],
        extracurricular: String,
        research: String,
        work: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
studentProfileSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;

