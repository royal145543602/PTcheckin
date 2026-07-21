# PRIMETIME Check-in App — UI Redesign Spec

## Design Foundation

**Color tokens** (from PRIMETIME main site):
- `--bg`: `#0f1a12` — page background
- `--bg-card`: `#112211` — card/surface background
- `--green`: `#00e85c` — primary accent
- `--green-dim`: `rgba(0,232,92,0.1)` — subtle glow
- `--text`: `#fff` / `rgba(255,255,255,0.55)` — primary / secondary
- `--border`: `rgba(255,255,255,0.06)` — card/input borders

**Fonts**: Barlow Condensed (headings/numbers) + Inter (body) + Noto Sans TC (Chinese fallback)

**Animation stack**: ReactBits (pre-built animated components) + GSAP (custom scroll/page animations)

## Component Interactions

### Background
- Dark bg (#0f1a12) + dot-grid texture (CSS, matching main site)
- Corner gradient glows (radial-gradient, matching main site)
- Subtle green floating particles (ReactBits Particles or CSS-only)

### Member Cards
- TiltedCard: 3D parallax tilt on hover + green glow tracking
- Check-in: bounce scale → green fill → particle burst (GSAP timeline)
- Check-out: green fade → gray/sink (GSAP)
- Batch mode: cards shrink, checkbox bounce-in (GSAP spring)

### Stats Bar
- CountUp: animated number counting on value change
- Semi-transparent backdrop with green accent dividers

### Sidebar
- Glass morphism background (backdrop-filter blur)
- GSAP slide-in with spring physics
- AnimatedList for member roster with stagger

### Signature Modal
- Fullscreen slide-up from bottom (GSAP power3.out)
- Ink particles on pen stroke edges
- Green checkmark animation on confirm

### Tab Switching (Check-in ↔ History)
- GSAP slide transition between views

### History View
- AnimatedList: staggered reveal of daily records
- Expand/collapse day sections with GSAP

### Modals (generic)
- Scale 0.92→1 + blur→0 entrance (GSAP)
- Glass card styling

## Routes — All 4 Pages

| Route | Purpose | Key Interactions |
|-------|---------|-----------------|
| `/` | Main dashboard | Card grid, stats, check-in flow |
| `/admin` | Admin panel | Team management |
| `/kiosk/[teamId]` | Self-service kiosk | Simplified check-in + sidebar |
| `/view/[teamId]` | Parent/spectator view | Read-only status display |

## Tech Notes
- Keep existing Tailwind setup — just extend config with PRIMETIME tokens
- Add `gsap` npm package
- ReactBits components: copy source into `src/components/ui/` (not npm install)
- GSAP: use `useLayoutEffect` + `gsap.context()` pattern for React
