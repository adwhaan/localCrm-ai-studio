# User Interface Spec, Aesthetic Look & Feel Guide
## Swiss Modern Enterprise Ledger Theme

This document serves as a layout and styling blueprint for the application's user interface. It outlines design system parameters, responsive dimensions, and modular visual components to ensure other agents can recreate the unified dashboard as it currently is.

---

## 🎨 1. Theme Presets & Color Systems
The application supports 4 distinct workspace theme presets. Visual tokens are resolved dynamically using the `getThemeClasses(themeKey)` utility:

### Theme Classes Configuration Table
| Token Class | Swiss Slate (`slate` - Default) | Charcoal Corporate (`charcoal`) | Midnight Anthracite (`pitch-dark`) | Vintage Sepia Ledger (`amber-sepia`) |
| :--- | :--- | :--- | :--- | :--- |
| **bg** | `bg-slate-50 text-slate-800` | `bg-zinc-100 text-zinc-900` | `bg-slate-950 text-slate-100` | `bg-amber-50/40 text-slate-900` |
| **card** | `bg-white border-slate-200 text-slate-800 shadow-sm` | `bg-zinc-50 border-zinc-200 text-zinc-900 shadow-sm` | `bg-slate-900 border-slate-800 text-slate-100 shadow-md` | `bg-[#fcfaf2] border-amber-200/90 text-slate-900 shadow-sm` |
| **cardHover** | `hover:border-slate-350` | `hover:border-zinc-350` | `hover:border-slate-700` | `hover:border-amber-300` |
| **textMuted**| `text-slate-400 font-mono` | `text-zinc-500 font-mono` | `text-slate-400 font-mono` | `text-amber-800/80 font-mono` |
| **textTitle**| `text-slate-900 font-semibold` | `text-zinc-950 font-bold` | `text-white font-semibold` | `text-amber-950 font-bold` |
| **border** | `border-slate-200` | `border-zinc-200` | `border-slate-800` | `border-amber-200` |
| **header** | `bg-white border-slate-200 text-slate-800` | `bg-white border-zinc-200 text-zinc-900` | `bg-slate-900 border-slate-800 text-white` | `bg-white border-amber-200/80 text-amber-900` |
| **input** | `bg-slate-100 border-transparent text-slate-800 focus:bg-white focus:border-blue-500 placeholder-slate-400` | `bg-zinc-100/60 border-zinc-200 text-zinc-900 focus:border-zinc-500 placeholder-zinc-400` | `bg-slate-950 border-slate-800 text-white focus:border-indigo-500 placeholder-slate-600` | `bg-[#fbf9f3] border-amber-200 text-slate-900 focus:border-amber-600 placeholder-amber-700/40` |
| **buttonSec**| `bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-705 cursor-pointer` | `bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border-zinc-303 cursor-pointer` | `bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-705 cursor-pointer` | `bg-amber-100/50 hover:bg-amber-100 text-amber-900 border-amber-200 cursor-pointer` |
| **badge** | `bg-slate-100 border-slate-200 text-slate-700` | `bg-zinc-100 border-zinc-200 text-zinc-707` | `bg-slate-850 border-slate-700 text-slate-300` | `bg-amber-50 border-amber-150 text-amber-800` |
| **mutedBg** | `bg-slate-50 border border-slate-200` | `bg-zinc-105/40 border border-zinc-200/60` | `bg-slate-950/80 border border-slate-800` | `bg-amber-50/50 border border-amber-200/50` |

---

## 📐 2. Display Spacing Density System
The layout padding and font sizing scales are driven by the operator's active choice within the settings panel (`compact` | `cozy` | `spacious`):

```typescript
function getDensityPadding(density: string, type: "card" | "input" | "table-cell" | "list-spacing") {
  if (type === "card") {
    return density === "compact" ? "p-3.5" : density === "spacious" ? "p-7" : "p-5";
  }
  if (type === "input") {
    return density === "compact" ? "py-1.5 px-2.5 text-[11px]" : density === "spacious" ? "py-3 pb-3 px-4 text-sm" : "py-2.5 px-3 text-xs";
  }
  if (type === "table-cell") {
    return density === "compact" ? "py-1.5 px-2.5 text-[10px]" : density === "spacious" ? "py-4 px-5 text-sm" : "py-2.5 px-3 text-xs";
  }
  return density === "compact" ? "space-y-2" : density === "spacious" ? "space-y-5" : "space-y-4";
}
```

This dynamic padding maps to all tables, sidecards, list cards, grids, and input fields on the screen automatically.

---

## 🏛️ 3. Layout Grid & Structure

The screen partitions are constructed as a viewport-locked grid:

### 3.1 Sidebar Aside (`w-64 shrink-0 bg-slate-900 border-r border-slate-800 text-slate-300`)
*   **Branding Box**: Top header inside aside with a crisp indigo icon (`w-8 h-8 rounded bg-blue-600 font-mono font-bold text-white flex items-center justify-center text-sm`) stating "E" next to a bold title `Enterprise CRM`.
*   **Navigation Nodes**: Linear stack of items styled with clear icons. Interactive nodes:
    *   *Dashboard Console*
    *   *Touchpoint Ledger*
    *   *Active Engagements*
    *   *Contact Directory*
    *   *Corporate Entities*
    *   *Ledger Notes Archive*
    *   *Internal Documents*
    *   *Operator Profiles*
    *   *System Audit Ledger* (Senior Analysts Only)
    *   *Admin Visibility Override* (Senior Analysts Only)
    *   *Settings Console*
