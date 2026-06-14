# Workspace Guidelines: Aesthetic & UI Implementation Standards

This repository adheres to strict user-facing visual design and coding conventions. Any AI Agent modifies this codebase MUST comply with the rules outlined below.

---

## 🚀 1. Visual Theme & Style Principles

Maintain the **Swiss Modern / Corporate Enterprise Ledger** aesthetic:
*   **Colors**: 
    *   **Main Canvas**: Soft slate (`bg-slate-50`) with charcoal body text (`text-slate-900`).
    *   **Accent Controls**: Indigo-600 (`bg-indigo-600 hover:bg-indigo-700 text-white`) or precise crisp carbon blocks (`bg-slate-950`).
    *   **Sidebar Navigation**: Solid deep slate (`bg-slate-900 border-r border-slate-800 text-slate-300`). Selected states must match `bg-slate-800 text-white`.
*   **Typography**: Clean `Inter` font family for general user interfaces. Keep specific status labels, date blocks, and technical tags inside structured uppercase `font-mono` text.
*   **Micro-Animations**: All primary pages and main views must load using standard Tailwind transition entrance tags: `animate-in fade-in duration-300`. This provides a responsive, high-end feel.

---

## 🛠️ 2. Core Workspace UI Guidelines

To keep layout elements highly aligned, recreate these patterns when adding new controls or pages:
1.  **Icon Guidelines**: Import ALL dashboard and utility icons exclusively from `lucide-react`. Raw SVG injections are strictly forbidden to ensure consistent icon weights.
2.  **Notification & Feed Alerting**:
    *   Dynamic/critical due warnings require an Alert Banner styled as a warm Warning Stripe (`bg-amber-50/70 border-amber-200 text-slate-700`).
    *   Provide pulsing state markers (`animate-pulse`) and custom micro-badges for important system dates to direct analyst review.
3.  **Audit Logs & Exports**:
    *   All analytic action tables must utilize the existing unified rendering structure (`filteredAuditLogs` memo list).
    *   When exporting data, maintain CSV standard formatting (RFC-compliant double quotes for blocks containing comma variables).
4.  **No Telemetry Clutter / Artificial AI Slop**: Do not pollute page headers, footers, or margins with artificial port labels (e.g., "PORT: 3000"), fake uptime status dots, or useless ping rates. Keep outer backgrounds pristine, minimal, and empty.
5.  **Browser Window Native Modals**: Never use raw browser `window.alert()` or `window.confirm()` loops. Hook into custom DOM modal popups, React dialog overlays, or use the preconfigured `showToast` utility.

---

## 📂 3. File & Type Modularity

When adding backend features or client structures:
*   Define global data models in `/src/types.ts` early.
*   Do not bundle heavy client interfaces in `App.tsx`; extract standalone components into `/src/components/` to preserve token capacity and maintain simple readability.
*   Refer to the full `/UI_SPECIFICATION.md` for specific color palettes, status badge combinations, and class variables.
