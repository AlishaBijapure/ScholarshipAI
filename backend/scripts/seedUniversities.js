const mongoose = require('mongoose');
const path = require('path');
const University = require('../models/university.model');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const universities = [
    // --- 20 DREAM SCHOOLS (High Rank, Low Acceptance, High GPA) ---
    {
        name: "Massachusetts Institute of Technology (MIT)",
        country: "USA",
        city: "Cambridge, MA",
        ranking: 1,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Computer Science", "Engineering", "Physics", "Mathematics", "Business"],
        tuitionFee: { min: 55000, max: 60000, currency: "USD" },
        acceptanceRate: 4,
        requirements: { gpa: 3.9, ielts: 7.5, toefl: 100, gre: 325, gmat: 730 },
        description: "A world-class institution known for innovation, engineering, and technology.",
        website: "https://web.mit.edu",
        category: "Dream"
    },
    {
        name: "Stanford University",
        country: "USA",
        city: "Stanford, CA",
        ranking: 2,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Computer Science", "Business", "Engineering", "Medicine", "Law"],
        tuitionFee: { min: 56000, max: 62000, currency: "USD" },
        acceptanceRate: 4,
        requirements: { gpa: 3.9, ielts: 7.5, toefl: 100, gre: 328, gmat: 740 },
        description: "Located in Silicon Valley, Stanford is a hub for entrepreneurship and research.",
        website: "https://www.stanford.edu",
        category: "Dream"
    },
    {
        name: "Harvard University",
        country: "USA",
        city: "Cambridge, MA",
        ranking: 3,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Law", "Business", "Medicine", "Humanities", "Social Sciences"],
        tuitionFee: { min: 54000, max: 58000, currency: "USD" },
        acceptanceRate: 3,
        requirements: { gpa: 4.0, ielts: 7.5, toefl: 105, gre: 330, gmat: 740 },
        description: "The oldest institution of higher learning in the US, known for prestige and history.",
        website: "https://www.harvard.edu",
        category: "Dream"
    },
    {
        name: "California Institute of Technology (Caltech)",
        country: "USA",
        city: "Pasadena, CA",
        ranking: 4,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Physics", "Chemistry", "Engineering", "Space Science"],
        tuitionFee: { min: 56000, max: 60000, currency: "USD" },
        acceptanceRate: 3,
        requirements: { gpa: 4.0, ielts: 7.5, toefl: 110, gre: 330 },
        description: "A world-renowned science and engineering institute.",
        website: "https://www.caltech.edu",
        category: "Dream"
    },
    {
        name: "Princeton University",
        country: "USA",
        city: "Princeton, NJ",
        ranking: 5,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Public Policy", "Mathematics", "Humanities", "Engineering"],
        tuitionFee: { min: 53000, max: 57000, currency: "USD" },
        acceptanceRate: 4,
        requirements: { gpa: 3.9, ielts: 7.5, toefl: 100, gre: 325 },
        description: "Known for its beautiful campus and focus on undergraduate teaching.",
        website: "https://www.princeton.edu",
        category: "Dream"
    },
    {
        name: "Yale University",
        country: "USA",
        city: "New Haven, CT",
        ranking: 6,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Law", "Arts", "Drama", "Medicine", "Business"],
        tuitionFee: { min: 55000, max: 60000, currency: "USD" },
        acceptanceRate: 5,
        requirements: { gpa: 3.9, ielts: 7.5, toefl: 100, gre: 325 },
        description: "Famous for its drama and music programs, as well as its law school.",
        website: "https://www.yale.edu",
        category: "Dream"
    },
    {
        name: "Columbia University",
        country: "USA",
        city: "New York, NY",
        ranking: 7,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Journalism", "Business", "Law", "International Relations"],
        tuitionFee: { min: 60000, max: 65000, currency: "USD" },
        acceptanceRate: 4,
        requirements: { gpa: 3.8, ielts: 7.5, toefl: 100, gre: 326 },
        description: "An Ivy League research university in Upper Manhattan.",
        website: "https://www.columbia.edu",
        category: "Dream"
    },
    {
        name: "University of Chicago",
        country: "USA",
        city: "Chicago, IL",
        ranking: 8,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Economics", "Sociology", "Law", "Business"],
        tuitionFee: { min: 58000, max: 62000, currency: "USD" },
        acceptanceRate: 5,
        requirements: { gpa: 3.9, ielts: 7.5, toefl: 100, gre: 325 },
        description: "Known for rigorous academics and critical thinking.",
        website: "https://www.uchicago.edu",
        category: "Dream"
    },
    {
        name: "University of Pennsylvania",
        country: "USA",
        city: "Philadelphia, PA",
        ranking: 9,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Business", "Medicine", "Law", "Education"],
        tuitionFee: { min: 57000, max: 63000, currency: "USD" },
        acceptanceRate: 6,
        requirements: { gpa: 3.8, ielts: 7.0, toefl: 100, gre: 324 },
        description: "Home to the Wharton School of Business.",
        website: "https://www.upenn.edu",
        category: "Dream"
    },
    {
        name: "Johns Hopkins University",
        country: "USA",
        city: "Baltimore, MD",
        ranking: 10,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Medicine", "Public Health", "Biomedical Engineering", "International Studies"],
        tuitionFee: { min: 56000, max: 60000, currency: "USD" },
        acceptanceRate: 7,
        requirements: { gpa: 3.9, ielts: 7.5, toefl: 100, gre: 326 },
        description: "America's first research university, leader in medicine.",
        website: "https://www.jhu.edu",
        category: "Dream"
    },
    {
        name: "Northwestern University",
        country: "USA",
        city: "Evanston, IL",
        ranking: 11,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Journalism", "Communication", "Engineering", "Arts"],
        tuitionFee: { min: 58000, max: 62000, currency: "USD" },
        acceptanceRate: 7,
        requirements: { gpa: 3.8, ielts: 7.5, toefl: 100, gre: 324 },
        description: "Known for its Medill School of Journalism and strong engineering programs.",
        website: "https://www.northwestern.edu",
        category: "Dream"
    },
    {
        name: "Duke University",
        country: "USA",
        city: "Durham, NC",
        ranking: 12,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Medicine", "Law", "Public Policy", "Business"],
        tuitionFee: { min: 57000, max: 60000, currency: "USD" },
        acceptanceRate: 6,
        requirements: { gpa: 3.9, ielts: 7.5, toefl: 100, gre: 325 },
        description: "A powerhouse in research and athletics.",
        website: "https://www.duke.edu",
        category: "Dream"
    },
    {
        name: "Dartmouth College",
        country: "USA",
        city: "Hanover, NH",
        ranking: 13,
        degreeLevels: ["Bachelor's", "Master's", "MBA"],
        fieldsOfStudy: ["Business", "Medicine", "Engineering", "Liberal Arts"],
        tuitionFee: { min: 57000, max: 60000, currency: "USD" },
        acceptanceRate: 6,
        requirements: { gpa: 3.8, ielts: 7.5, toefl: 100, gre: 322 },
        description: "Smallest Ivy League, focuses on undergraduate education.",
        website: "https://home.dartmouth.edu",
        category: "Dream"
    },
    {
        name: "Brown University",
        country: "USA",
        city: "Providence, RI",
        ranking: 14,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Applied Math", "Computer Science", "Biology", "Arts"],
        tuitionFee: { min: 58000, max: 62000, currency: "USD" },
        acceptanceRate: 5,
        requirements: { gpa: 3.8, ielts: 7.5, toefl: 100, gre: 320 },
        description: "Known for its open curriculum and student freedom.",
        website: "https://www.brown.edu",
        category: "Dream"
    },
    {
        name: "Vanderbilt University",
        country: "USA",
        city: "Nashville, TN",
        ranking: 15,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Education", "Music", "Medicine", "Law"],
        tuitionFee: { min: 54000, max: 58000, currency: "USD" },
        acceptanceRate: 7,
        requirements: { gpa: 3.8, ielts: 7.5, toefl: 100, gre: 322 },
        description: "Private research university with a strong musical heritage.",
        website: "https://www.vanderbilt.edu",
        category: "Dream"
    },
    {
        name: "Rice University",
        country: "USA",
        city: "Houston, TX",
        ranking: 16,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Architecture", "Music", "Space Science", "Engineering"],
        tuitionFee: { min: 52000, max: 56000, currency: "USD" },
        acceptanceRate: 9,
        requirements: { gpa: 3.9, ielts: 7.5, toefl: 100, gre: 324 },
        description: "Known for its applied science programs and small class sizes.",
        website: "https://www.rice.edu",
        category: "Dream"
    },
    {
        name: "Cornell University",
        country: "USA",
        city: "Ithaca, NY",
        ranking: 17,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Hotel Management", "Engineering", "Architecture", "Agriculture"],
        tuitionFee: { min: 58000, max: 62000, currency: "USD" },
        acceptanceRate: 9,
        requirements: { gpa: 3.8, ielts: 7.5, toefl: 100, gre: 320 },
        description: "Ivy League university with a wide range of study fields.",
        website: "https://www.cornell.edu",
        category: "Dream"
    },
    {
        name: "University of Notre Dame",
        country: "USA",
        city: "Notre Dame, IN",
        ranking: 18,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Theology", "Business", "Architecture", "Law"],
        tuitionFee: { min: 55000, max: 59000, currency: "USD" },
        acceptanceRate: 15,
        requirements: { gpa: 3.8, ielts: 7.5, toefl: 100, gre: 318 },
        description: "Catholic research university known for its campus and tradition.",
        website: "https://www.nd.edu",
        category: "Dream"
    },
    {
        name: "UCLA",
        country: "USA",
        city: "Los Angeles, CA",
        ranking: 19,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Film", "Engineering", "Arts", "Psychology"],
        tuitionFee: { min: 42000, max: 46000, currency: "USD" },
        acceptanceRate: 11,
        requirements: { gpa: 3.9, ielts: 7.0, toefl: 100, gre: 320 },
        description: "Public land-grant research university in Los Angeles.",
        website: "https://www.ucla.edu",
        category: "Dream"
    },
    {
        name: "UC Berkeley",
        country: "USA",
        city: "Berkeley, CA",
        ranking: 20,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Computer Science", "Engineering", "Business", "Sociology"],
        tuitionFee: { min: 44000, max: 48000, currency: "USD" },
        acceptanceRate: 15,
        requirements: { gpa: 3.9, ielts: 7.0, toefl: 100, gre: 325 },
        description: "Top public university known for activism and research.",
        website: "https://www.berkeley.edu",
        category: "Dream"
    },

    // --- 20 TARGET SCHOOLS (Good Rank, Moderate Acceptance, Moderate GPA) ---
    {
        name: "University of Texas at Austin",
        country: "USA",
        city: "Austin, TX",
        ranking: 38,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Engineering", "Business", "Computer Science", "Communications"],
        tuitionFee: { min: 38000, max: 42000, currency: "USD" },
        acceptanceRate: 32,
        requirements: { gpa: 3.7, ielts: 6.5, toefl: 90, gre: 315 },
        description: "Large public research university with strong tech ties.",
        website: "https://www.utexas.edu",
        category: "Target"
    },
    {
        name: "University of Washington",
        country: "USA",
        city: "Seattle, WA",
        ranking: 40,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Computer Science", "Medicine", "Engineering", "Business"],
        tuitionFee: { min: 39000, max: 44000, currency: "USD" },
        acceptanceRate: 53,
        requirements: { gpa: 3.7, ielts: 7.0, toefl: 92, gre: 315 },
        description: "Top-tier public university in the Pacific Northwest.",
        website: "https://www.washington.edu",
        category: "Target"
    },
    {
        name: "Georgia Institute of Technology",
        country: "USA",
        city: "Atlanta, GA",
        ranking: 44,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Industrial Engineering", "Computer Science", "Architecture"],
        tuitionFee: { min: 31000, max: 35000, currency: "USD" },
        acceptanceRate: 16,
        requirements: { gpa: 3.8, ielts: 7.0, toefl: 95, gre: 320 },
        description: "Leading technology research university in the South.",
        website: "https://www.gatech.edu",
        category: "Target"
    },
    {
        name: "University of North Carolina at Chapel Hill",
        country: "USA",
        city: "Chapel Hill, NC",
        ranking: 29,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Journalism", "Medicine", "Business", "Public Health"],
        tuitionFee: { min: 36000, max: 40000, currency: "USD" },
        acceptanceRate: 19,
        requirements: { gpa: 3.7, ielts: 7.0, toefl: 100, gre: 318 },
        description: "One of the oldest public universities, known for strong academics.",
        website: "https://www.unc.edu",
        category: "Target"
    },
    {
        name: "University of Illinois Urbana-Champaign",
        country: "USA",
        city: "Champaign, IL",
        ranking: 47,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Engineering", "Library Science", "Computer Science", "Psychology"],
        tuitionFee: { min: 34000, max: 38000, currency: "USD" },
        acceptanceRate: 60,
        requirements: { gpa: 3.6, ielts: 6.5, toefl: 90, gre: 315 },
        description: "Big Ten university known for engineering excellence.",
        website: "https://illinois.edu",
        category: "Target"
    },
    {
        name: "University of Wisconsin-Madison",
        country: "USA",
        city: "Madison, WI",
        ranking: 35,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Economics", "Agriculture", "Education", "Engineering"],
        tuitionFee: { min: 38000, max: 42000, currency: "USD" },
        acceptanceRate: 57,
        requirements: { gpa: 3.6, ielts: 6.5, toefl: 92, gre: 312 },
        description: "Public land-grant university with a vibrant campus life.",
        website: "https://www.wisc.edu",
        category: "Target"
    },
    {
        name: "Boston University",
        country: "USA",
        city: "Boston, MA",
        ranking: 41,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Law", "Medicine", "Economics", "Biomedical Engineering"],
        tuitionFee: { min: 58000, max: 62000, currency: "USD" },
        acceptanceRate: 14,
        requirements: { gpa: 3.7, ielts: 7.0, toefl: 95, gre: 318 },
        description: "Private research university located in the heart of Boston.",
        website: "https://www.bu.edu",
        category: "Target"
    },
    {
        name: "University of Florida",
        country: "USA",
        city: "Gainesville, FL",
        ranking: 28,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Business", "Engineering", "Law", "Pharmacy"],
        tuitionFee: { min: 28000, max: 32000, currency: "USD" },
        acceptanceRate: 30,
        requirements: { gpa: 3.8, ielts: 6.5, toefl: 80, gre: 310 },
        description: "Top-ranked public university with affordable tuition.",
        website: "https://www.ufl.edu",
        category: "Target"
    },
    {
        name: "Ohio State University",
        country: "USA",
        city: "Columbus, OH",
        ranking: 49,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "MBA"],
        fieldsOfStudy: ["Business", "Education", "Political Science", "Engineering"],
        tuitionFee: { min: 33000, max: 37000, currency: "USD" },
        acceptanceRate: 57,
        requirements: { gpa: 3.5, ielts: 6.5, toefl: 79, gre: 310 },
        description: "Large public university with massive alumni network.",
        website: "https://www.osu.edu",
        category: "Target"
    },
    {
        name: "Purdue University",
        country: "USA",
        city: "West Lafayette, IN",
        ranking: 51,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Engineering", "Aviation", "Computer Science", "Business"],
        tuitionFee: { min: 28000, max: 31000, currency: "USD" },
        acceptanceRate: 69,
        requirements: { gpa: 3.6, ielts: 6.5, toefl: 80, gre: 315 },
        description: "Renowned for its engineering and aviation programs.",
        website: "https://www.purdue.edu",
        category: "Target"
    },
    {
        name: "University of Maryland",
        country: "USA",
        city: "College Park, MD",
        ranking: 55,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Criminology", "Computer Science", "Business", "Engineering"],
        tuitionFee: { min: 36000, max: 40000, currency: "USD" },
        acceptanceRate: 52,
        requirements: { gpa: 3.6, ielts: 7.0, toefl: 96, gre: 315 },
        description: "Public research university near Washington D.C.",
        website: "https://www.umd.edu",
        category: "Target"
    },
    {
        name: "Pennsylvania State University",
        country: "USA",
        city: "University Park, PA",
        ranking: 63,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Supply Chain", "Engineering", "Geology", "Education"],
        tuitionFee: { min: 36000, max: 40000, currency: "USD" },
        acceptanceRate: 55,
        requirements: { gpa: 3.5, ielts: 6.5, toefl: 80, gre: 310 },
        description: "Large public university with strong industry ties.",
        website: "https://www.psu.edu",
        category: "Target"
    },
    {
        name: "University of Minnesota",
        country: "USA",
        city: "Minneapolis, MN",
        ranking: 65,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Chemical Engineering", "Psychology", "Business", "Pharmacy"],
        tuitionFee: { min: 33000, max: 37000, currency: "USD" },
        acceptanceRate: 73,
        requirements: { gpa: 3.5, ielts: 6.5, toefl: 79, gre: 310 },
        description: "Major public research university in the Twin Cities.",
        website: "https://twin-cities.umn.edu",
        category: "Target"
    },
    {
        name: "Texas A&M University",
        country: "USA",
        city: "College Station, TX",
        ranking: 67,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Agriculture", "Engineering", "Business", "Veterinary Medicine"],
        tuitionFee: { min: 38000, max: 42000, currency: "USD" },
        acceptanceRate: 64,
        requirements: { gpa: 3.5, ielts: 6.0, toefl: 80, gre: 308 },
        description: "Senior military college with massive research output.",
        website: "https://www.tamu.edu",
        category: "Target"
    },
    {
        name: "Virginia Tech",
        country: "USA",
        city: "Blacksburg, VA",
        ranking: 62,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Engineering", "Architecture", "Business", "Natural Resources"],
        tuitionFee: { min: 32000, max: 36000, currency: "USD" },
        acceptanceRate: 56,
        requirements: { gpa: 3.6, ielts: 6.5, toefl: 80, gre: 310 },
        description: "Polytechnic institute known for engineering.",
        website: "https://www.vt.edu",
        category: "Target"
    },
    {
        name: "Rutgers University",
        country: "USA",
        city: "New Brunswick, NJ",
        ranking: 55,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Philosophy", "Mathematics", "Business", "Health Sciences"],
        tuitionFee: { min: 31000, max: 35000, currency: "USD" },
        acceptanceRate: 66,
        requirements: { gpa: 3.5, ielts: 6.5, toefl: 79, gre: 310 },
        description: "The State University of New Jersey.",
        website: "https://www.rutgers.edu",
        category: "Target"
    },
    {
        name: "University of Colorado Boulder",
        country: "USA",
        city: "Boulder, CO",
        ranking: 99,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Physics", "Aerospace", "Environmental Science", "Business"],
        tuitionFee: { min: 38000, max: 42000, currency: "USD" },
        acceptanceRate: 79,
        requirements: { gpa: 3.5, ielts: 6.5, toefl: 80, gre: 305 },
        description: "Public research university in the Rocky Mountains.",
        website: "https://www.colorado.edu",
        category: "Target"
    },
    {
        name: "Michigan State University",
        country: "USA",
        city: "East Lansing, MI",
        ranking: 77,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Supply Chain", "Education", "Communication", "Nuclear Physics"],
        tuitionFee: { min: 40000, max: 44000, currency: "USD" },
        acceptanceRate: 83,
        requirements: { gpa: 3.5, ielts: 6.5, toefl: 79, gre: 305 },
        description: "First land-grant university, known for supply chain management.",
        website: "https://msu.edu",
        category: "Target"
    },
    {
        name: "North Carolina State University",
        country: "USA",
        city: "Raleigh, NC",
        ranking: 72,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Engineering", "Textiles", "Design", "Statistics"],
        tuitionFee: { min: 29000, max: 33000, currency: "USD" },
        acceptanceRate: 47,
        requirements: { gpa: 3.6, ielts: 6.5, toefl: 80, gre: 312 },
        description: "Leading public research university in the Research Triangle.",
        website: "https://www.ncsu.edu",
        category: "Target"
    },
    {
        name: "University of Pittsburgh",
        country: "USA",
        city: "Pittsburgh, PA",
        ranking: 62,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Medicine", "Philosophy", "Nursing", "Engineering"],
        tuitionFee: { min: 34000, max: 38000, currency: "USD" },
        acceptanceRate: 67,
        requirements: { gpa: 3.6, ielts: 7.0, toefl: 100, gre: 310 },
        description: "State-related research university known for medicine.",
        website: "https://www.pitt.edu",
        category: "Target"
    },

    // --- 10 SAFE SCHOOLS (High Acceptance, Lower GPA reqs) ---
    {
        name: "Arizona State University",
        country: "USA",
        city: "Tempe, AZ",
        ranking: 121,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Business", "Engineering", "Education", "Design"],
        tuitionFee: { min: 31000, max: 35000, currency: "USD" },
        acceptanceRate: 88,
        requirements: { gpa: 3.0, ielts: 6.0, toefl: 61, gre: 300 },
        description: "Number one for innovation, large diverse student body.",
        website: "https://www.asu.edu",
        category: "Safe"
    },
    {
        name: "Iowa State University",
        country: "USA",
        city: "Ames, IA",
        ranking: 127,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Agriculture", "Engineering", "Design", "Veterinary Medicine"],
        tuitionFee: { min: 26000, max: 30000, currency: "USD" },
        acceptanceRate: 91,
        requirements: { gpa: 3.0, ielts: 6.0, toefl: 71, gre: 300 },
        description: "Known for science and technology, friendly campus.",
        website: "https://www.iastate.edu",
        category: "Safe"
    },
    {
        name: "University of Utah",
        country: "USA",
        city: "Salt Lake City, UT",
        ranking: 105,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Game Design", "Medical", "Business", "Law"],
        tuitionFee: { min: 30000, max: 34000, currency: "USD" },
        acceptanceRate: 89,
        requirements: { gpa: 3.0, ielts: 6.5, toefl: 80, gre: 300 },
        description: "Public flagship university in Utah.",
        website: "https://www.utah.edu",
        category: "Safe"
    },
    {
        name: "University of Kansas",
        country: "USA",
        city: "Lawrence, KS",
        ranking: 128,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Architecture", "Journalism", "Pharmacy", "Business"],
        tuitionFee: { min: 28000, max: 32000, currency: "USD" },
        acceptanceRate: 92,
        requirements: { gpa: 3.0, ielts: 6.0, toefl: 75, gre: 298 },
        description: "Public research university in the Midwest.",
        website: "https://ku.edu",
        category: "Safe"
    },
    {
        name: "University of Kentucky",
        country: "USA",
        city: "Lexington, KY",
        ranking: 137,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Pharmacy", "Business", "Communication", "Nursing"],
        tuitionFee: { min: 31000, max: 35000, currency: "USD" },
        acceptanceRate: 94,
        requirements: { gpa: 2.8, ielts: 6.0, toefl: 71, gre: 295 },
        description: "Flagship university of Kentucky.",
        website: "https://www.uky.edu",
        category: "Safe"
    },
    {
        name: "West Virginia University",
        country: "USA",
        city: "Morgantown, WV",
        ranking: 240,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Forensics", "Biometrics", "Engineering", "Mining"],
        tuitionFee: { min: 25000, max: 28000, currency: "USD" },
        acceptanceRate: 84,
        requirements: { gpa: 2.5, ielts: 6.0, toefl: 61, gre: 290 },
        description: "Known for its forensics program and school spirit.",
        website: "https://www.wvu.edu",
        category: "Safe"
    },
    {
        name: "University of Alabama",
        country: "USA",
        city: "Tuscaloosa, AL",
        ranking: 137,
        degreeLevels: ["Bachelor's", "Master's", "PhD", "Law"],
        fieldsOfStudy: ["Law", "Business", "Communications", "Nursing"],
        tuitionFee: { min: 30000, max: 34000, currency: "USD" },
        acceptanceRate: 80,
        requirements: { gpa: 3.0, ielts: 6.0, toefl: 78, gre: 300 },
        description: "Oldest public university in Alabama.",
        website: "https://www.ua.edu",
        category: "Safe"
    },
    {
        name: "Oklahoma State University",
        country: "USA",
        city: "Stillwater, OK",
        ranking: 182,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Agriculture", "Engineering", "Business", "Education"],
        tuitionFee: { min: 24000, max: 29000, currency: "USD" },
        acceptanceRate: 68,
        requirements: { gpa: 3.0, ielts: 6.0, toefl: 61, gre: 295 },
        description: "Land-grant university with strong agricultural programs.",
        website: "https://go.okstate.edu",
        category: "Safe"
    },
    {
        name: "Kansas State University",
        country: "USA",
        city: "Manhattan, KS",
        ranking: 170,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Biosecurity", "Architecture", "Engineering", "Aviation"],
        tuitionFee: { min: 26000, max: 30000, currency: "USD" },
        acceptanceRate: 95,
        requirements: { gpa: 2.8, ielts: 6.5, toefl: 79, gre: 298 },
        description: "Known for biodefense research and friendly community.",
        website: "https://www.k-state.edu",
        category: "Safe"
    },
    {
        name: "University of New Mexico",
        country: "USA",
        city: "Albuquerque, NM",
        ranking: 196,
        degreeLevels: ["Bachelor's", "Master's", "PhD"],
        fieldsOfStudy: ["Photography", "Medicine", "Engineering", "Law"],
        tuitionFee: { min: 24000, max: 28000, currency: "USD" },
        acceptanceRate: 96,
        requirements: { gpa: 2.8, ielts: 6.0, toefl: 68, gre: 290 },
        description: "Flagship university of New Mexico.",
        website: "https://www.unm.edu",
        category: "Safe"
    }
];

async function seedUniversities() {
    try {
        const uri = process.env.MONGO_URI;
        
        if (!uri) {
            console.error('❌ Error: MONGO_URI is not defined in .env file');
            console.error('Please make sure you have a .env file in the backend directory with MONGO_URI set');
            process.exit(1);
        }
        
        console.log('Connecting to MongoDB...');
        console.log('URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log
        
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // Clear existing universities
        console.log('Clearing existing universities...');
        const deleteResult = await University.deleteMany({});
        console.log(`Cleared ${deleteResult.deletedCount} existing universities`);

        // Insert new universities
        console.log(`Inserting ${universities.length} universities...`);
        const result = await University.insertMany(universities);
        console.log(`✅ Successfully seeded ${result.length} universities`);

        // Verify the data was inserted
        const count = await University.countDocuments();
        console.log(`✅ Verification: ${count} universities now in database`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding universities:', error.message);
        if (error.name === 'MongoServerError') {
            console.error('MongoDB Error:', error.message);
        } else if (error.name === 'ValidationError') {
            console.error('Validation Error:', error.message);
            console.error('Details:', error.errors);
        } else {
            console.error('Full error:', error);
        }
        process.exit(1);
    }
}

seedUniversities();
