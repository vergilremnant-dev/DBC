# Design System & Sizing Rules

DBC utilizes a tailwind-compatible, unified design system defined in `src/index.css`.

## 1. Unified Sizing System for Buttons (`.dbc-btn`)

Every standard button must use the `.dbc-btn` system. Width and padding parameters are strictly controlled to prevent inconsistent rendering.

| Modifier Class | Height | Font Size | Horizontal Padding | Primary Use Cases |
| :--- | :--- | :--- | :--- | :--- |
| `dbc-btn-sm` | `1.875rem` (30px) | `10px` | `0.875rem` (14px) | Table actions, page filters, cancel buttons. |
| `dbc-btn-md` | `2.25rem` (36px) | `11px` | `1.25rem` (20px) | Default standard button. |
| `dbc-btn-lg` | `2.5rem` (40px) | `12px` | `1.5rem` (24px) | Form submissions, modals. |
| `dbc-btn-xl` | `2.75rem` (44px) | `12px` | `1.75rem` (28px) | Hero main landing pages. |

## 2. Layout Aesthetics
*   **Colors:** Brand Emerald (`#047857`), Warm Cream/Soft Stone (`#F5F5F4`), Graphite Black (`#1A1A1A`), Brick Red (`#A63D2F`).
*   **Corner Radii:** Medium (`8px`), Large (`16px`), XLarge (`32px`).
