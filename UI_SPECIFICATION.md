# UI & Design System Specification
## Corporate Enterprise Ledger & CRM Platform

This document specifies the UI/UX architecture, design tokens, color system, typographic guidelines, and specific interface components implemented in the Enterprise CRM Dashboard application. Use this document as a strict design template and visual guide when creating or extending views to ensure high visual alignment, pristine spacing, and aesthetic cohesion.

---

## 1. Visual Mood & Aesthetic Strategy

The dashboard utilizes a **Swiss Modern / Corporate Enterprise Ledger** aesthetic. It blends a robust, dark-neutral administrative workspace side-car with a super-clean, high-density, high-contrast workspace area.

*   **Personality**: Structured, secure, architectural, high-precision, data-dense.
*   **Contrasts**: Deep charcoal navigation sidebars contrast directly against clean, bright paper-white content sheets and soft slate backgrounds.
*   **Anti-AI-Slop Principle**: Zero placeholder features, zero meaningless telemetry logs (e.g., no raw port numbers, uptime counters, or fake console rows), and no useless decorative widgets. Every coordinate or stat in the workspace is structurally grounded in data.

---

## 2. Color Palette & Semantic Tokens

### Core Colors
*   **Base Canvas**: `bg-slate-50` (soft off-white) with `text-slate-900` body.
*   **Primary Accent**: `bg-indigo-600` / `hover:bg-indigo-700` (`text-white`) --- used for structural submissions and main actions.
*   **Carbon / Dark Accents**: `bg-slate-950` / `bg-slate-900` --- used for persistent drawers, global secondary headers, and select labels.
*   **Borders**: Soft dividers in `border-slate-200` (components/inputs) and deeper `border-slate-800` (dark navigation components).

### State-Specific Colors (Kanban & Badges)
| Status | Accent Color Class | Background | Border Accent | Border Text / Indicator |
| :--- | :--- | :--- | :--- | :--- |
| **IN PROGRESS** | Emerald | `bg-emerald-50` | `border-emerald-200` | `text-emerald-800` / `bg-emerald-500` |
| **SCHEDULED** | Blue | `bg-blue-50/50` | `border-blue-200` | `text-blue-700` / `bg-blue-600` |
| **COMPLETED** | Slate | `bg-slate-50` | `border-slate-200` | `text-slate-600` / `bg-slate-500` |
| **BLOCKED** | Rose / Amber | `bg-rose-50` | `border-rose-200` | `text-rose-600` / `bg-rose-500` |
| **IMPENDING (⏰ <24h)** | Amber | `bg-amber-50/70` | `border-amber-200` | `text-amber-850` / `bg-amber-500` |

---

## 3. Typography & Text Hierarchy

We use a clean sans-serif layout with strategic typewriter accents:

*   **Primary Typeface**: `Inter`, system-ui, sans-serif (fluid tracking, standard weights `w-300` to `w-700`).
*   **Technical Accents**: `font-mono` (upper-case extra-bold, small text sizes: `text-[10px]` or `text-[8px]`) for tags, subsystem indicators, metadata labels, status badges, and precise date coordinates.
*   **Tracking**: `tracking-tight` for heavy display titles, `tracking-wider` or `tracking-widest` for sub-labels and pill text.

### Visual Typography Scale (Sample Usage)
```tsx
// Page Title
<h2 className="text-xl font-bold text-slate-900 tracking-tight">Interactions Alignment Board</h2>

// Meta Pill Label
<span className="px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded text-[9px] uppercase font-bold tracking-wide">
  {tierName}
</span>
```

---

## 4. Main Layout Architecture

The application layout is divided into four structural areas designed with a desktop-first modular grid:

