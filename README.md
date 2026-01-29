# AI Counsellor - Study Abroad Guidance Platform

> A guided, stage-based platform designed to help students make confident and informed study-abroad decisions with AI-powered guidance.

## 🎯 Overview

**AI Counsellor** is a hackathon project that transforms the study-abroad journey from confusion to clarity. Instead of overwhelming users with listings or generic chat responses, the platform uses a structured **AI Counsellor** that:

- Deeply understands a student's academic background, goals, budget, and readiness
- Guides them step by step from profile building to university shortlisting
- Provides actionable recommendations and takes real actions (shortlisting, locking, task creation)
- Explains risks and opportunities clearly
- Enforces decision discipline through university locking

## ✨ Key Features

### 1. **Structured User Flow**
- Landing Page → Signup/Login
- Mandatory Onboarding (collects all essential data)
- Dashboard with stage indicators
- AI Counsellor interaction
- University discovery and shortlisting
- University locking (commitment stage)
- Application guidance with actionable to-dos

### 2. **AI Counsellor (Core Feature)**
- Powered by Google Gemini API
- Understands user profile and current stage
- Explains profile strengths and gaps
- Recommends universities (Dream/Target/Safe)
- Can take actions: shortlist universities, lock universities, create tasks
- Provides clear explanations and risk assessments

### 3. **University Discovery**
- Research-based university data
- Smart filtering by profile, budget, country
- Categorization (Dream/Target/Safe)
- Cost and acceptance likelihood indicators
- Shortlisting and locking functionality

### 4. **Stage-Based Progression**
- **Stage 1**: Building Profile
- **Stage 2**: Discovering Universities
- **Stage 3**: Finalizing Universities
- **Stage 4**: Preparing Applications

Each stage unlocks the next, ensuring focused progression.

### 5. **Dashboard & Analytics**
- Profile strength analysis (Academics, Exams, SOP)
- Current stage indicator
- Statistics (shortlisted, locked, tasks)
- Quick actions
- Recent tasks

## 🚀 Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- Gemini API Key

### Installation

```bash
# Install dependencies
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Seed university data
npm run seed

# Start server
npm start
```

Open `index.html` in your browser or use a local server.

## 📁 Project Structure

```
scholarshipai/
├── backend/
│   ├── models/          # Database models (User, Profile, University, Todo)
│   ├── routes/          # API routes (auth, profile, dashboard, counsellor, etc.)
│   ├── middleware/     # Authentication middleware
│   ├── scripts/        # Seed scripts
│   └── server.js       # Express server
├── js/
│   └── auth.js         # Frontend authentication utilities
├── index.html          # Landing page
├── login.html          # Login page
├── signup.html         # Signup page
├── onboarding.html     # Mandatory onboarding
├── dashboard.html      # Main dashboard
├── counsellor.html     # AI Counsellor chat interface
├── universities.html   # University discovery
├── profile.html        # Profile management
└── SETUP.md           # Detailed setup guide
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: Google Gemini API
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: MongoDB

## 📝 API Documentation

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Profile
- `GET /api/profiles` - Get user profile
- `POST /api/profiles` - Create/update profile
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

### Todos
- `GET /api/todos` - Get todos
- `POST /api/todos` - Create todo
- `PATCH /api/todos/:id` - Update todo

## 🎯 User Journey

1. **Sign Up** → Create account with email/password
2. **Onboarding** → Complete mandatory profile (academic, goals, budget, exams)
3. **Dashboard** → View progress, profile strength, current stage
4. **AI Counsellor** → Get personalized guidance and recommendations
5. **Discover Universities** → Browse recommended or all universities
6. **Shortlist** → Save universities of interest
7. **Lock University** → Commit to a choice (unlocks application guidance)
8. **Application Prep** → Get tasks and next steps

## 🔐 Security Notes

⚠️ **This is a hackathon prototype**. For production:
- Add input validation and sanitization
- Implement rate limiting
- Add CSRF protection
- Use HTTPS
- Secure environment variables
- Add proper error handling

## 📦 Features Implemented

✅ Authentication (Signup/Login with JWT)  
✅ Mandatory Onboarding  
✅ Dashboard with Stage Indicators  
✅ AI Counsellor (Gemini-powered)  
✅ University Discovery & Shortlisting  
✅ University Locking  
✅ Profile Management  
✅ Task/To-Do System  
✅ Profile Strength Analysis  

## 🎨 UI/UX

- Clean, modern design
- Responsive layout
- Intuitive navigation
- Clear stage indicators
- Action-oriented interface

## 📄 License

This project is created for hackathon submission.

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- MongoDB for database
- Express.js community

---

**Built with ❤️ for the hackathon**

For setup instructions, see [SETUP.md](./SETUP.md)
