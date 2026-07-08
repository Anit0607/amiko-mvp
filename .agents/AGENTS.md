# Workspace Design Rules: Amiko Premium 3D Web Application

These guidelines define the visual language, animation style, and accessibility rules for the **Amiko** companion application. All future components, styles, and templates developed in this workspace MUST follow these directives.

---

## 1. Visual Aesthetics & Design System

The app must present a modern, tactile, and highly premium look using a combination of **glassmorphism**, **soft dynamic gradients**, and **3D interactive elements**.

### Color Tokens (Vibrant Coral / Sunny Palette)
Use HSL color tokens for smooth color blending, especially in dark and light modes:
```css
:root {
  --primary-coral: hsl(14, 95%, 60%);       /* Vibrant Coral */
  --primary-coral-soft: rgba(255, 87, 34, 0.1);
  --accent-sunny: hsl(38, 98%, 56%);        /* Sunny Yellow */
  --success-mint: hsl(150, 60%, 45%);       /* Mint Green */
  --danger-crimson: hsl(348, 85%, 55%);     /* SOS Crimson */
  --bg-gradient-hero: linear-gradient(135deg, hsl(14, 95%, 60%) 0%, hsl(38, 98%, 56%) 100%);
  --bg-gradient-buddy: linear-gradient(135deg, hsl(210, 100%, 60%) 0%, hsl(190, 100%, 45%) 100%);
}
```

### Premium Glassmorphism Specifications
Apply these variables to glassmorphic panels, cards, and bottom navigation:
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px) saturate(120%);
  -webkit-backdrop-filter: blur(16px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08);
}

.dark .glass-panel {
  background: rgba(18, 18, 18, 0.6);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}
```

### Typography (Google Fonts)
* **Headers:** `Outfit` (bold, geometric, friendly).
* **Body & Labels:** `Inter` or `Plus Jakarta Sans` (highly legible at small sizes).

---

## 2. 3D Perspective & Motion Rules

Every major interaction should feel alive. Micro-animations and 3D effects must feel smooth and fluid.

### 3D Perspective Containers
For components that rotate or tilt (e.g. device frames, service cards):
1. **Perspective Stage:** Define `perspective: 1200px` on parent containers to prevent excessive 3D distortion.
2. **Preserve Space:** Specify `transform-style: preserve-3d` on the rotating element so nested text and icons retain proper depth layers.
3. **Smooth Tilts:** Apply a custom Cubic-Bezier transition for exit/entrance tilts:
   ```css
   .card-3d {
     transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease;
   }
   ```

### Cursor Interaction Blueprint
Use JavaScript to capture mouse movements on the card and map them to custom properties:
```javascript
const handleMouseMove = (e, element) => {
  const rect = element.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const rotateX = ((y / rect.height) - 0.5) * -15; // Max 15 deg tilt
  const rotateY = ((x / rect.width) - 0.5) * 15;
  element.style.setProperty('--rx', `${rotateX}deg`);
  element.style.setProperty('--ry', `${rotateY}deg`);
};
```
Apply these inline or through standard styles:
```css
.card-3d:hover {
  transform: rotateX(var(--rx)) rotateY(var(--ry)) scale3d(1.02, 1.02, 1.02);
}
```

---

## 3. Interaction & Animation Directives

1. **SOS Holding Pulse:**
   * The SOS button must utilize a keyframe pulse animation.
   * While holding, increase the ripple size and change colors from soft crimson to glowing gold.
   ```css
   @keyframes sos-hold-glow {
     0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
     70% { box-shadow: 0 0 0 20px rgba(220, 38, 38, 0); }
     100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
   }
   ```
2. **Liquid Voice Visualizer:**
   * Implement a sine-wave canvas visualizer for the voice request page that reacts smoothly to speech stages (idle -> recording -> parsing).
3. **Staggered Delays:**
   * Card grids (like services or settings) must render sequentially using CSS grid items with staggered `animation-delay` offsets (e.g. `100ms`, `200ms`, `300ms`).

---

## 4. Accessibility Constraints (Mandatory)

Because this app serves elderly care receivers:
* **Click Targets:** All interactive items, inputs, and buttons must be at least **56px $\times$ 56px** (large tap targets).
* **Text Contrast:** Ensure color combinations pass Web Content Accessibility Guidelines (WCAG) AAA contrast ratios (minimum 4.5:1). Do not use light grey text on translucent white glass panels.
* **Haptic & Sound Indicators:** Simulating accessibility modes like Voice Guidance or Haptic feedback must trigger subtle audio prompts or interface alerts in the mockup.
