# Serenity - Complete Feature List

## Core Features

### 1. Focus Timer
The heart of Serenity with two operational modes:

#### Custom Timer Mode
- Set any duration from 1 to 120 minutes
- Quick preset buttons: 5m, 15m, 25m, 45m, 60m, 90m
- Large, clear display with MM:SS format
- Start, Pause, and Reset controls
- Spacebar keyboard support for quick start/pause

#### Pomodoro Timer Mode
- **Focus Phase**: Default 25 minutes (customizable)
- **Short Break**: Default 5 minutes (customizable)
- **Long Break**: Default 15 minutes (customizable)
- Automatic cycling: 4 focus sessions → long break
- Visual mode indicator showing current phase
- Session counter to track progress

### 2. Visual Design
Professional anime-inspired aesthetic with:
- **Glassmorphism UI**: Frosted glass effect cards with backdrop blur (40px)
- **Soft Gradients**: Muted pastel colors throughout
- **Circular Progress Ring**: SVG-based progress indicator with breathing animation
- **Color System**: 
  - Primary: Soft purple to pink gradients
  - Secondary: Blue to cyan for variety
  - Accents: Warm colors for action buttons
  - Neutrals: Light backgrounds with careful contrast

### 3. Wallpaper System
8 fully themed anime-inspired backgrounds:

1. **Rainy Night** - Dark slate gradient with rain-inspired overlay
2. **Quiet Village** - Indigo and purple tones, peaceful atmosphere
3. **Forest** - Green and emerald gradients, natural serenity
4. **Lonely Café** - Warm amber and orange, cozy study spot
5. **Anime Bedroom** - Soft pink and purple, personal sanctuary
6. **Sunset City** - Orange to purple transition, inspirational
7. **Peaceful Night** - Deep blue and indigo, calm focus
8. **Autumn Study** - Warm amber and red, seasonal comfort

**Each wallpaper includes:**
- Base gradient backdrop
- Subtle radial overlay for depth
- Noise texture (10% opacity) for visual interest
- Floating particle animation
- Auto brightness adjustment based on time of day
- 1-second fade transition between scenes

### 4. Statistics & Progress Tracking

#### Daily Statistics
- Total focus minutes today
- Number of sessions completed
- Real-time update as sessions complete

#### Weekly Overview
- Bar chart showing daily breakdown
- 7-day rolling window
- Compare day-to-day progress
- Identify your most productive days

#### Monthly Trends
- Line chart tracking 30-day history
- Identify patterns and trends
- See long-term progress
- Set monthly goals

#### Streak System
- Current daily streak counter
- Best streak record
- Maintains consistency motivation
- Automatically updates after each session
- Reset logic for broken streaks

#### Stats Dashboard Features
- 4-card stat summary at top
- Two interactive Recharts visualizations
- Tips section with focus advice
- All displayed with glassmorphism design
- Soft purple/blue/green/orange color coding

### 5. Settings & Customization

#### Wallpaper Selection
- Dropdown menu for quick selection
- Visual grid preview (2x4 on mobile, responsive)
- Instant preview updates
- Saved to localStorage

#### UI Preferences
- Animation toggle (global control)
- Affects all transitions and breathing effects
- Persistent setting

#### Ambient Sound Settings
- Visual indicators for three options:
  - 🌧️ Rain
  - ☕ Café
  - 🔇 Silence
- No actual audio (could be added as feature)
- Selected state shows with highlight

#### Pomodoro Timer Settings
- Focus Time: 1-120 minutes (default 25)
- Short Break: 1-30 minutes (default 5)
- Long Break: 1-60 minutes (default 15)
- Number inputs with validation
- Real-time synchronization with timer

#### Settings Persistence
- All settings stored in localStorage
- Automatic save on change
- Load on app startup
- No account needed

### 6. Navigation System

#### Three-Tab Interface
- **Focus Tab** (Clock icon)
  - Primary workspace
  - Timer controls and wallpaper display
  - Motivational quotes
  - Pomodoro mode toggle

- **Stats Tab** (BarChart icon)
  - Statistics dashboard
  - Progress charts
  - Streak display
  - Tips and motivation

- **Settings Tab** (Settings icon)
  - All customization options
  - About section
  - Privacy notice

#### Navigation Bar
- Sticky positioning at top
- Semi-transparent background with blur
- Active state highlighting with gradients
- Responsive: full on desktop, compact on mobile
- High z-index for always accessible

