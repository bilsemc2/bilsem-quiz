---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## Platform Design System — Tactile Cyber-Pop

All new pages and components **must** follow this established design system. Do NOT invent new color tokens, fonts, or shadow patterns.

### Typography

- **Primary font**: `font-nunito` — used everywhere (headings, labels, body)
- **Weight**: `font-extrabold` for headings, labels, badges, and buttons
- **Style**: `uppercase tracking-widest` for labels, badges, and small tags
- **Heading sizes**: `text-4xl sm:text-5xl md:text-6xl` for hero headings, `text-xl` for section titles
- **Body text**: `font-nunito font-bold` in `text-sm` or `text-lg`
- NEVER use: `font-syne`, `font-chivo`, `font-inter`, `font-poppins`, `font-outfit`, or any other font family

### Colors — `cyber-*` Palette

All accent colors come from the `cyber-*` palette defined in `tailwind.config.js`:

| Token | Hex | Usage |
|-------|-----|-------|
| `cyber-blue` | `#1e40af` | Primary actions, links, active states |
| `cyber-pink` | `#f43f5e` | Destructive, warnings, recording states |
| `cyber-emerald` | `#14F195` | Success, completion, progress |
| `cyber-gold` | `#FFD700` | Rewards, premium, highlights |
| `cyber-yellow` | `#dcf126` | Highlight, selection, accent |
| `cyber-purple` | `#B026FF` | Secondary accent, creative |
| `cyber-orange` | `#FF9500` | Creativity, warmth |
| `cyber-cyan` | `#06b6d4` | Info, cool accent |
| `cyber-red` | `#FF2745` | Error, danger |

**Usage pattern for accent tinting:**
```
bg-cyber-blue/10 border-2 border-cyber-blue/20 text-cyber-blue
```

- NEVER use: `neon-*`, `konser-*`, or ad-hoc hex colors for UI accents

### Dark / Light Mode

Every element must support both modes using Tailwind's `dark:` prefix:

| Element | Light | Dark |
|---------|-------|------|
| Page background | `bg-gray-50` | `dark:bg-slate-900` |
| Card background | `bg-white` | `dark:bg-slate-800` |
| Primary text | `text-black` | `dark:text-white` |
| Secondary text | `text-slate-600` | `dark:text-slate-400` |
| Muted text | `text-slate-500` | `dark:text-slate-400` |
| Dividers | `border-black/10` | `dark:border-white/10` |

**Add `transition-colors duration-300`** to page containers for smooth mode transitions.

### Borders & Shadows

- **Card borders**: `border-3 border-black/10` (thick tactile borders)
- **Smaller elements**: `border-2 border-black/10` or `border border-black/10`
- **Card shadow**: `shadow-neo-sm` (default), `shadow-neo-md` (elevated), `shadow-neo-lg` (hero)
- **Hover lift**: `hover:-translate-y-1 hover:shadow-neo-md transition-all`
- **Card radius**: `rounded-2xl` or `rounded-xl`

Available shadow tokens: `shadow-neo-xs`, `shadow-neo-sm`, `shadow-neo-md`, `shadow-neo-lg`, `shadow-neo-xl`

- NEVER use: `shadow-glow-*`, hard solid shadows (`shadow-[4px_4px_0_#000]`), or `border-4 border-black`

### Card Pattern

Standard card structure used across all pages:

```tsx
<div className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-6 md:p-8 shadow-neo-sm">
  {/* Content */}
</div>
```

**Hero card with accent bar:**

```tsx
<div className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 md:p-12 shadow-neo-md relative overflow-hidden">
  <div className="absolute top-0 left-0 w-full h-4 bg-cyber-blue border-b-2 border-black/10" />
  {/* Content with mt-4 */}
</div>
```

### Badges / Labels

```tsx
<div className="inline-block px-4 py-2 border border-black/10 rounded-lg font-nunito font-extrabold uppercase tracking-widest bg-white dark:bg-slate-700 text-black dark:text-white text-xs">
  Label Text
</div>
```

### Buttons

**Primary (CTA):**
```tsx
<button className="inline-flex items-center gap-2 px-8 py-3 bg-cyber-blue text-black border-2 border-black/10 font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
  Action
</button>
```

**Secondary:**
```tsx
<button className="px-6 py-3 bg-gray-100 dark:bg-slate-700 border-2 border-black/10 text-slate-600 dark:text-slate-300 font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl hover:-translate-y-0.5 transition-all">
  Secondary
</button>
```

### Headings

```tsx
<h1 className="text-4xl sm:text-5xl md:text-6xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight leading-none">
  Main Title <span className="text-cyber-blue">Accent</span>
</h1>
```

### Icon Containers

```tsx
<div className="w-12 h-12 bg-cyber-blue/10 border-2 border-cyber-blue/20 rounded-xl flex items-center justify-center text-cyber-blue">
  <Icon className="w-6 h-6" strokeWidth={2.5} />
</div>
```

### Animations

Use **Framer Motion** for entrance animations and micro-interactions:

```tsx
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
```

Tailwind animations available: `animate-pulse`, `animate-spin-slow`, `animate-bounce-slow`, `animate-float`, `animate-wiggle`, `animate-pop`, `animate-shake`

### Background

