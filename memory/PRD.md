# StudyOS — Product Requirements

## Original problem
SaaS per studenti (scuole superiori e università) che trasforma materiali di studio (PDF, foto di appunti) in contenuti AI (riassunti, schemi, flashcard, quiz, domande d'esame), con modalità studio attivo (spaced repetition), piano di studio automatico, tracking progresso, free/premium.

## Stack
- FastAPI + MongoDB (motor)
- React 19 + Tailwind + shadcn/ui + recharts
- AI: Claude Sonnet 4.5 via emergentintegrations (Emergent LLM Key)
- OCR: Claude vision
- Auth: JWT email/password + Emergent Google OAuth
- Storage: Emergent Object Storage
- Billing: **PayPal LIVE** (Smart Buttons via @paypal/react-paypal-js)
- Notifications: in-app + Web Push (VAPID)

## Implemented (2026-05)
### Phase 1 — MVP
- Landing, Login, Signup, Pricing pages
- Auth (JWT + Google OAuth)
- Upload PDF / image / pasted text → OCR + content generation
- Materials CRUD, Library, Material view with tabs (Summary, Schema, Flashcards, Quiz, Exam Qs)
- Flashcard spaced repetition (SM-2)
- Quiz interactive + results saved
- Study Plan auto-calendar (study + review days, toggle done)
- Stats overview with 7-day activity chart
- Free plan limit: 3 uploads/day

### Phase 2 — Engagement & Monetization
- **AI Chat per materiale** (drawer chat con history persistente, Claude Sonnet 4.5)
- **Notifications Bell** (in-app, popover, polling 60s, segna come letto, "Attiva push")
- **Web Push notifications** (Service Worker `/sw.js`, VAPID auto-generated, subscription persistente)
- **PayPal Smart Buttons** in Pricing — €4,99 / 30 giorni
- Auto-generate daily study reminder notifications (idempotent) per ogni piano attivo
- `premium_until` su user; auto-downgrade alla scadenza; PayPal capture idempotente

## Deferred / Backlog
- PayPal Subscriptions (rinnovo automatico)
- PayPal webhook verification (currently relies on synchronous capture)
- Email notifications (Resend/SendGrid) — opzionale
- Export deck Anki / condivisione pubblica materiali
- Streak counter & gamification (idea suggerita all'utente)
- PWA / mobile app

## Test credentials
See `/app/memory/test_credentials.md`

## Known notes
- PayPal credentials in /app/backend/.env are **LIVE** (not sandbox). Test capture only with PayPal sandbox accounts before pushing to real users.
- Emergent LLM key budget hit a limit during dev (0.4459/0.4) — user can top-up via Profile → Universal Key.
