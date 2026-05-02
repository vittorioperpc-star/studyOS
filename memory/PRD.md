# StudyOS — Product Requirements

## Stack
- FastAPI + MongoDB · React 19 + Tailwind + shadcn/ui + recharts
- AI: Claude Sonnet 4.5 via emergentintegrations (Emergent LLM Key)
- OCR: Claude vision · Auth: JWT + Emergent Google OAuth
- Storage: Emergent Object Storage · Billing: PayPal LIVE
- Notifications: in-app + Web Push (VAPID)

## Implemented (2026-05)
### Phase 1 — MVP
- Landing/Login/Signup/Pricing, JWT + Google OAuth
- Upload PDF/image/text → AI generation
- Materials CRUD, viewer (Summary/Schema/Flashcards/Quiz/Exam)
- Flashcard SM-2, Quiz with results saved
- Study Plan auto-calendar, Stats dashboard

### Phase 2 — Engagement & Monetization
- AI Chat per materiale (Claude Sonnet 4.5, history)
- In-app notifications + Web Push (VAPID + service worker)
- PayPal Smart Buttons LIVE — €4,99/30 giorni
- `premium_until` + auto-downgrade

### Phase 3 — Brand, UX & Premium gates
- New brain+book purple/blue logo (LogoMark/LogoFull/LogoIcon)
- Beautified Landing (gradients, testimonials, 4-step section)
- First-visit Onboarding modal (5 steps)
- General Support Chat (LifeBuoy floating button, KB-aware)
- Real Premium gates: 3 uploads/day, 10 AI chat msgs/day, 1 study plan
- Dashboard limits card with progress bars
- `/api/me/limits` endpoint

## Deferred / Backlog
- PayPal Subscriptions (rinnovo automatico)
- Email notifications (Resend/SendGrid)
- Streak counter / gamification
- Export Anki / shared decks
- PWA installabile

## Known notes
- PayPal credentials are LIVE (production). Use real with caution.
- Emergent LLM key budget previously hit cap (0.4459/0.4); top-up via Profile → Universal Key.

## Test credentials
See `/app/memory/test_credentials.md`
