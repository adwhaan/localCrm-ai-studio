# System Architecture & Technical Overview
## Full-Stack Enterprise Customer Alignment Platform

This document describes the full-stack architecture of the Enterprise CRM platform for other developers and agents. It details the runtime design, synchronization triggers, security boundaries, and authorization layers.

---

## 🏗️ 1. Core Technical Stack
The platform-system is engineered as a zero-cold-start, fast-syncing web application using the following frameworks:

```
                  +----------------------------------------------+
                  |               Vite React SPA                 |
                  |  * Lucide Icons     * React Hooks            |
                  |  * Tailwind CSS     * Dynamic Theme Engine   |
                  +----------------------+-----------------------+
                                         |
                       Sync Requests /   |   Bi-directional
                       REST Endpoints    |   WebSockets
                                         v
                  +----------------------+-----------------------+
                  |            Express Native Server             |
                  |  * tsx Dev Runtime  * esbuild Production     |
                  |  * Static Router    * JSON Body Parser       |
                  +----------------------+-----------------------+
                                         |
                                         v
                  +----------------------+-----------------------+
                  |               SQLite Local Storage           |
                  |  * database.db      * better-sqlite3         |
                  |  * Schema Migrations* Prepared Statements    |
                  +----------------------------------------------+
```

1.  **Frontend Single Page Application (SPA)**: Renders a high-performance React application constructed with Vite, styled with Tailwind CSS, using Lucide-React icons and Recharts components.
2.  **Backend Application Server**: An Express.js node container routing static static files, rendering REST API paths, and managing WebSocket broadcast connections.
3.  **Relational Persistence Engine**: Local `SQLite` file database running synchronously via `better-sqlite3` within the backend memory space.
4.  **Active Web Sockets Server**: Tracks interactive operator sessions to dispatch changes, state reminders, and security alerts in real-time.

---

## 🔐 2. Authorization Security & Role Level Matrix
The system enforces strict role-based capability boundaries. Two standard roles exist for registered analysts:

### 2.1 Role Boundaries Table
| Action / Resource | Operator Unit | Senior Analyst | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **Manage Contacts / Work Items** | Allowed | Allowed | Front-end Forms & REST API routes |
| **Manage Operator Seats** | Restricted | Allowed | Sidebar views & Session verification |
| **Access System Audit Logs** | Blocked | Allowed | REST Endpoint Header check (`x-user-role`) |
| **Execute Audit Log Purge** | Blocked | Allowed | REST Endpoint Header check (`x-user-role`) |
| **Strategic Account Visibility** | Blocked | Allowed | Strategic Tier notification routing & UI filtering |
| **Admin Visibility Override** | Blocked | Allowed | Dashboard view & Custom Admin controller panel |

### 2.2 Strategic Tier Confidentiality
If a corporate entity is categorized under the **Strategic** Account Tier, its notifications are filtered from non-senior operator views. Under WS broad-casting or route loading, metadata is evaluated prior to rendering.

---

## 🔄 3. Multi-Analyst Synchronization & Sync Flow
To prevent stale states across concurrent operator portals:

```
     [Operator A UI Action] 
               │
               ▼
     [Local API call to Server] ──────► [SQLite Local Update & Log Entry]
               │
               ▼ (Server Processes)
     [WebSocket Broadcast Notification] 
               │
               ▼
     [Incoming WS Notification at Operator B] 
               │
               ▼
     [Auto-Fetch / Reload State in Operator B UI] ──► [Visual Alert Toast]
```

1.  **Optimistic Local Storage Sync**: The frontend caches and reads tables within standard client `localStorage` to ensure instant visual responsiveness.
2.  **Direct API State Reconciliation**: Every write, modify, or deletion routes to `/api/*` endpoints. Upon successful verification, the backend commits changes to SQLite and returns status.
3.  **Real-Time Broadcast Signaling**: The websocket container identifies changed records. If a modified organization carries a confidential Strategic Tier, only clients with Senior Analyst credentials receive socket payloads.
4.  **Auto Re-fetch Handlers**: Opposing client ports catch the received socket event, displaying a toast notification alert, and calling `/api/all` behind the scenes to fetch up-to-date values seamlessly.

---

## 📝 4. Unified Audit Logging System
Every mutator endpoint (POST, PUT, DELETE) natively calls the internal `addAuditLog` procedure.

### Attributes Captured
*   `userEmail`: Authenticated operator key dispatching the event.
*   `userName`: Profile name mapping.
*   `userRole`: Security category.
*   `actionType`: Operations class (`CREATE`, `UPDATE`, `DELETE`, etc.).
*   `targetType`: Affected data category (`Entity`, `Contact`, `Interaction`, etc.).
*   `details`: Detailed descriptive audit text summarizing fields modified.
*   `timestamp`: Raw ISO coordinate strings.

Analysts can select log filters (Target class, action class, date ranges) and trigger clean exports directly to CSV files using a standard RFC-4180 double-quoting parser.

---

## 📁 5. Directory Layout

A quick overview of key files and directories:
*   `/database.db`: The local SQLite file.
*   `/server.ts`: Full Express backend structure, schema updates, REST controllers, and WS sockets.
*   `/src/main.tsx`: Entry point for React.
*   `/src/App.tsx`: Central frontend portal orchestrating theme managers, dashboard grids, Kanban pipelines, slide drawers, forms, and dialog overlays.
*   `/src/components/EngagementAnalyticsView.tsx`: Analytical metrics view component implementing Recharts-driven dual area-based burn-up charts for engagements.
*   `/types.ts`: TypeScript data interfaces.
*   `/UI_SPECIFICATION.md`: Original visual standards representing high density and high contrast panels.
*   `/UI_LOOK_AND_FEEL.md`: Visual styling guidelines for themes, grids, and Gantt tracking bars.
*   `/DATA_MODEL.md`: SQLite database tables, relational schemas, and migration triggers.
*   `/USER_STORIES.md`: User journeys, persona matrices, sequence cascades, and operational stories.
*   `/SYSTEM_OVERVIEW.md`: High-level system architecture and roles directory (this file).
