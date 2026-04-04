<div align="center">
  <img src="vistonaut.png" alt="Vistonaut Logo" width="200" />
  <h1>V i s t o n a u t</h1>
</div>

<p align="center">
  <b>A next-generation, deeply immersive AI-powered application guidance platform for international university admissions.</b>
</p>

<div align="center">

  [![Live Demo](https://img.shields.io/badge/Live-Vistonaut--Production-success?style=for-the-badge)](https://www.vistonaut.com/)

</div>

---

## 📸 The Experience

<div align="center">
  <!-- User: Upload ss1.png through ss7.png to your images folder to populate this grid! -->
  <img src="images/ss1.png" alt="Main Showcase" width="98%" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);" />
</div>

<div align="center">
  <img src="images/ss2.png" alt="Screenshot 2" width="48%" style="border-radius: 12px; margin: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <img src="images/ss3.png" alt="Screenshot 3" width="48%" style="border-radius: 12px; margin: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <img src="images/ss4.png" alt="Screenshot 4" width="48%" style="border-radius: 12px; margin: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <img src="images/ss5.png" alt="Screenshot 5" width="48%" style="border-radius: 12px; margin: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <img src="images/ss6.png" alt="Screenshot 6" width="48%" style="border-radius: 12px; margin: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <img src="images/ss7.png" alt="Screenshot 7" width="48%" style="border-radius: 12px; margin: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
</div>

<br>

Navigating international university admissions is arguably one of the most intimidating challenges for a student. **Vistonaut** is engineered from the ground up to completely automate, streamline, and personalize this journey. 

Highlighting the experience is a **fully interactive, voice-responsive AI Counsellor**, backed by an elegantly responsive dashboard that orchestrates dynamic checklists, custom document builders (SOPs/LORs), and personalized university discovery engines inside a beautiful, space-themed glassmorphic UI.

## Technical Highlights

- **Bypass-Resilient Authentication:** Fully ditches legacy SMTP servers that fall victim to free-tier cloud firewalls. Vistonaut utilizes a high-speed, native `HTTPS / fetch()` pipeline routing 6-Digit OTP security codes through Resend API, backed concurrently by automated Google OAuth identity verification.
- **Cascading Nuclear Deletion:** A deeply secure MongoDB schema automatically executes Promise.all cascading deletions, ensuring absolute user privacy by sanitizing all orphaned Profile, Admissions, and Todo data instances if a user deletes their account.
- **Glassmorphism UI Patterns:** Features mathematically clamped, fully fluid typography and hyper-responsive `100dvh` flex grids that adapt layout geometry flawlessly to anything from a 4k desktop monitor to a virtual mobile keyboard.
- **Intelligent Registration Interceptors:** Dynamically restricts duplicate registrations mid-flight, safely redirecting users into seamless login flows and drastically reducing wasted API execution costs.

## Tech Stack

- **Frontend:** HTML5, Vanilla CSS3, Javascript (ES Modules)
- **Backend Architecture:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ORM)
- **Integration APIs:** Google Identity Services (GSI), Resend.com Email HTTP API

## Local Setup

To run Vistonaut's full stack locally, simply follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/AlishaBijapure/ScholarshipAI.git
   ```
2. Navigate into the backend directory and install dependencies:
   ```bash
   cd frontend
   cd backend
   npm install
   ```
3. Set up the environment variables:
   Create a `.env` file in the `backend` directory containing:
   ```
   PORT=3000
   MONGO_URI=your_mongodb_cluster_url
   JWT_SECRET=your_secure_hash
   RESEND_API_KEY=re_your_api_key_here
   GOOGLE_CLIENT_ID=your_google_cloud_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_secret
   ```
4. Boot up the backend node server:
   ```bash
   npm start
   ```
5. Open your preferred Live Server on the frontend directory (e.g. `index.html`) using port 5500.

---
*Developed to engineer seamless journeys for future global scholars.*
