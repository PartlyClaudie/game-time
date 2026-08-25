# Game Hub

A small arcade of browser games, built one at a time.

## Stack
- React + Vite
- React Router (hub navigation)
- Vercel (hosting)
- PartyKit (real-time multiplayer, added in Step 3)

## Run locally
```bash
npm install
npm run dev
```
Then open the printed localhost URL.

## Roadmap
- [x] Step 1 — Foundation: hub shell, routing, placeholder cabinets
- [ ] Step 2 — Single player: 2048
- [ ] Step 3 — Multiplayer: Tic-Tac-Toe (PartyKit)
- [ ] Step 4 — Polish: shared nav, README pass, deploy checks

## Deploying to Vercel
1. Push this repo to GitHub.
2. In the Vercel dashboard: **Add New Project** → import the repo.
3. Framework preset: **Vite** (auto-detected). No config changes needed.
4. Deploy. Every push to `main` auto-deploys.
