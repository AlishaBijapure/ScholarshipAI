<div align="center">
  <img src="images/LOGO.webp" alt="Books and Bricks Logo" width="200" />
</div>

<h1 align="center">Books & Bricks Café</h1>

<p align="center">
  <b>A highly immersive, performance-optimized static cafe website powered by Three.js WebGL rendering.</b>
</p>

<div align="center">

  [![Live Demo](https://img.shields.io/badge/Live-booksandbricks.in-success?style=for-the-badge)](https://booksandbricks.in/)

</div>

---

## 📸 The Experience

<div align="center">
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

Nestled in the heart of Srinagar, **Books & Bricks Café** required a landing page that properly communicated its warm, rustic, and authentic aesthetic. This repository contains the custom-built frontend application showcasing the cafe. 

Highlighting the experience is a **fully interactive, 3D rotating coffee cup** deployed via a Three.js canvas layer, offering users a deeply immersive initial impression before smoothly transitioning into elegant storytelling and interactive menus.

## Technical Highlights

- **3D WebGL Rendering:** Features a custom `.glb` 3D model managed by `Three.js` and `OrbitControls`, responding dynamically to screen size and user scrolling.
- **Micro-Optimized Performance:** Uses **Google DRACO** mesh compression, native Intersection Observers to pause GPU calculations off-screen, and strict PixelRatio capping to deliver seamless frames on modern mobile devices.
- **Glassmorphism UI:** Complete responsive design featuring modern CSS frosted-glass aesthetics built entirely without bloated CSS frameworks—pure vanilla precision.
- **Technical SEO:** Fully structured metadata, `robots.txt`, and automated `schema.org/CafeOrCoffeeShop` JSON-LD injections ensuring the cafe explicitly dominates the local Google Search ecosystem.

## Tech Stack

- **HTML5** & **Vanilla CSS3**
- **JavaScript (ES Modules)**
- **Three.js** (WebGL 3D Engine)
- **Intersection Observer API**

## Local Setup

Since this is a deeply optimized static application, no complex build dependencies are required!

1. Clone the repository:
   ```bash
   git clone https://github.com/AlishaBijapure/BooksAndBricks.git
   ```
2. Navigate into the directory:
   ```bash
   cd BooksAndBricks
   ```
3. Run a local development server (necessary to bypass browser CORS policies for rendering the 3D `.glb` module):
   ```bash
   # If you use python:
   python3 -m http.server 8000
   
   # Or using Node.js:
   npx serve .
   ```
4. Open the browser to `http://localhost:8000`

---
*Built with 🤎 for the Books & Bricks community.*
