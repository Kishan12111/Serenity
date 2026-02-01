<!-- Use this file to provide workspace-specific custom instructions to Copilot. -->

## Project: Serinity - Focus Timer App

**The world's first free Pomodoro timer with comprehensive focus statistics and anime-inspired ambient themes.**

**Domain**: https://www.serinityfocus.app

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Convex (serverless backend)
- **Analytics**: Vercel Analytics

### Project Structure
```
timer/
├── app/           # Next.js App Router pages and layouts
│   ├── auth/      # Authentication page
│   ├── layout.tsx # Root layout with SEO & providers
│   └── page.tsx   # Main focus timer page
├── components/    # React components
│   ├── ui/        # shadcn/ui components
│   └── ...        # Timer, stats, settings components
├── convex/        # Convex backend
│   ├── schema.ts  # Database schema
│   ├── auth.ts    # Authentication functions
│   ├── stats.ts   # Statistics functions
│   └── users.ts   # User management functions
├── lib/           # Utilities & hooks
│   ├── useAuth.tsx # Authentication context
│   └── useConvexStats.ts # Stats hook
└── public/        # Static assets
```

### Key Features
- Custom authentication system (email/password)
- Unified user data model (all stats in single users table)
- Anonymous user support with account migration
- Pomodoro technique timer
- Beautiful anime-inspired backgrounds
- Focus statistics tracking
- Daily streaks

### Database Schema
The app uses a single `users` table containing:
- Authentication (email, passwordHash)
- Settings (wallpaper, timer preferences)
- Streak data (current, best, lastActivityDate)
- Daily stats (last 90 days)
- Recent sessions (last 50 sessions)
- Lifetime totals

### Running the Project
1. `npm run dev` - Start Next.js development server
2. `npx convex dev` - Start Convex backend (in separate terminal)
3. Open http://localhost:3000

### Authentication Flow
- Users can use the app anonymously
- Creating an account migrates anonymous data
- Auth state stored in localStorage
- Email-based authentication

### SEO
- Comprehensive metadata in layout.tsx
- JSON-LD structured data for WebApplication
- Open Graph & Twitter cards
- robots.txt and sitemap.ts
- PWA manifest.json
