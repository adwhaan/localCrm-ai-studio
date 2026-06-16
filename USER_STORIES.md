# User Journeys & Operational Stories (User Stories)
## Corporate Enterprise Ledger & CRM Platform

This document describes the operational goals, target user personas, and core user stories for the Enterprise CRM platform. Other agents can use this guide to verify whether all user capabilities are preserved and implemented identically.

---

## 👥 1. Target Personas & Role Contexts
Two primary physical seats access the workspace, determined by their `role` attribute stored in the database:

1.  **Standard Analyst (Operator Unit)**:
    *   Main focus: Logging daily customer alignments, compiling meeting minutes, and executing scheduled support or email touchpoints.
    *   System Boundaries: Restricted from managing operator seats, auditing full workspace activities, purging logs, or viewing accounts classified under the **Strategic** category.
2.  **Senior Analyst (Administrator)**:
    *   Main focus: Allocating analyst workloads, auditing system changes, correcting security permissions, and overseeing strategic enterprise customers.
    *   System Boundaries: Unrestricted access to all data, log tables, admin override panels, and user state controls.

---

## 📋 2. Structured User Stories

### Story 1: Logging & Filtering Touchpoints (Standard & Senior Analysts)
> *As an Analyst, I want to create, view, search, and filter customer touchpoint interactions so that I can easily track customer alignments.*

#### Acceptance Criteria & UI Specifications:
*   **Touchpoint Dashboard Options**: The analyst can view interactions in three distinct representations:
    1.  **Tabular List**: A dense table of items with sortable columns (Date, Status, Subject).
    2.  **Touchpoint Board (Kanban)**: A column-based system divided into 4 main pipelines (`IN PROGRESS`, `SCHEDULED`, `COMPLETED`, `BLOCKED`).
    3.  **Interdependency Gantt Chart**: A sequencing and dependency chart grouped by months.
*   **Faceted Sorting and Queries**: Search filters must scan subjects, summaries, client names, assignee names, and follow-up notes simultaneously.
*   **Interactive Side Drawer**: Clicking on any interaction row or Kanban card must trigger a right-side slide-out panel (`w-[420px]`) showing the full details, pinned notes, attachments, and role configurations for that record without reloading the screen.

---

### Story 2: Establishing Sequence Relationships via Predecessors
> *As an Analyst, I want to define predecessor touchpoints when scheduling an interaction, so that we can establish clear task dependencies (e.g., "Email followup" can only start after "Kickoff meeting" is completed).*

