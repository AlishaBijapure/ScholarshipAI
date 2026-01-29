const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userUniversitySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    universityId: {
        type: Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    status: {
        type: String,
        enum: ['shortlisted', 'locked'],
        required: true
    },
    category: {
        type: String,
        enum: ['Dream', 'Target', 'Safe']
    },
    lockedAt: {
        type: Date
    },
    notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one user can't have duplicate university entries
userUniversitySchema.index({ userId: 1, universityId: 1 }, { unique: true });

const UserUniversity = mongoose.model('UserUniversity', userUniversitySchema);

module.exports = UserUniversity;
