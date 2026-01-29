# AI Counsellor - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Gemini API Key (get from https://makersuite.google.com/app/apikey)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:
```
MONGO_URI=mongodb://localhost:27017/scholarshipai
JWT_SECRET=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### Step 3: Start MongoDB

If using local MongoDB:
```bash
mongod
```

Or use MongoDB Atlas and update `MONGO_URI` in `.env`.

### Step 4: Seed University Data

```bash
node scripts/seedUniversities.js
```

This will populate the database with sample universities.

### Step 5: Start the Backend Server

```bash
npm start
# or
node server.js
```

The server will run on `http://localhost:3000`

### Step 6: Open the Frontend

Simply open `index.html` in your browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server
```

Then navigate to `http://localhost:8000`

## 📁 Project Structure

```
scholarshipai/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── scripts/         # Seed scripts
│   └── server.js        # Main server file
├── js/
│   └── auth.js          # Frontend auth utilities
├── index.html           # Landing page
├── login.html           # Login page
├── signup.html          # Signup page
├── onboarding.html      # Onboarding flow
├── dashboard.html       # Dashboard
├── counsellor.html      # AI Counsellor chat
├── universities.html    # University discovery
└── profile.html         # Profile management
```

## 🔑 Key Features

1. **Authentication**: JWT-based auth with signup/login
2. **Onboarding**: Mandatory profile creation
3. **Dashboard**: Stage indicators, profile strength, stats
4. **AI Counsellor**: Gemini-powered chat with action capabilities
5. **University Discovery**: Browse, shortlist, and lock universities
6. **Profile Management**: Edit and update profile

## 🎯 User Flow

1. Sign up → Create account
2. Onboarding → Complete profile
3. Dashboard → View progress and stats
4. AI Counsellor → Get guidance and recommendations
5. Universities → Discover and shortlist
6. Lock University → Commit to a choice
7. Application Guidance → Get tasks and next steps

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Profile
- `GET /api/profiles` - Get user profile
- `POST /api/profiles` - Create/update profile (onboarding)
- `PATCH /api/profiles` - Update profile

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### AI Counsellor
- `POST /api/counsellor/chat` - Chat with AI
- `GET /api/counsellor/profile-analysis` - Get profile analysis

### Universities
- `GET /api/universities` - Get all universities
- `GET /api/universities/recommended` - Get recommended universities
- `GET /api/universities/my-universities` - Get user's universities
- `POST /api/universities/:id/shortlist` - Shortlist university
- `POST /api/universities/:id/lock` - Lock university
- `DELETE /api/universities/:id/shortlist` - Remove from shortlist

### Todos
- `GET /api/todos` - Get todos
- `POST /api/todos` - Create todo
- `PATCH /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env`
- For Atlas, whitelist your IP address

### Gemini API Error
- Verify `GEMINI_API_KEY` in `.env`
- Check API quota/limits

### CORS Issues
- Backend has CORS enabled for all origins
- If issues persist, check browser console

## 📝 Notes

- This is a prototype for hackathon submission
- Not production-ready (no input sanitization, error handling could be better)
- Frontend uses vanilla JS (no framework for simplicity)
- Database uses MongoDB with Mongoose

## 🎉 Ready to Go!

Once everything is set up:
1. Sign up for an account
2. Complete onboarding
3. Start chatting with AI Counsellor
4. Discover and shortlist universities
5. Lock a university to unlock application guidance

Good luck with your hackathon! 🚀