Page backgrounds use a subtle dot pattern:

```tsx
<div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
```

---

## Kid-UI Component Library

For child-facing game interfaces (Arcade games, kid-oriented features), use the **kid-ui** library at `src/components/kid-ui/`. These components follow the Tactile Toy-Box variant of the design system with thick borders, neo-brutalism shadows, and 3D button press effects.

### Available Components

Import from `@/components/kid-ui` or `@/components/kid-ui/index.ts`:

| Component | Import | Description |
|-----------|--------|-------------|
| `KidButton` | `@/components/kid-ui` | 3D press-effect button with `variant` and `icon` props |
| `KidCard` | `@/components/kid-ui` | Thick-bordered card with `tone` color theming |
| `KidBadge` | `@/components/kid-ui` | Colorful label badge with `variant` and optional `pulse` |
| `KidProgress` | `@/components/kid-ui` | Animated progress bar |
| `KidAvatar` | `@/components/kid-ui` | Child avatar display |
| `KidIconButton` | `@/components/kid-ui` | Icon-only tactile button |
| `KidGameShell` | `@/components/kid-ui/KidGameShell` | Full game wrapper with HUD, stats, actions, badges |
| `KidGameFeedbackBanner` | `@/components/kid-ui/KidGameFeedbackBanner` | `fixed bottom-6` feedback banner (success/error/warning) |
| `KidGameStatusOverlay` | `@/components/kid-ui/KidGameStatusOverlay` | Full-screen status overlay (game over, victory, etc.) |

### Usage Example

```tsx
import { KidButton, KidCard, KidBadge } from '@/components/kid-ui';
import KidGameShell from '@/components/kid-ui/KidGameShell';
import KidGameFeedbackBanner from '@/components/kid-ui/KidGameFeedbackBanner';
import KidGameStatusOverlay from '@/components/kid-ui/KidGameStatusOverlay';

// KidGameShell wraps entire game with HUD and structure
<KidGameShell
    tone="yellow"          // yellow | blue | emerald | pink | orange | purple
    title="Game Title"
    icon={GameIcon}
    badges={[{ label: 'TUZO 5.4.1', variant: 'info' }]}
    stats={[
        { label: 'Score', value: 120 },
        { label: 'Lives', value: 3, emphasis: 'danger' },
    ]}
    actions={[{ label: 'Start', onClick: handleStart }]}
>
    {/* Game content */}
</KidGameShell>

// Feedback banner — positioned fixed bottom-6, NOT absolute
<KidGameFeedbackBanner message="Correct!" type="success" />

// Status overlay — full screen for game over / victory
<KidGameStatusOverlay
    tone="emerald"
    icon={Trophy}
    title="Victory!"
    stats={[{ label: 'Score', value: 500 }]}
    actions={[{ label: 'Play Again', onClick: restart }]}
/>
```

### Tactile Toy-Box Style Notes

- Uses the same `cyber-*` palette but with more vibrant saturation
- Rounded pill-like shapes: `rounded-2xl`, `rounded-[3rem]`
- Thick borders maintained: `border-3 border-black/10`
- Typography remains `font-nunito font-extrabold uppercase tracking-widest`
- Plump, tangible UI elements that feel like physical buttons/blocks
- Neo-brutalism shadows: `shadow-neo-sm`, `shadow-neo-md` (not hard offset `shadow-[Xpx_Xpx_0_#000]`)
- 3D button press: `active:translate-y-1 active:shadow-none transition-all`
- `KidGameFeedbackBanner` uses `fixed bottom-6` positioning (not absolute)

---

## Arcade Game-Specific Components

For Arcade games specifically, these additional shared utilities are available:

| Component | Path | Description |
|-----------|------|-------------|
| `useArcadeSoundEffects` | `src/components/Arcade/Shared/useArcadeSoundEffects.ts` | Sound effects hook (playCorrect, playIncorrect, playLevelUp) |
| `arcadeSoundModel` | `src/components/Arcade/Shared/arcadeSoundModel.ts` | Pure sound model functions |
| `useGameViewportFocus` | `src/hooks/useGameViewportFocus.ts` | Auto-scroll to game area on mobile |
| `ArcadeConstants` | `src/components/Arcade/Shared/ArcadeConstants.ts` | Score formula, colors, feedback texts |

---

## Critical Rules

1. **Always support dark mode** — every color class needs a `dark:` variant
2. **Never invent new design tokens** — only use what's in `tailwind.config.js`
3. **Never use Syne, Chivo, Inter, or any other font** — `font-nunito` is the only font
4. **Never use solid black borders** (`border-black`) — always use `border-black/10`
5. **Never use glow shadows** in standard UI — only `shadow-neo-*`
6. **Component icons**: Use Lucide React with `strokeWidth={2.5}`
7. **Turkish text**: All UI strings must be in Turkish
8. **Responsive**: Always include responsive breakpoints (`sm:`, `md:`, `lg:`)
9. **Kid-UI for games**: Use `KidGameShell`, `KidGameFeedbackBanner`, `KidGameStatusOverlay` for all child-facing game UIs — NOT the deleted `ArcadeGameShell` or `ArcadeFeedbackBanner`
10. **Feedback banner position**: `KidGameFeedbackBanner` is `fixed bottom-6`, never `absolute`