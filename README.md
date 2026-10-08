# 🎵 SoundWave — Music Streaming & Artist Studio

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![ImageKit](https://img.shields.io/badge/ImageKit-Cloud%20Storage-0052CC?logo=icloud&logoColor=white)](https://imagekit.io/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20%26%20RBAC-FF5722?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> **SoundWave** is a full-stack music streaming platform and creator studio designed with a soothing pastel biscuit aesthetic. It features role-based access control (Listeners & Artists), cloud-hosted audio playback, playlist/queue management, and an artist publishing suite.

---

## 📑 Table of Contents

- [✨ Features](#-features)
  - [🎧 Listener Experience](#-listener-experience)
  - [🎙️ Artist Studio (RBAC)](#️-artist-studio-rbac)
  - [🔐 Authentication & Security](#-authentication--security)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Project Architecture](#-project-architecture)
- [🚀 Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the App](#running-the-app)
- [📡 API Endpoints](#-api-endpoints)
  - [Authentication Routes](#authentication-routes-apiauth)
  - [Music & Streaming Routes](#music--streaming-routes-apimusic)
- [🎨 Design Aesthetic](#-design-aesthetic)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### 🎧 Listener Experience
- **Interactive Feed & Discovery**: Browse tracks with real-time genre filtering (`Ambient`, `Lo-Fi`, `Synthwave`, `Indie`, `Chillhop`, and more) and responsive search.
- **Curated Albums**: Explore curated collections, preview track listings, and load albums directly into the queue.
- **Persistent Player**:
  - Full playback controls: Play/Pause, Next/Previous, Shuffle, Repeat.
  - Interactive scrub bar with real-time buffered timing.
  - Volume slider and playback speed adjustment (`0.75x`, `1.0x`, `1.25x`, `1.5x`).
- **Dynamic Playback Queue**:
  - Slide-out queue drawer showing upcoming tracks.
  - Add tracks to queue on-the-fly and reorder playback.

### 🎙️ Artist Studio (RBAC)
- **Role-Based Access Control**:
  - Seamlessly switch between standard **Listener (`user`)** and creator **Artist (`artist`)** modes.
- **Track Upload & Publishing**:
  - Upload audio files (`MP3`, `WAV`, etc.) with title, genre, cover image URL, and duration.
  - Direct integration with **ImageKit** cloud storage for reliable, fast audio delivery.
- **Album Creation**:
  - Bundle multiple uploaded songs into custom albums with custom descriptions and artwork.
- **Track Management**:
  - View published catalog in the Artist Studio dashboard.
  - Delete tracks with automated cascade cleanup from album tracklists.
  - Live play counter tracking listeners.

### 🔐 Authentication & Security
- **Secure Registration & Login** with encrypted password hashing via `bcryptjs`.
- **JWT Authentication** supporting both HTTP cookies and `Authorization: Bearer <token>` headers.
- **Protected Routes & Role Guards**:
  - `authUser`: Enforces authenticated session.
  - `authArtist`: Enforces artist privileges for upload, album creation, and track deletion.
  - `authOptional`: Allows public browsing while preserving user context when available.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/), [Mongoose 9](https://mongoosejs.com/) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) |
| **File Storage & CDN** | [ImageKit.io SDK](https://imagekit.io/) (Cloud audio storage) |
| **Security & Auth** | [JSON Web Tokens (JWT)](https://jwt.io/), [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [cookie-parser](https://github.com/expressjs/cookie-parser) |
| **File Handling** | [Multer](https://github.com/expressjs/multer) (Memory storage buffer) |
| **Frontend** | Vanilla HTML5, Modern CSS3 (Custom Properties & Glassmorphism), Vanilla ES6+ JavaScript |

---

## 📂 Project Architecture

```text
MusicStreamingPlatform/
├── Backend/
│   ├── package.json               # Backend dependencies and scripts
│   ├── server.js                  # Database connection and HTTP server listener
│   └── src/
│       ├── app.js                 # Express application setup, CORS, static files & routes
│       ├── controllers/
│       │   ├── auth.controller.js  # Registration, login, role-switching, session handlers
│       │   └── music.controller.js # Track upload, query, play count, album handlers
│       ├── db/
│       │   └── db.js              # MongoDB Mongoose connection handler
│       ├── middlewares/
│       │   └── auth.middleware.js # JWT verification and RBAC middleware
│       ├── models/
│       │   ├── album.model.js     # Album schema & references
│       │   ├── music.model.js     # Track schema (URI, artist ref, duration, genre, plays)
│       │   └── user.model.js      # User schema with roles ('user' | 'artist')
│       ├── routes/
│       │   ├── auth.routes.js     # /api/auth endpoints
│       │   └── music.routes.js    # /api/music endpoints
│       └── services/
│           └── storage.service.js # ImageKit client and audio upload service
├── Frontend/
│   ├── assets/                    # Icons and album cover assets
│   ├── css/
│   │   └── style.css              # Pastel biscuit design system and animations
│   ├── js/
│   │   └── app.js                 # SPA UI logic, audio player, API client, queue state
│   └── index.html                 # Single page application markup
├── .env.example                   # Environment variable template
├── package.json                   # Root package configuration
├── server.js                      # Root entry point forwarding to Backend/server.js
└── README.md                      # Project documentation
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI (or local MongoDB)
- An [ImageKit.io](https://imagekit.io/) account (for audio storage credentials)

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AB-Desire/MusicStreamingPlatform.git
   cd MusicStreamingPlatform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

---

### Environment Configuration

Create a `.env` file in the root directory (or in `Backend/.env`) based on the provided [.env.example](file:///.env.example):

```env
# MongoDB Connection String
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/soundwave?retryWrites=true&w=majority

# JWT Secret for Session Tokens
JWT_SECRET=your_super_secret_jwt_key_here

# ImageKit Configuration (for uploading and streaming audio)
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key_here

# Server Port (optional, default is 3000)
PORT=3000
```

---

### Running the App

Start the development server with hot-reloading (via nodemon):

```bash
npm run dev
```

Or run in standard production mode:

```bash
npm start
```

Once started, open your browser and navigate to:
```text
http://localhost:3000
```

---

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (`username`, `email`, `password`, `role`) | None |
| `POST` | `/api/auth/login` | Log in with credentials (`username`/`email`, `password`) | None |
| `POST` | `/api/auth/logout` | Clear session cookie | None |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile | User / Artist |
| `POST` | `/api/auth/switch-role`| Toggle or switch role between `user` and `artist` | User / Artist |

### Music & Streaming Routes (`/api/music`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/music` | List all tracks (supports `search`, `genre`, `artist` filters) | Public |
| `GET` | `/api/music/:id` | Fetch track details by ID | Public |
| `POST` | `/api/music/:id/play` | Increment track play count | Public |
| `GET` | `/api/music/albums` | List all curated albums | Public |
| `GET` | `/api/music/albums/:albumId` | Get album details with full tracklist | Public |
| `POST` | `/api/music/upload` | Upload audio file with metadata (`multer` single file) | **Artist Only** |
| `POST` | `/api/music/album` | Create a new album with selected tracks | **Artist Only** |
| `GET` | `/api/music/artist/tracks` | Fetch all tracks uploaded by current artist | **Artist Only** |
| `GET` | `/api/music/artist/albums` | Fetch all albums created by current artist | **Artist Only** |
| `DELETE` | `/api/music/:id` | Delete track by ID (cascades removal from albums) | **Artist Only** |

---

## 🎨 Design Aesthetic

The interface embraces a **Pastel Biscuit & Soft Cream** palette:
- **Palette**: Warm cream background (`#fcf9f2`), soft biscuits (`#e8dfd2`), muted accents (`#a582bf`), and velvety charcoal typography (`#2d2926`).
- **Interactive Micro-animations**: Subtle hover elevations, floating control bar, vinyl spin effects, and smooth drawer transitions.
- **Glassmorphism & Frosted Panes**: Opaque backdrop blurs providing visual depth without distracting from the music.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/NewFeature`).
3. Commit your changes (`git commit -m 'Add NewFeature'`).
4. Push to the branch (`git push origin feature/NewFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the [ISC License](file:///LICENSE).
