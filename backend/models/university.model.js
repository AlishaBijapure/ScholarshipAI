const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const universitySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    ranking: {
        type: Number
    },
    degreeLevels: {
        type: [String],
        required: true
        // Removed enum restriction to allow flexibility (Law, JD, etc.)
    },
    fieldsOfStudy: {
        type: [String],
        required: true
    },
    tuitionFee: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String, default: 'USD' }
    },
    acceptanceRate: {
        type: Number,
        min: 0,
        max: 100
    },
    requirements: {
        gpa: { type: Number },
        ielts: { type: Number },
        toefl: { type: Number },
        gre: { type: Number },
        gmat: { type: Number }
    },
    description: {
        type: String,
        required: true
    },
    website: {
        type: String
    },
    applicationDeadline: {
        type: Date
    },
    category: {
        type: String,
        enum: ['Dream', 'Target', 'Safe'],
        default: 'Target'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const University = mongoose.model('University', universitySchema);

module.exports = University;
