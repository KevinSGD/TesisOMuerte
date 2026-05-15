---
name: Academic Core
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb3af'
  on-tertiary: '#650911'
  tertiary-container: '#fc7c78'
  on-tertiary-container: '#711419'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#842225'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style
The design system is engineered for high-performance academic management, prioritizing efficiency and technical precision. It utilizes a **Corporate / Modern** style with **Minimalist** leanings, optimized for a high-density "Dark Mode" environment. 

The aesthetic communicates order and reliability through a structured grid and a rigorous visual hierarchy. It avoids unnecessary decoration, focusing instead on data clarity and functional density. The emotional response is one of calm control—transforming complex logistical data (class schedules, room availability, and algorithmic processing) into a clear, actionable dashboard.

## Colors
The palette is built on a foundation of deep, layered dark tones to reduce eye strain during prolonged use. 

- **Primary:** Emerald Green (#10B981) for primary actions, success states, and active confirmations.
- **Secondary:** Cyan (#06B6D4) for informational accents, secondary triggers, and data visualization highlights.
- **Neutrals:** A range of Slate and Navy grays. The base background is nearly black, while containers and surfaces use progressively lighter shades of Navy to create depth.
- **Accent:** High-contrast vibrance is reserved strictly for interactive elements and critical status indicators to maintain a professional, focused atmosphere.

## Typography
The system uses **Inter** for all primary interface text, chosen for its exceptional legibility in dark environments and varied weights. A secondary font, **JetBrains Mono**, is introduced for labels, status tags, and algorithmic data to reinforce the "technical/systemic" personality.

Headlines should use a tighter letter spacing for a more "locked-in" editorial feel. High-contrast weights (Bold vs. Regular) are used to create hierarchy without needing large jumps in font size, allowing for high information density.

## Layout & Spacing
The system utilizes a **Fluid Grid** model based on a 12-column system. 

- **Density:** High. Margins and gutters are kept tight (16px/24px) to maximize the "at-a-glance" visibility of complex tables and calendars.
- **Rhythm:** A 4px baseline unit governs all padding and margins to ensure technical alignment.
- **Breakpoints:**
  - **Mobile (<768px):** Single column, 16px margins. Cards stack vertically.
  - **Tablet (768px - 1024px):** 6-column internal grid. Sidebars collapse to icons.
  - **Desktop (>1024px):** 12-column grid. Max-width containers prevent line lengths from becoming unreadable on ultra-wide monitors.

## Elevation & Depth
Depth is created through **Tonal Layering** rather than traditional shadows. This maintains a "flat-modern" look that is easier on the eyes in dark mode.

- **Level 0 (Base):** #020617 (The canvas).
- **Level 1 (Cards/Sidebar):** #0F172A (Subtle lift).
- **Level 2 (Popovers/Modals):** #1E293B (Active elevation).
- **Outlines:** Instead of shadows, use 1px borders (#1E293B) for container separation. For active or hovered states, transition the border to the Primary color or a lighter gray (#334155).

## Shapes
The system uses a **Soft (Level 1)** roundedness. 

- **Standard Elements (Buttons, Inputs):** 4px (0.25rem) radius for a precise, professional feel.
- **Container Elements (Cards, Table Headers):** 8px (0.5rem) radius to provide a slight visual softening of the dense data.
- **Status Chips:** Full "pill" rounding is reserved only for status indicators (Active, Inactive, Pending) to make them instantly distinguishable from interactive buttons.

## Components
- **Buttons:** 
  - *Primary:* Solid #10B981 with white or dark-slate text. 
  - *Secondary:* Ghost style with 1px border.
- **Data Tables:** Zebra-striping is avoided; use 1px horizontal dividers. Header cells use `label-md` typography with a slightly darker background.
- **Info Cards:** Use a subtle top-border (2px) of the primary color to indicate "active" or "highlighted" categories.
- **Calendars:** Use a "grid-of-blocks" approach. Empty slots are indicated by a dashed border; filled slots use semi-transparent background tints of their respective category colors.
- **Algorithm Loading:** Use a linear progress bar with a pulse effect rather than a spinner. Include a small mono-spaced label for "Current Operation" to provide technical feedback.
- **Inputs:** Dark background (#020617) with a subtle 1px border. Focus state should use a Cyan (#06B6D4) glow (2px spread, low opacity).