# Serenity - Visual Design Guide

## Color Palette

### Primary Colors
- **Purple/Pink Gradient**: `from-purple-500 to-pink-500` - Focus mode, primary actions
- **Blue/Cyan Gradient**: `from-blue-500 to-cyan-500` - Short breaks, secondary elements
- **Emerald/Teal Gradient**: `from-emerald-500 to-teal-500` - Long breaks, success states
- **Orange/Red Gradient**: `from-orange-500 to-red-500` - Streak tracking, fire emoji

### Neutral Palette
- **Background**: Very dark blue-grey (`oklch(0.15 0.01 200)`)
- **Card Background**: Slightly lighter dark (`oklch(0.20 0.01 200)`)
- **Text**: Off-white (`oklch(0.92 0.02 200)`)
- **Text Secondary**: Muted white (`oklch(0.65 0.02 200)`)
- **Borders**: Subtle white with transparency (`rgba(255, 255, 255, 0.1-0.2)`)

---

## Typography

### Fonts
- **Primary**: Geist (sans-serif)
- **Scale**: 
  - Extra Large: 7rem (timer display)
  - Large: 4xl (stat values)
  - Medium: xl (section headers)
  - Small: sm (labels)
  - Tiny: xs (hints)

### Text Effects
- **Gradient Text**: `bg-gradient-to-r [colors] bg-clip-text text-transparent`
- **Breathing**: Subtle opacity animation on active elements
- **Emphasis**: Gradient text for important metrics

---

## Component Styling

### Glass Cards
```
Class: glass-dark
- Background: rgba(0, 0, 0, 0.2)
- Backdrop Blur: 12px
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Rounded: 2xl (16px)
```

### Buttons
```
Primary (Gradient):
- Background: linear-gradient(purple → pink)
- Color: white
- Padding: px-8 py-3
- Border-radius: full

Secondary (Glass):
- Background: rgba(255, 255, 255, 0.1)
- Border: 1px solid rgba(255, 255, 255, 0.2)
- Color: white
- Hover: bg-white/20, border-white/40
```

### Input Fields
```
Class: glass input
- Background: rgba(255, 255, 255, 0.1)
- Border: 1px solid rgba(255, 255, 255, 0.2)
- Color: white
- Focus: border-white/40, bg-white/15
- Padding: px-4 py-3
```

---

## Layout Structure

### Page Layout
```
Fixed Background (Wallpaper)
    ↓
Content Overlay (z-10)
    ↓
Navigation Bar (Top)
    ↓
Main Content Area
    ├─ Streak Indicator
    ├─ Focus Timer
    ├─ Mode Toggle
    └─ Quote Card
```

### Responsive Grid
- **Mobile**: Single column, full width minus padding
- **Tablet**: 2-column layouts
- **Desktop**: 3-4 column grids
- **Max Width**: 5xl (64rem) for content

---

## Animation Timing

### Durations
- **Page Transitions**: 300ms (fade-in)
- **Background Changes**: 1000ms (smooth fade)
- **Breathing Timer**: 3000ms (infinite)
- **Button Hover**: 200ms
- **Chart Animations**: 600ms

### Animation Types
- **breathing**: Opacity pulse (1.0 → 0.8 → 1.0)
- **fadeIn**: Opacity 0 → 1
- **float**: Particles rising with opacity change
- **slide-in**: Y-translate with fade

---

## Visual Hierarchy

### Emphasis Levels

**Level 1 (Highest)**: Timer Display
- 7rem font
- Gradient text
- Breathing animation
- Center of screen

**Level 2 (High)**: Stat Cards
- 4xl font
- Gradient text
- Glassmorphism
- Top section

**Level 3 (Medium)**: Section Headers
- xl font
- Bold weight
- Gradient or colored text
- Clear spacing

**Level 4 (Low)**: Labels & Hints
- sm/xs font
- Muted color
- Supporting role

---

## Micro-interactions

### Button Feedback
1. **Hover**: Background lightens, border becomes more visible
2. **Active**: Color intensifies
3. **Disabled**: Opacity reduces to 50%

### Input Feedback
1. **Focus**: Border and background brightness increase
2. **Filled**: Text color becomes brighter
3. **Error**: Red border/glow (when applicable)

### Chart Interactions
1. **Hover**: Tooltip appears with smooth fade
2. **Hover Data**: Point enlarges from r=4 to r=6
3. **Animation**: Smooth entrance from left-to-right

---

## Background Scenes

### Visual Characteristics

| Scene | Mood | Color Tone | Best For |
|-------|------|-----------|----------|
| Rainy Night | Cozy, rainy | Purple-blue with neon | Evening studying |
| Mountain Sunset | Serene, inspiring | Orange-pink gradient | Afternoon focus |
| Forest | Natural, peaceful | Green tones | Calm concentration |
| Café | Social, comfortable | Warm browns | Group studying |
| Study Room | Focused, productive | Neutral greys | Serious work |
| City Night | Urban, modern | Purple-blue neon | Late night sessions |
| Village | Quiet, traditional | Warm earth tones | Meditative focus |
| Rainy Season | Tranquil, wet | Cool blues-greys | Relaxed studying |
| Zen Garden | Minimalist, peaceful | Green-grey balance | Deep meditation |

