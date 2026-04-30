# 🇨🇦 Canadian Retirement Calculator

A comprehensive, privacy-first Canadian retirement planning calculator built with Next.js 16, TypeScript, and Tailwind CSS. All calculations run client-side in your browser — no backend, no accounts, no tracking.

## Features

- **Province-aware tax engine** — 2025 federal + provincial/territorial brackets for all 13 jurisdictions
- **Government benefits** — OAS (with deferral 65–70 and clawback), CPP (60/65/70), inflation-indexed
- **Multi-scenario projections** — XEQT benchmark (13.86%), user-defined trajectory, conservative
- **Monte Carlo simulation** — 500 randomized paths with success rate
- **Withdrawal optimization** — pre-65 vs post-65 strategies, optimal account ordering
- **Lunch Money integration** — auto-import account balances (key stored only in your browser)
- **Export** — print-ready PDF, year-by-year CSV, shareable URL
- **Dark mode**, mobile responsive, full keyboard accessibility

## Stack

- Next.js 16 App Router · TypeScript · Tailwind CSS v4
- shadcn/ui components · Recharts for visualization
- Zustand (with immer + persist) for state management
- React Hook Form + Zod for validation
- Vercel deployment ready

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & Deploy

```bash
npm run build  # Verify the production build
npm start      # Serve locally
```

### Deploy to Vercel

```bash
vercel deploy
```

Or push to GitHub and connect the repo at [vercel.com/new](https://vercel.com/new). Settings are pre-configured in `vercel.json` (security headers + CSP).

## Privacy & Security

- **No backend**: every calculation runs client-side
- **No accounts**: no signup, no auth, no analytics by default
- **Lunch Money key**: stored only in `localStorage`, sent only to `dev.lunchmoney.app`
- **CSP headers** restrict outbound connections to Lunch Money's API

## File Structure

```
src/
  app/                    Next.js App Router pages
    page.tsx              Main calculator
    settings/page.tsx     Lunch Money setup
    layout.tsx
    globals.css
  components/
    calculator/           Charts, dashboard, inputs, etc.
    lunchmoney/           API connect, account categorization
    ui/                   shadcn/ui generated components
  lib/
    constants.ts          2025 tax brackets, OAS/CPP/RRSP/TFSA
    tax.ts                Tax calculation engine
    retirement.ts         Projection + PMT engine
    monteCarlo.ts         Simulation
    lunchmoney.ts         Lunch Money API client
    utils.ts              cn(), formatters
  store/
    calculatorStore.ts    Zustand state
  types/
    index.ts              Shared TypeScript types
```

## Disclaimer

For informational purposes only. Not financial advice. Consult a licensed financial advisor.
Tax rates, OAS, and CPP amounts are current as of Q1 2025 and indexed annually in projections.