### 7. Interactions & Animations

#### Timer Animations
- **Breathing Effect**: SVG circle opacity pulses (3s cycle)
- **Progress Ring**: Smooth stroke-dasharray animation
- **Pulse Text**: Optional gentle opacity animation
- **Button Animations**: Hover effects with scale and shadow

#### Page Transitions
- Fade-in effect (0.3s) when switching pages
- Smooth easing function
- Can be toggled in settings

#### Wallpaper Transitions
- 1-second fade between scenes
- Smooth brightness adjustment for day/night
- Floating particles with staggered timing

#### Card Animations
- Glassmorphism hover effects
- Subtle shadow enhancement
- Smooth color transitions

#### Notification Animations
- Slide-in from top (0.3s)
- Fade-out after 4 seconds
- Position: top-left on mobile, top-right on desktop

### 8. Data Persistence

#### LocalStorage Keys
- `serenity_stats`: Daily focus statistics
- `serenity_streak`: Streak information
- `serenity_settings`: User preferences

#### Data Structure
**Stats Format:**
```json
{
  "YYYY-MM-DD": {
    "date": "YYYY-MM-DD",
    "totalMinutes": 95,
    "sessions": 4
  }
}
```

**Streak Format:**
```json
{
  "currentStreak": 7,
  "lastActivityDate": "2024-01-15",
  "bestStreak": 21
}
```

**Settings Format:**
```json
{
  "wallpaper": "rainy-night",
  "animationsEnabled": true,
  "ambientSound": "silence",
  "focusTime": 25,
  "shortBreak": 5,
  "longBreak": 15
}
```

### 9. Accessibility Features

- Semantic HTML with proper heading hierarchy
- ARIA labels where needed
- Keyboard navigation support
- Spacebar shortcut for timer control
- Color contrast meets WCAG standards
- Screen reader friendly
- Responsive design for all device sizes

### 10. User Experience Features

#### Keyboard Support
- **Spacebar**: Start/Pause timer
- Standard browser shortcuts work (Tab, Enter, Escape)

#### Motivational Elements
- Random quotes on Focus tab
- 8 different inspiring messages
- Session completion notifications
- Streak counter for consistency motivation
- Achievement-focused stats display

#### Help & Guidance
- Floating help button (bottom-right)
- Quick guide modal
- Tips in settings page
- Keyboard hint on timer
- Feature explanations throughout

#### Responsive Design
- Mobile-first approach
- Breakpoints: 768px, 1024px
- Touch-friendly button sizes (44px minimum)
- Readable text scaling
- Flexible grid layouts
- Optimized navigation for small screens

## Technical Architecture

### Component Structure
```
/app
  /page.tsx (Main container, state management)
/components
  /focus-timer.tsx (Timer logic and UI)
  /wallpaper-background.tsx (Dynamic wallpaper)
  /stats-dashboard.tsx (Charts and statistics)
  /stats-tracker.ts (LocalStorage management)
  /settings-panel.tsx (Configuration UI)
  /session-notification.tsx (Completion alerts)
  /quick-guide.tsx (Help modal)
  /animated-background.tsx (Visual enhancements)
  /ui/* (Shadcn UI components)
```

### Styling System
- **Framework**: Tailwind CSS v4
- **Design Tokens**: CSS variables in globals.css
- **Color Palette**: 5 main colors + neutrals
- **Typography**: 2 font families (Geist sans, Geist Mono)
- **Border Radius**: 1rem base with variants
- **Animations**: Custom keyframes for all effects

### State Management
- React hooks (useState, useEffect, useRef)
- No external state library needed
- LocalStorage for persistence
- Direct prop passing between components

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

Requires support for:
- ES6+ JavaScript
- CSS Grid and Flexbox
- backdrop-filter CSS property
- LocalStorage API
- SVG animations

## Performance Optimizations

- Client-side rendering (no server delays)
- Efficient re-renders with proper dependency arrays
- LocalStorage instead of API calls
- CSS animations over JavaScript
- Debounced mouse tracking in animations
- Lazy evaluation of statistics

## Security

- No external API calls
- No user data transmitted
- All processing happens locally
- No cookies or tracking
- No third-party scripts
- Clean code with no vulnerabilities

---

**Last Updated**: January 2026
**Version**: 1.0.0