### Visual Effects Per Scene
- **Overlay Opacity**: 0.3-0.6 depending on image lightness
- **Night Mode**: Brightness reduced by 25% after 6pm
- **Particles**: 15 subtle floating elements
- **Transition**: 1000ms smooth fade between scenes

---

## Streak Indicator Design

### Current Streak Card
- **Size**: w-28 h-28 (medium)
- **Background**: Gradient orange-red with 20% opacity
- **Border**: orange-400 with 30% opacity
- **Icon**: 🔥 (5xl)
- **Number**: 4xl bold gradient orange-to-red
- **Label**: "day streak" (xs)

### Best Streak Card
- **Size**: w-28 h-28 (medium)
- **Background**: Gradient yellow-orange with 20% opacity
- **Border**: yellow-400 with 30% opacity
- **Icon**: ⭐ (5xl)
- **Number**: 4xl bold gradient yellow-to-orange
- **Label**: "best streak" (xs)

---

## Timer Component Details

### SVG Progress Ring
- **Radius**: 90px
- **Stroke Width**: 8px
- **Background Circle**: `rgba(255, 255, 255, 0.1)`
- **Progress Circle**: Gradient based on mode
- **Stroke Linecap**: round (smooth edges)
- **Animation**: 500ms transition on progress change

### Timer Display
- **Format**: MM:SS (e.g., "25:00")
- **Font**: 7rem monospace (font-mono)
- **Animation**: Breathing when running
- **Text Color**: Gradient matching mode

### Mode Badge
- **Padding**: px-6 py-2
- **Style**: Glassmorphic with subtle color tint
- **Text**: Gradient matching mode color
- **Position**: Above timer, center-aligned

---

## Settings Panel Layout

### Section Structure
```
Glass Card (Dark)
├─ Header with Emoji
│  └─ Gradient Text (xl, bold)
├─ Content Area
│  └─ Options/Controls
└─ Subtle Border (white/10)
```

### Button Grids
- **Wallpaper**: 3-column grid, 2-column mobile
- **Mood**: 3-column grid (radio-like)
- **Pomodoro**: 1-column form on mobile, 3-column on desktop

---

## Stats Dashboard Cards

### Stat Cards (4 columns desktop, 2 mobile)
```
Glass Card
├─ Label (sm, muted)
├─ Value (4xl, gradient)
└─ Unit (lg, secondary)
```

### Chart Containers
```
Glass Card with Title
└─ Responsive Chart
    ├─ Custom Grid (subtle)
    ├─ Animated Bars/Lines
    └─ Interactive Tooltip
```

---

## Accessibility Considerations

### Color Contrast
- All text on backgrounds meets WCAG AA standard (4.5:1)
- Gradient text uses primary color + white background
- Focus states are always visible

### Interactive Elements
- Minimum 44x44px touch targets
- Clear hover and focus indicators
- Keyboard navigation fully supported

### Text Readability
- Minimum 16px base font size
- Line-height 1.4-1.6 for body text
- `text-balance` class on important headings

---

## Motion Design Principles

1. **Purposeful**: Every animation serves a function
2. **Smooth**: 300-600ms durations for natural feel
3. **Subtle**: Opacity and scale changes, not jarring
4. **Consistent**: Same transitions across the app
5. **Responsive**: Respects prefers-reduced-motion

---

## Dark Mode Consistency

The entire app operates in dark mode:
- **Background**: Very dark blue-grey
- **Cards**: Slightly lighter dark with blur
- **Text**: Bright white on dark backgrounds
- **Accents**: Vibrant gradients to pop
- **No Light Mode**: Simplified for consistent beautiful experience

---

## Best Practices Applied

✅ Mobile-first responsive design
✅ Semantic HTML structure
✅ CSS Grid & Flexbox for layouts
✅ SVG for scalable graphics
✅ Gradient text for emphasis
✅ Backdrop blur for depth
✅ Smooth transitions throughout
✅ Keyboard accessibility
✅ Touch-friendly targets
✅ Performance optimized
✅ No unnecessary elements
✅ Coherent visual language

---

## Summary

Serenity combines:
- **Beautiful Visual Design**: AI-generated anime backgrounds
- **Elegant Components**: Glassmorphism with gradients
- **Smooth Interactions**: Purposeful animations
- **Complete Accessibility**: Keyboard & screen reader support
- **Responsive Layout**: Works on all devices
- **Dark Mode**: Consistently beautiful dark aesthetic

The result is a focus timer that feels like a premium, professional application designed specifically for peaceful, productive studying.
