# ScholarshipAI

ScholarshipAI is a full-stack web application designed to solve a major problem for students: finding relevant, high-quality scholarships and internships. This "hassle-free" site prioritizes immediate value by providing personalized recommendations and a dynamic browsing experience without requiring a user to create an account.

The application runs on a Node.js/Express backend and connects to a curated MongoDB Atlas database populated with hundreds of verified international opportunities.



Key Features -

Personalized Matching ("Match Me"): A comprehensive student profile form (match.html) that takes a user's academic, personal, and financial details. On submission, it saves the profile and returns a personalized list of matching opportunities from the database, rendered dynamically on the page.

Dynamic Opportunity Browser ("Explore"): A public-facing dashboard (opportunities.html) that fetches and displays all opportunities from the database.

Live Filtering & Search: The "Explore" page features a real-time search bar and filterable dropdowns for Opportunity Type, Country, and Field of Study.

Hassle-Free Experience: The core features are available to all users instantly, with no login or signup required.

Curated Database: The application is powered by a pre-populated MongoDB database, focusing on high-quality, verified scholarships and internships.



Tech Stack -

Frontend:

HTML5

CSS3 (Custom styling for all components)

JavaScript (ES6+) (Vanilla JS for all DOM manipulation and logic)

Choices.js (For searchable, multi-select dropdowns)

Fetch API (For all asynchronous communication with the backend)

Backend:

Node.js

Express.js (For the server and API routing)

Mongoose (As the Object Data Modeler for MongoDB)

CORS (To handle cross-origin requests from the frontend)

dotenv (For secure environment variable management)

Database:

MongoDB Atlas (Cloud-hosted NoSQL database)

Author - Alisha Bijapure
