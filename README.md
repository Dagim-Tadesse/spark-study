# Spark Study

Spark Study is a modern, production-ready flashcard and spaced repetition learning application built with Vite, React, TypeScript, and Supabase.

This repository features a robust front-end experience with full backend persistence, authentication, and cloud data synchronization.

## Features

- **Authentication**: Secure user login and signup powered by Supabase.
- **Cloud Persistence**: Decks, cards, and study statistics are securely saved in the cloud.
- **Rich Text Editor**: A robust `contentEditable` editor supporting formatting (H1, Bullets, Bold, Italic), Math equations, Audio tags, and seamless Image uploads.
- **Study Mode**: Interactive card flipping with spaced repetition actions (Know, Review again) and progress tracking.
- **Dashboard & Analytics**: Track your study streak, total reviews, and retention rates.
- **Tags & Templates**: Categorize cards quickly with predefined templates (Formula, Definition, etc.).
- **Accessibility & i18n**: Dark/Light modes, color-blind safe palettes, English/Amharic translation support, and full keyboard navigation.

## Requirements

- Node.js (recommended: Node 20+)
- npm (comes with Node)
- Supabase Project (for database and auth)

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the dev server:

```bash
npm run dev
```

4. Open the URL Vite prints in the terminal (usually `http://localhost:5173`).

## Common commands

- **Development**: `npm run dev`
- **Production build**: `npm run build`
- **Preview build**: `npm run preview`
- **Lint**: `npm run lint`

## Tech stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, framer-motion, lucide-react
- **Backend / Database**: Supabase (PostgreSQL, Authentication)
- **Routing**: React Router
- **State Management / Data Fetching**: Context API, custom services

## Project structure

- `src/pages/`: Main application views (Dashboard, Library, Study, etc.)
- `src/components/`: Reusable UI components
- `src/contexts/`: Global state (Auth, i18n, Accessibility)
- `src/services/`: Supabase data fetching services
- `supabase/`: Database schemas and RLS policies

## Assets

This repo includes small "mini" GIFs used in UI demos and onboarding. Add any new GIFs under `public/assets/mini/` and reference them in the README or components as needed.

Example:

- `public/assets/mini/onboarding.gif` — quick tour animation (120x120)
