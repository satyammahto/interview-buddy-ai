

# AI Interview Platform — Hackathon MVP

## Overview
A web app where users upload a resume, select an interview type, and have a realistic AI voice interview with real-time transcription and a scored feedback report — all without login.

## Pages & Flow

### 1. Landing Page (`/`)
- Hero section with tagline: "Practice interviews with AI that talks back"
- Big CTA: "Start Interview" → goes to setup page
- Feature highlights (voice AI, smart questions, instant feedback)
- Clean, modern design with Framer Motion-style animations via Tailwind

### 2. Interview Setup (`/setup`)
- **Resume upload** (PDF drag-and-drop) — parsed via Lovable AI edge function to extract skills, experience, job titles
- **Interview mode selector**: Technical, Behavioral, HR, Stress
- **Target role input** (e.g. "Senior Frontend Engineer")
- **Difficulty level**: Junior / Mid / Senior
- "Start Interview" button

### 3. Live Interview (`/interview`)
- AI interviewer avatar/visual indicator with speaking animation
- **Voice output**: ElevenLabs TTS via edge function — AI questions read aloud
- **Voice input**: Browser Web Speech API for real-time speech-to-text
- Live transcript panel showing conversation
- Question counter (e.g. "Question 3 of 8")
- Flow: AI asks question → user speaks → transcript captured → AI evaluates + generates follow-up → next question voiced
- "End Interview" button

### 4. Report Dashboard (`/report`)
- **Overall score** (out of 50) with radar chart (Recharts)
- **5 scoring dimensions**: Technical Knowledge, Communication, Problem-Solving, Confidence, Relevance — each scored 1-10
- Per-question breakdown: question text, user's answer transcript, AI feedback, individual scores
- Strengths & areas for improvement summary
- Full interview transcript with timestamps
- "Try Again" and "Share Results" buttons

## Backend (Lovable Cloud Edge Functions)

### `parse-resume`
- Accepts PDF upload, uses Lovable AI to extract: skills, experience level, past roles, education
- Returns structured JSON

### `generate-questions`
- Input: extracted skills, role, mode, difficulty
- Uses Lovable AI to generate 6-8 tailored interview questions
- Returns question list with metadata

### `evaluate-answer`
- Input: question, user's transcript answer, conversation context
- Uses Lovable AI to score on 5 dimensions + generate feedback + decide follow-up question
- Returns scores, feedback text, and optional follow-up question

### `text-to-speech`
- Input: text to speak
- Calls ElevenLabs API to generate audio
- Returns audio stream/blob for browser playback

## Key Technical Decisions
- **No auth / no database** — everything is session-based in React state for hackathon speed
- **Web Speech API** for STT (free, instant, no backend needed)
- **ElevenLabs** for realistic AI voice (via connector)
- **Lovable AI** (Gemini) for all LLM tasks: resume parsing, question generation, answer evaluation
- **Recharts** for score visualization (already in dependencies)

## Voice Interview Loop (Core UX)
1. Edge function generates question text
2. Text sent to ElevenLabs TTS → audio played in browser
3. User clicks "Answer" → Web Speech API captures speech → live transcript
4. User clicks "Done" → transcript sent to evaluation edge function
5. AI scores answer, generates feedback, decides next question or follow-up
6. Repeat until all questions done → redirect to report