#### Acceptance Criteria & UI Specifications:
*   **Relationship Anchors**: While creating or editing an Interaction in the form modal, the user can select an optional predecessor from a dropdown list of existing active interactions.
*   **Data Attribute Mapping**: This selected predecessor maps to the `PrevInteraction` attribute in the interaction schema (mapped to the target predecessor interaction's unique ID).
*   **Implicit Schedule Boundaries**: If an interaction defines a target predecessor link, it enters a `WAITING` visual state and doesn't initially render with a hard calendar schedule date. The target date input label dynamically reads: `"Target Date (Optional - Auto-calculated)"`.

---

### Story 3: Visualizing Sequences with the Interdependency Gantt Chart
> *As an Analyst, I want to visualize sequential touchpoint paths and relationship connections in a monthly Gantt calendar, so that I can track blockages and pipeline progress.*

#### Acceptance Criteria & UI Specifications:
*   **Single Month Scope**: The Gantt chart groups records chronologically inside the selected month scope using month navigation triggers (`<` and `>` buttons on the calendar header).
*   **Dual Panel Split Layout**:
    1.  **Left Block (Sticky Panel)**: Displays the item's `Subject`, `Assignee`, and `Client` in a solid layout (`280px` wide). Elements that are `WAITING` are highlighted with a dashed left border.
    2.  **Right Track (Horizontal Scroll)**: Displays numerical grid days of the calendar month (e.g., 1 to 30/31).
*   **Predecessor Arcs & Overlay**: An SVG coordinate layer spans across the track grid, rendering connecting lines with directional arrows (`markerEnd`) linking predecessor right edges to successor left edges:
    *   Connected lines are styled as dashed gray arcs (`stroke-[#cbd5e1]`) for active dependencies, and solid lines once completed.
    *   Hovering over any item on the Gantt rows highlights its respective relationship lines in bright indigo (`#6366f1`) and increases the stroke width to `2.5px` for clear analytical feedback.
*   **State Representations on the Gantt Grid**:
    *   **Active Scheduled Items**: Positioned precisely on their scheduled day cells as solid, colored circular milestone pills containing a `GitCommit` icon (color-mapped: Emerald = Completed, Blue = Scheduled, Amber = In Progress, Rose = Blocked).
    *   **Waiting / Projected Items (All except CANCELED)**: Unscheduled items with dependencies also display on the Gantt chart! They are mapped to their *Projected Date* (the predecessor's `followUpDate`, predecessor's active date, or today's date if unresolved). These are rendered as beautiful, hollow pills with dashed outlines matching their status colors.

---

### Story 4: Automated Sequential Triggers on Touchpoint Completion
> *As an Analyst, I want the system to automatically activate subsequent dependent touchpoints when I mark a predecessor item as COMPLETED, so that the team can skip manual scheduling.*

#### Acceptance Criteria & UI Specifications:
*   **Precursor Activation Rules**: When an analyst sets an interaction's status to `COMPLETED` (via the Kanban drag-and-drop, the table, or the edit slide-drawer forms):
    1.  The system scans the database for any corresponding dependent touchpoints (`PrevInteraction` equals the completed interaction's ID).
    2.  The status of these dependent touchpoints automatically flips from `SCHEDULED`/`WAITING` to `IN PROGRESS`.
    3.  **Scheduled Date Calculation**: The system updates the successor's active calendar date:
        - If the completed predecessor defined a `followUpDate`, this exact date is automatically applied to the successor's scheduled date.
        - If no `followUpDate` was specified, the current local date (today's coordinate) is used as a fallback.
*   **Broadcasting Notifications**: Upon activation, a system warning notification alerts other logged-in analysts, popping up a local toast confirmation summarizing the trigger.

---

### Story 5: Confidential Strategic Account Quarantine (Senior Analysts Only)
> *As a Senior Analyst, I want strategic client data and notifications to be restricted from standard operators, so that I can maintain confidentiality.*

#### Acceptance Criteria & UI Specifications:
*   **Strategic Tier Flags**: Corporate Entities designated under the `Strategic` account tier must have their data filtered on client layouts based on the current session email role.
*   **Visual Quarantine**:
    *   Standard Operators do not see strategic client indicators or logs in their dashboards.
    *   If a strategic account is modified, the websocket payload broadcasts changes only to sessions matching `Senior Analyst`.
    *   A warning ribbon (`bg-rose-50/80 border-rose-200`) flags strategic details when viewed by certified administrative analysts.

---

### Story 6: High-Density Audit Trail Ledger (Senior Analysts Only)
> *As a Senior Analyst, I want to access a chronological system log of all changes, with capabilities to filter, search, and export to CSV, so that I can audit platform activity.*

#### Acceptance Criteria & UI Specifications:
*   **Audit Table**: Accessible only to senior credentials via a dedicated sidebar node. Renders rows showing User, Target Category, Action Type, Detailed Diff Text, and raw ISO timestamps.
*   **Bulk Operations Logging**: Batch deletions or cascading status changes must generate explicit multi-target audit entries.
*   **RFC-4180 CSV Export**: Senior analysts can trigger an instant download of filtered logs to a CSV format. All cell blocks containing embedded commas or secondary quotes are strictly encapsulated within standard double-quotes to ensure perfect spreadsheet layout rendering.