*   **Selected Indicator**: Nav buttons with class `bg-slate-800 text-white`, and unselected with `text-slate-400 hover:text-white hover:bg-slate-800/50`.
*   **Seating Details (Sidebar Foot)**: Renders the active authenticated email, profile name, role pill, and a clear "Disconnect" button.

### 3.2 Top Header Navbar (`h-16 py-3 px-8 flex justify-between items-center bg-white border-b border-slate-200`)
*   **Tactical Search Indicator**: Left-hand input with subtle hover shortcuts.
*   **Operator Status Display**: Shows active seat status indicator and current date coordinates.
*   **Notifications Trigger Area**: Lucide `Bell` icon displaying a red dot highlighting unread alerts. Hovering and clicking slides out the alerting panel.

### 3.3 Slideout Details Drawer (`w-[420px] bg-white border-l border-slate-200 shadow-2xl z-[90]`)
*   Slides in from the right edge with a dark semi-transparent backdrop blur (`bg-slate-900/40 backdrop-blur-[2px]`).
*   Contains structured inner panels for the selected element, collapsible timeline logs, document attachments, and contact mappings.

### 3.4 Floating Batch Action Toolbar
Renders near the bottom center when multi-record row indicators are selected:
*   **Style**: Dark charcoal capsule (`bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 pr-5 text-white`)
*   **Controls**: Displays the selected row tally beside inline operations (e.g., Bulk Delete, Cascade Update).

---

## 📈 4. Major Views & Component Rendering

### 4.1 Dashboard Hub
*   Renders 6 structured metric cards under a horizontal layout with uppercase monospace labels.
*   Shows interactive progress tracks, trend lines, and a beautiful comparative bar representation plotting pipeline status ratios.

### 4.2 Interactions Kanban Card
Renders critical Touchpoint pipelines inside 4 distinct lanes (`IN PROGRESS`, `SCHEDULED`, `COMPLETED`, `BLOCKED`).
*   Header displaying status text in monospace upper-case alongside a numeric count badge.
*   Cards styled with custom left borders representing status colors:
    *   `IN PROGRESS` - Left border `emerald-500`
    *   `SCHEDULED` - Left border `blue-500`
    *   `COMPLETED` - Left border `slate-400`
    *   `BLOCKED` - Left border `rose-500`
*   Impending Touchpoints scheduled within <24 hour alert boundaries are flagged in the list with a neon flashing alert indicator (`animate-pulse bg-amber-500`).

### 4.3 Form Modals
*   Centered card popups constructed with a dark header block. Uses custom clean dialog cards with sharp input outlines and bold action labels.
*   Avoids raw browser dialog functions completely using a safe custom state-based React Modal layout.

### 4.4 Interdependency Gantt Style Specifications
*   **Grid Sizing Bounds**: Core rows are `44px` high, and timeline columns are `36px` wide.
*   **Left Sticky Subject Grid**: `280px` wide. Handled via CSS `position: sticky; left: 0; z-index: 40;` with an elegant scroll barrier border.
*   **Unscheduled / Waiting Indicators**: Items without a scheduled date are styled with a left border tag (`border-l-3 border-dashed border-slate-300`) and a custom `WAITING` status badge: small `7px` bold mono letters inside a dashed gray capsule background.
*   **Dependency Arc Vector Coordinates**: Drawn on an absolute SVG track using inline coordinates. Highlight states on row hover flip the connection line `stroke` to `#6366f1` and increase width to `2.5px`, adding instant dynamic analytics feel.

### 4.5 Settings & Preferences Console View
Features a detailed 2x2 modular matrix containing:
1.  **Operator Profile Coordinates**: Displays static email keys and mutable custom Display Names synchronized under a single click save command.
2.  **Passphrase Credentials Ajuster**: Form fields styled in monospace password masking allowing analysts to securely update seat passwords.
3.  **Notification Preferences Checklist**: Functional routing controls (Email alerts, watchdog alarms, weekly strategic digest) with clean standard checkboxes.
4.  **Display Layout & Visual Theme Selectors**: Cards mapping physical preview thumbnails of the 4 design systems alongside direct triggers for page spacing scales.

### 4.6 Engagement Analytics ("Analytical Metrics") View
An operational chart layout that embeds inside active project dashboards:
*   **Theme Integrations**: Area gradients resolve dynamically based on the active corporate theme. Gradients default to charcoal slate (`fill="url(#colorTotal)"` under stroke `#64748b`) coupled with brand workspace Indigo (`fill="url(#colorCompleted)"` under stroke `#6366f1`).
*   **Typography Specs**: Cartesian axis values, tooltip legends, and label descriptions render inside explicit, highly legible monospace parameters (`text-[10px]` or `font-semibold text-xs text-slate-705`) matching Swiss corporate reporting designs.
*   **Hover States**: Hovering tooltips utilize precise border colors (`border-slate-200`) and paper-white backgrounds with soft drop-shadow attributes, guaranteeing excellent legibility.

