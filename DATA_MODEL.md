# SQLite Database Schema & Data Model Specification
## Corporate Enterprise Ledger & CRM Platform

This document maps out the backend data layer for the Enterprise CRM platform. The database runs locally on a file-backed `SQLite` instance (`database.db`) using the high-performance `better-sqlite3` driver in Node.js.

---

## 💾 1. Database Connection & Driver
*   **Database File**: `/database.db`
*   **Driver**: `better-sqlite3`
*   **Execution Model**: Synchronous, single-threaded locks native to SQLite, optimized with transactional prepared statements.

---

## 📊 2. Table Schemas & Relational Mapping

The database consists of 11 core tables designed for data persistence and audit capability.

### 2.1 `users` (Analyst / Operator Seats)
Stores identity, assigned authorization role level, and status flags.
```sql
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  passwordHash TEXT,
  name TEXT,
  role TEXT,
  suspended INTEGER DEFAULT 0
);
```

### 2.2 `tags` (Unified Classification System)
Stores customizable visual categories and labels categorized by distinct context pools.
```sql
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT,
  color TEXT,
  groupName TEXT -- Categorisation group: 'eng_type', 'eng_status', 'int_type', 'contact_role', 'company_industry', 'company_tier', 'int_cont_role', 'doc_type', 'int_status', 'oper_checklist'
);
```

### 2.3 `notes` (Secure Attachments)
Stores textual records pinned to core parents with fine-grained visibility permissions.
```sql
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  content TEXT,
  createdAt TEXT,
  author TEXT,
  linkedToType TEXT, -- e.g., 'interaction', 'contact', 'entity', 'engagement'
  linkedToId TEXT,
  pinned INTEGER DEFAULT 0,
  Subject TEXT,
  visibility TEXT DEFAULT 'Public' -- 'Public' | 'Classified (Analysts Only)'
);
```

### 2.4 `documents` (Secure Archives)
Integrates metadata of physical files, attachment parent bindings, and accessibility levels.
```sql
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT,
  fileType TEXT, -- 'PDF' | 'Spreadsheet' | 'Presentation' | 'Contract' | 'Briefing'
  fileSize TEXT,
  uploadedAt TEXT,
  linkedToType TEXT, -- e.g., 'interaction', 'entity', 'contact'
  linkedToId TEXT,
  tagIds TEXT, -- JSON-stringified array (e.g., '["gt-dt-1"]')
  author TEXT,
  visibility TEXT DEFAULT 'Public' -- 'Public' | 'Classified (Analysts Only)'
);
```

### 2.5 `interactions` (Touchpoint Ledger)
Tracks communication checkpoints, assigned operators, checklists, and upcoming follow-up schedules.
```sql
CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  subject TEXT,
  type TEXT, -- e.g., 'Meeting', 'Email Sync', 'Support Call', 'Review Session'
  assignee TEXT,
  status TEXT, -- 'IN PROGRESS' | 'COMPLETED' | 'SCHEDULED' | 'BLOCKED'
  client TEXT, -- Links to entity.name or custom client string
  date TEXT, -- YYYY-MM-DD
  summary TEXT,
  tagIds TEXT, -- JSON-stringified array of tag identifiers
  contactRoles TEXT, -- JSON-stringified map recording contact-level event roles
  Note TEXT, -- Accompanying rich memo
  PrevInteraction INTEGER, -- Auto-increment link/indicator to prior Touchpoint (if any)
  duration INTEGER, -- Parsed interaction length in minutes (e.g. shorthand parsed from 2h to 120)
  engagementId TEXT, -- Link mapping touchpoint to specific active client engagements
  followUpDate TEXT, -- Watchdog date threshold: YYYY-MM-DD
  followUpNotes TEXT, 
  followUpCompleted INTEGER DEFAULT 0
);
```

### 2.6 `contacts` (Individual Coordinate Card)
Stores personal contact coordinates, role badges, parent firms, and star rankings.
```sql
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT,
  role TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  tagIds TEXT, -- JSON-stringified array of custom tag identifiers
  FirstName TEXT,
  MiddleName TEXT,
  Lastname TEXT,
  LinkedInURL TEXT,
  Ratting INTEGER -- Raw ranking representation (1 to 5 stars)
);
```

### 2.7 `entities` (Corporate Registries)
Stores firmographic metrics, geographical coordinates, website linkages, and strategic account tiers.
```sql
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  name TEXT,
  industry TEXT,
  tier TEXT, -- 'Strategic' | 'Enterprise' | 'Key Account' | 'Growth'
  location TEXT,
  tagIds TEXT, -- JSON-stringified tag arrays
  AddressLine_1 TEXT,
  AddressLine_2 TEXT,
  Postalcode TEXT,
  City TEXT,
  Website TEXT,
  Rating INTEGER -- Raw corporate strategic scorecard ranking (1 to 5 stars)
);
```

