# LearnAI Portal (KSE Hackathon Project)

## 1) Project description and purpose

LearnAI Portal is a multi-service educational platform for students and lecturers.  
It combines course management, testing, essay submissions, enrollment tracking, and analytics in one interface.

Its purpose is to improve learning outcomes with AI-assisted tutoring: students can ask questions in text or voice, receive streamed AI answers, and get spoken responses for better accessibility and engagement.

## 2) Launch instructions

### Prerequisites
- Docker + Docker Compose
- A valid Google Gemini API key (for AI tutor text generation)
- Open app via `localhost` or HTTPS (required for browser microphone API)

### Quick start (recommended)
1. Configure environment:
   - Copy/update `.env` in the repository root.
   - Set `GEMINI_API` to your key.
   - Ensure DB links are set (`DATABASE_URL`, `NODE_DATABASE_URL`).
2. Start the stack:
   ```bash
   docker compose up --build -d
   ```
3. Open the app:
   - Frontend via Nginx: `http://localhost` (or `http://localhost:${NGINX_PORT}`)
   - API (proxied): `http://localhost/api`
   - For voice input, use `localhost` (not `0.0.0.0`) or HTTPS.
4. Stop services:
   ```bash
   docker compose down -v
   ```

You can also use:
```bash
make build
make stop
```

### Default demo credentials (frontend)
- Student: `student / student`
- Lecturer: `lecturer / lecturer`

### API endpoints (short reference)

Base URL (via Nginx): `http://localhost/api`

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/ai/stream` | Stream AI tutor text response (Gemini-backed). |
| `POST` | `/ai/voice` | Convert text to speech via Voice Microservice. |
| `GET` | `/courses` | List all courses. |
| `POST` | `/courses` | Create a new course. |
| `GET` | `/tests` | List tests with course titles. |
| `GET` | `/tests/:id` | Get a single test with questions/options. |
| `POST` | `/tests` | Create a test (and nested questions/options). |
| `POST` | `/tests/:id/submit` | Submit student answers and store score. |
| `GET` | `/results` | Get test results and progress history. |
| `POST` | `/enroll` | Enroll a student into a course. |
| `GET` | `/enrollments/:student_id` | List enrolled course IDs for a student. |
| `POST` | `/activities` | Create a course activity (pdf/test/essay). |
| `GET` | `/activities/:course_id` | List activities by course. |
| `POST` | `/essay_submissions` | Submit essay response for an activity. |

## 3) Technologies and AI services used

### Core technologies
- **Frontend:** React 19, Vite, Tailwind CSS, Recharts
- **Backend API:** Node.js + Express, PostgreSQL, Multer (file uploads)
- **Voice microservice:** FastAPI (Python), gTTS / pyttsx3
- **Infra:** Docker Compose, Nginx reverse proxy

### AI services and AI-related features
- **Google Gemini API** (`GEMINI_API`, model from `GEMINI_MODEL`) for AI tutor responses
- **SSE streaming** from backend to frontend for incremental tutor output
- **Voice synthesis microservice** for converting AI text responses to audio
- **Browser speech recognition** (Web Speech API, if available) for voice input

### Voice input note (important)
- Browser microphone recognition works only in a **secure context**:
  - `https://...`, or
  - `http://localhost` (special browser exception).
- `http://0.0.0.0` is treated as insecure by browsers, so voice recording may fail there.

## 4) Educational challenge addressed

The project addresses a common challenge in education: giving every student timely, personalized support while keeping teacher workload manageable.

This solution combines:
- AI tutoring for immediate Q&A help
- Structured assessments (tests + essays) with result tracking
- Anti-cheating behavior checks during assessments
- Voice interaction to support accessibility and different learning preferences

Together, these features help bridge the gap between large-class constraints and individualized learning support.
