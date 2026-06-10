# CodeCompassAI 🚀

An AI-powered developer onboarding platform that analyzes GitHub repositories and generates personalized contribution roadmaps. Designed to help developers understand unfamiliar codebases faster and discover meaningful contribution opportunities.

## 🌟 Features

🔍 **AI-Powered Analysis** - Gemini analyzes repository structure and suggests beginner-friendly entry points

📊 **Health Metrics** - File churn and bug frequency analytics (Snowflake integration optional)

🎙️ **Voice Mentorship** - Optional AI voice guidance using ElevenLabs

💾 **Smart Caching** - MongoDB Atlas stores generated roadmaps for quick retrieval

🎨 **Modern Dashboard** - Interactive developer dashboard built with Next.js

🐳 **Dockerized** - Run the entire stack with `docker-compose up`

---

## 🏗️ Tech Stack

**Frontend:** Next.js 14, React 18, Tailwind CSS

**Backend:** Hono.js on Node.js

**AI:** Google Gemini

**Database:** MongoDB Atlas

**Voice:** ElevenLabs TTS (Optional)

**Analytics:** Snowflake (Optional)

**Deployment:** Docker + Docker Compose

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* npm or pnpm
* Docker & Docker Compose
* API Keys:

  * GitHub
  * Gemini
  * MongoDB Atlas
  * ElevenLabs (Optional)
  * Snowflake (Optional)

### Setup

Clone and configure the project:

```bash
git clone <your-repo-url>
cd CodeCompassAI
cp .env.example .env
```

Add your API keys to `.env`:

```env
GITHUB_TOKEN=ghp_your_token_here
GEMINI_API_KEY=your_gemini_key_here
MONGODB_URI=mongodb+srv://...
ELEVENLABS_API_KEY=your_key_here
```

Start the application:

```bash
docker-compose up --build
```

### Access the Dashboard

**Frontend:** http://localhost:3000

**Backend API:** http://localhost:8787

---

## 📡 API Endpoints

### `POST /api/analyze`

Analyze a GitHub repository and generate a contribution roadmap.

### `POST /api/voice/mentor`

Generate voice audio for mentor introduction.

**Request**

```json
{
  "architectureSummary": "...",
  "repoName": "next.js"
}
```

### `GET /api/roadmaps`

List recently generated roadmaps.

---

## 🎯 How It Works

1. Enter a GitHub repository URL.
2. AI analyzes the repository structure, tech stack, and architecture.
3. Get a personalized roadmap with beginner-friendly entry points ranked by difficulty.
4. View health metrics showing file stability and repository activity.
5. Listen to an AI-generated mentor introduction (optional).

---

## 📄 API Configuration

### Required Environment Variables

| Variable       | Description                     |
| -------------- | ------------------------------- |
| GITHUB_TOKEN   | GitHub Personal Access Token    |
| GEMINI_API_KEY | Google AI Studio API Key        |
| MONGODB_URI    | MongoDB Atlas Connection String |

### Optional Environment Variables

| Variable           | Description        |
| ------------------ | ------------------ |
| ELEVENLABS_API_KEY | ElevenLabs API Key |
| SNOWFLAKE_ACCOUNT  | Snowflake Account  |
| SNOWFLAKE_USER     | Snowflake Username |
| SNOWFLAKE_PASSWORD | Snowflake Password |

**Note:** Without Snowflake credentials, the application uses mock health metrics. Without ElevenLabs credentials, voice features are disabled.

---

## 👩‍💻 Author

**Aparna Ojha**

B.Tech Information Technology Student | Full Stack Developer

---

## 📄 License

This project is licensed under the MIT License.