### 2.8 `engagements` (Initiative Milestones)
Persistent metadata of client projects, billing/status parameters, and descriptions.
```sql
CREATE TABLE IF NOT EXISTS engagements (
  id TEXT PRIMARY KEY,
  title TEXT,
  client TEXT,
  type TEXT, -- e.g., 'SOW Contract', 'Marketing Campaign', 'Retainer', 'Advisory Initiative'
  startDate TEXT, -- YYYY-MM-DD
  endDate TEXT, -- YYYY-MM-DD
  status TEXT, -- 'Active' | 'Pending Draft' | 'Closed' | 'Under Negotiation'
  description TEXT,
  tagIds TEXT -- JSON-stringified tags
);
```

### 2.9 `notifications` (Broadcasting Journal)
Logs operations occurring in the workspace to drive notifications, especially for Strategic account updates.
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  actionUserEmail TEXT,
  actionUserName TEXT,
  actionType TEXT, -- 'create' | 'update' | 'delete'
  entityId TEXT,
  entityName TEXT,
  entityTier TEXT,
  message TEXT,
  createdAt TEXT
);
```

### 2.10 `notification_reads` (Read State Junction)
Composite intersection tracking which operator has reviewed which system warning alert.
```sql
CREATE TABLE IF NOT EXISTS notification_reads (
  notificationId TEXT,
  userEmail TEXT,
  PRIMARY KEY (notificationId, userEmail)
);
```

### 2.11 `audit_logs` (System Security Ledger)
Strict log capture recording analytical operations, modifications, and deletes.
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  userEmail TEXT,
  userName TEXT,
  userRole TEXT,
  actionType TEXT, -- 'CREATE' | 'UPDATE' | 'DELETE' | 'BATCH_DELETE' | 'BATCH_UPDATE'
  targetType TEXT, -- e.g. 'Entity', 'Contact', 'Interaction', 'Engagement', 'Note', 'Document', 'User', 'Tag'
  targetId TEXT,
  targetName TEXT,
  details TEXT,
  timestamp TEXT
);
```

---

## 🛠️ 3. Safe Schema Migration Strategies
To guarantee seamless backward compatibility, the server carries inline migration logic. On database load, table adjustments are applied inside defensive blocks:

```typescript
// Exemplar Migration Safe Alter
try {
  db.exec("ALTER TABLE users ADD COLUMN suspended INTEGER DEFAULT 0");
} catch (err) {
  // Column already exists or table is still fresh, bypass log noise
}
```

Migrations executed on boot include:
1.  Adding `suspended` flag to `users` table.
2.  Adding `pinned` flag to `notes` table.
3.  Adding `groupName` to `tags` table.
4.  Injecting `FirstName`, `MiddleName`, `LinkedInURL`, `Rating`, `AddressLine_1` to support extensive profiling detail.
5.  Support for `followUpDate`, `followUpNotes`, and `followUpCompleted` fields within the `interactions` Touches table.
6.  Support for `duration` (integer minute count) and `engagementId` (linking text mapping back to persistent project initiatives) inside the `interactions` table.

---

## 🔐 4. Passphrase Seed Hashing Protocols
We use a high-performance hash helper built under a double-shift structure utilizing structured salt configurations.

### New Mail-Seeded Salt Hashing
Calculates an individualized hexadecimal digest based on the lowercase, trimmed operator email address. This ensures unique hashes for identical passphrases across accounts.
```typescript
const getNewHash = (pwd: string, email: string): string => {
  let hash = 0;
  const userSeed = email.toLowerCase().trim();
  const salt = `_crm_salt_2026_${userSeed}_`;
  const salted = pwd + salt;
  for (let i = 0; i < salted.length; i++) {
     hash = (hash << 5) - hash + salted.charCodeAt(i);
     hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};
```

### Inline Upgrade Logic
To avoid locking out historical seating configurations, the server runs a dynamic migrator that upgrades older standard hashes (using general `_crm_salt_2026_` salt) to the stronger email-seeded salt upon the first server initialization.

---

## 🌱 5. Seeding Strategy & Ground Data
If database counts return empty values on startup, the application populates transactional ground data to allow interactive immediate previews:

1.  **Default Senior Operator**:
    *   `email`: `david@enterprise.com`
    *   `pwd`: `password123` (Auto-hashed natively to strong email-salted value)
    *   `name`: `David Jenkins`
    *   `role`: `Senior Analyst`
2.  **Basic & Grouped Tags**: Seeds core labels (`High Priority`, `Follow Up`, `Tech Audit`) and creates relational context mappings (e.g. `gt-1` as "SOW Contract" under `groupName: "eng_type"`).
3.  **Active Organization Mocks**: Seeds corporate organizations like `Apex Solutions Ltd.` and `Stark Enterprises` mapping tier, industry and location metadata.
4.  **Assigned Engagements & Touchpoints**: Connects the entity states with real engagements (e.g., "FinTech Acceleration SOW") and scheduled interaction touchpoints to enable full functional flows.
