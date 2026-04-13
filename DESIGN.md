# The Digital Atelier: A Design System for the Scholarly Mind

## 1. Overview & Creative North Star
**The Creative North Star: "The Modern Archivist"**
This design system rejects the "gamified" clutter of traditional language apps in favor of a sophisticated, editorial experience. It is inspired by the quiet focus of a high-end library and the tactile precision of a literary journal. 

We break the "template" look through **Intentional Asymmetry** and **Tonal Depth**. By prioritizing white space as a functional element rather than "empty" space, we create a rhythmic flow that guides the learner’s eye through complex linguistic data. The experience should feel like a series of curated plates in a rare book—authoritative, breathable, and timeless.

---

## 2. Colors & Surface Logic
The palette is rooted in "Warm White" foundations (`background: #faf9f8`) to reduce eye strain during long study sessions, accented by the intellectual weight of "Slate Blue" (`primary: #303e51`) and the organic growth of "Soft Mint" (`secondary: #296956`).

### The "No-Line" Rule
To achieve a premium editorial feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined solely through background color shifts or intentional white space. 
*   Use `surface_container_low` (#f4f3f2) for page sections against the `background`.
*   Use `surface_container_highest` (#e3e2e1) to denote interactive or "active" zones.

### Surface Hierarchy & Nesting
Think of the UI as layers of fine paper. 
*   **Level 0:** `background` (#faf9f8) – The base canvas.
*   **Level 1:** `surface_container_low` (#f4f3f2) – Large structural regions (e.g., a sidebar or lesson track).
*   **Level 2:** `surface_container_lowest` (#ffffff) – High-priority cards or focused study modules. This "brighter than white" effect creates a natural, soft lift.

### The "Glass & Gradient" Rule
For "Floating" interactive elements (like a translation tooltip or a quick-nav menu), use **Glassmorphism**:
*   Apply `surface_container_lowest` at 80% opacity with a `20px` backdrop-blur. 
*   **Signature Textures:** For primary CTAs, use a subtle linear gradient from `primary` (#303e51) to `primary_container` (#475569) at a 135° angle. This adds a "lithographic" depth that flat hex codes lack.

---

## 3. Typography
The system utilizes a dual-font strategy to balance "The Scholarly" (Serif) and "The Functional" (Sans-Serif).

*   **The Soul (Newsreader):** Used for all `display`, `headline`, `title`, and `body` scales. The Newsreader serif provides the academic gravity needed for language immersion. 
    *   *Design Tip:* Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for lesson titles to create a high-end magazine feel.
*   **The Tool (Manrope):** Used for `label` and UI utility scales. Manrope’s geometric clarity ensures that functional elements (timers, word counts, button labels) remain distinct from the educational content.

---

## 4. Elevation & Depth: Tonal Layering
We move away from the "shadow-heavy" look of early Material Design. Elevation is communicated through **Tonal Layering**.

*   **Ambient Shadows:** If a card requires a floating state (e.g., a dragged vocabulary tile), use a shadow color tinted with the `primary` hue: `rgba(48, 62, 81, 0.06)` with a 32px blur and 8px offset.
*   **The "Ghost Border":** For essential accessibility in input fields, use the `outline_variant` (#c4c6cd) at 20% opacity. It should be felt, not seen.
*   **Interactive Parallax:** When nesting a `surface_container_lowest` card inside a `surface_container_low` section, use a `0.75rem` (xl) corner radius to soften the scholarly rigor with modern approachability.

---

## 5. Components

### Buttons
*   **Primary:** Slate Blue (`primary`) to `primary_container` gradient. High-contrast `on_primary` (#ffffff) text. Shape: `md` (0.375rem).
*   **Secondary (Progress):** Mint (`secondary`) background for "Success" or "Correct Answer" actions.
*   **Tertiary:** No background. `label-md` (Manrope) text in `primary` with a subtle `surface_variant` hover state.

### Input Fields (The "Minimalist Scholar")
*   **State:** No surrounding box. A bottom-only `outline_variant` at 40% opacity. 
*   **Focus:** The bottom line transitions to `primary` (#303e51) with a 2px thickness. Use `body-lg` (Newsreader) for user-entered text to emphasize the "written" word.

### Selection Chips
*   **Unselected:** `surface_container_high` (#e9e8e7) with `on_surface_variant` text.
*   **Selected:** `primary` (#303e51) with `on_primary` (#ffffff).
*   **Shape:** `full` (9999px) for a "pebble" aesthetic that contrasts against the rectangular layout.

### Cards & Vocabulary Lists
*   **Rule:** **Zero Dividers.** 
*   Separate list items using `0.5rem` (lg) of vertical whitespace and a alternating background shift to `surface_container_low` every second item.
*   For Flashcards, use `surface_container_lowest` (#ffffff) with a `xl` (0.75rem) radius and an `ambient shadow` to signify "Focus Mode."

### Progress Indicators
*   Use `secondary` (#296956) for progress bars. 
*   **Director’s Note:** Do not use rounded caps on progress bars; use a flat "butt" cap for a more architectural, precise look.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. For example, a wider left margin for "Display" text to create a modern editorial layout.
*   **Do** use `secondary_fixed` (#aff0d8) for celebratory moments (e.g., "Lesson Complete") to provide a "breath of fresh air" against the slate neutrals.
*   **Do** leverage the high contrast between `on_surface` (#1a1c1c) and `background` (#faf9f8) for maximum readability.

### Don’t:
*   **Don’t** use pure black (#000000). Always use `on_background` (#1a1c1c) to maintain the soft, scholarly warmth.
*   **Don’t** use heavy dropshadows. If it looks like it’s "hovering" more than 2mm off the page, it’s too much.
*   **Don’t** use iconography as a decoration. Every icon must be a `minimalist` functional glyph in `primary` or `secondary`. No multi-colored illustrations.