```
+---------------------------------------------------------------------------------+
|                                  TOP HEADER BANNER                              |
|                         [Search Bar]                 [Bell Notification Icon]   |
+---------------------------------------------------------------------------------+
|  SIDEBAR (w-64)  |  MAIN CONTAINER (padding: p-8, space-y-6)                    |
|  bg-slate-900    |                                                              |
|                  |  +--------------------------------------------------------+  |
|  * Dashboard     |  | ALERT BANNER (Impending deadlines watchdog)            |  |
|  * Interactions  |  +--------------------------------------------------------+  |
|  * Engagements   |                                                              |
|  * Contacts      |  +--------------------------------------------------------+  |
|  * Ledger Notes  |  | GRID / KPI METRICS (sm:grid-cols-2 lg:grid-cols-6)     |  |
|  * Audit Logs    |  +--------------------------------------------------------+  |
|                  |                                                              |
|                  |  +--------------------------------------------------------+  |
|                  |  | CONTENT SECTION (Kanban Board / Audit Table)           |  |
|                  |  +--------------------------------------------------------+  |
+---------------------------------------------------------------------------------+
| (FLOT) BATCH TOOLBAR: bg-slate-950/95 shadow-xl select counters (Bottom bar)   |
+---------------------------------------------------------------------------------+
```

### 1. Left Sidebar (`aside`)
*   **Dimensions**: `w-64 shrink-0 bg-slate-900 border-r border-slate-800`
*   **Interactive Tabs**: Navigated buttons styled in clean neutral slate. Selected state: `bg-slate-800 text-white`, otherwise `text-slate-400 hover:text-white hover:bg-slate-800/50` transition-all.
*   **Branding**: Small icon square (`w-8 h-8 rounded bg-blue-600` containing text logo "E") positioned next to bold title.

### 2. Main Scroll Area (`main`)
*   **Background**: `bg-slate-50` with page padding of `p-8 space-y-6`.
*   **Transitions**: Animated entry transitions for clean views (`animate-in fade-in duration-300`).

### 3. Slidout Configuration Drawer
*   **Structure**: Triggers when a workspace item is selected. It features a backdrop blurring layer (`bg-slate-900/40 backdrop-blur-[2px]`) with a lateral slide-in column (`w-[420px] bg-white border-l border-slate-200 z-[90]`).
*   **Interactive Components**: Direct tabs, nested lists (linked docs, contacts), collapsible headers with a nice `bg-slate-50/50` back fill.

---

## 5. UI Elements & Core Component Styling

### 1. Unified Audit logs & Export to CSV
*   **Auditing Filter Header**: Select dropdowns styled with minimal gray fills and rounded utility borders.
*   **CSV Exporter Action**: Trigger button with custom Lucide icon:
    ```tsx
    <button
      type="button"
      onClick={handleExportAuditLogsToCSV}
      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm md:ml-auto"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Export to CSV</span>
    </button>
    ```

### 2. Impending Touches Alert Watchdog (Watchdog Banner)
*   **Stripe Styling**: Warm Warning style sheet to catch analyst attention.
    ```tsx
    <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-sm text-xs leading-relaxed animate-in slide-in-from-top-4 duration-300">
      <span className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 ...">⏰</span>
        </span>
      </span>
      {/* Action lists and titles ... */}
    </div>
    ```

### 3. Floating Batch Action Bar
*   **Aesthetic**: Dark Glassmorphic bottom pane.
    ```tsx
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-md border border-slate-800 ... rounded-2xl shadow-2xl p-4 pr-5 flex items-center justify-between gap-6 z-50">
      {/* Direct multi-record update utilities and Delete button */}
    </div>
    ```

### 4. Custom System Scrollbars
Standardized minimal scrollbars prevent default browser styles from cluttering clean interfaces. Configure them globally in `index.css`:
```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  @apply bg-slate-300 rounded-full hover:bg-slate-400 transition-colors;
}
```

---

## 6. Guidelines for UI Developers & Agents

1.  **Strict Icon Rule**: Import ONLY from `lucide-react`. Never craft raw inline SVGs for UI components, as they break design cohesion.
2.  **No In-Page alert/Window overrides**: Avoid standard browser alerts; use the pre-built `showToast` or clean modal layouts instead.
3.  **Use Micro-Animations**: Standard entry animations make high-density layouts feel exceptionally responsive:
    *   Fades/Opacities: `animate-in fade-in duration-300`
    *   Bouncy alerts/Indicators: `animate-pulse`, `animate-bounce`
4.  **Desktop-First Grid Packing**: Ensure standard spacing is varied correctly. Utilize standard spacing groups (`gap-6`, `space-y-4`, `p-5`) so dashboards do not look uniform or robotic.
