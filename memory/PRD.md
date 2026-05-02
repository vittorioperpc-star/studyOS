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
- Billing: Stripe (MOCKED — upgrade endpoint just flips plan)

## Implemented (2026-05)
- Landing, Login, Signup, Pricing pages
- Auth (JWT + Google OAuth)
- Upload PDF / image / pasted text → OCR + content generation
- Materials CRUD, Library, Material view with tabs (Summary, Schema, Flashcards, Quiz, Exam Qs)
- Flashcard spaced repetition (SM-2)
- Quiz interactive + results saved
- Study Plan auto-calendar (study + review days, toggle done)
- Stats overview with 7-day activity chart
- Free plan limit: 3 uploads/day (`FREE_DAILY_UPLOADS`)
- Premium upgrade (mocked, instant)

## Deferred / Backlog
- Stripe real payments (Checkout + webhook)
- Email notifications / study reminders
- Shared deck / export to Anki
- AI chat with the material (Q&A)
- Mobile push / PWA

## Test credentials
See `/app/memory/test_credentials.md`
