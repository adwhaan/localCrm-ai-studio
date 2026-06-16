import express from "express";
import path from "path";
import Database from "better-sqlite3";
import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";

async function startServer() {
  const app = express();
  const PORT = 3000;
  let wss: any;

  app.use(express.json());

  // Database initialization
  const db = new Database("database.db");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      passwordHash TEXT,
      name TEXT,
      role TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT,
      createdAt TEXT,
      author TEXT,
      linkedToType TEXT,
      linkedToId TEXT,
      pinned INTEGER DEFAULT 0,
      Subject TEXT,
      visibility TEXT DEFAULT 'Public'
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT,
      fileType TEXT,
      fileSize TEXT,
      uploadedAt TEXT,
      linkedToType TEXT,
      linkedToId TEXT,
      tagIds TEXT,
      author TEXT,
      visibility TEXT DEFAULT 'Public'
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      subject TEXT,
      type TEXT,
      assignee TEXT,
      status TEXT,
      client TEXT,
      date TEXT,
      summary TEXT,
      tagIds TEXT,
      contactRoles TEXT,
      Note TEXT,
      PrevInteraction INTEGER,
      duration INTEGER,
      engagementId TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT,
      role TEXT,
      company TEXT,
      email TEXT,
      phone TEXT,
      tagIds TEXT,
      FirstName TEXT,
      MiddleName TEXT,
      Lastname TEXT,
      LinkedInURL TEXT,
      Ratting INTEGER,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      name TEXT,
      industry TEXT,
      tier TEXT,
      location TEXT,
      tagIds TEXT,
      AddressLine_1 TEXT,
      AddressLine_2 TEXT,
      Postalcode TEXT,
      City TEXT,
      Website TEXT,
      Rating INTEGER
    );

    CREATE TABLE IF NOT EXISTS engagements (
      id TEXT PRIMARY KEY,
      title TEXT,
      client TEXT,
      type TEXT,
      startDate TEXT,
      endDate TEXT,
      status TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      actionUserEmail TEXT,
      actionUserName TEXT,
      actionType TEXT,
      entityId TEXT,
      entityName TEXT,
      entityTier TEXT,
      message TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS notification_reads (
      notificationId TEXT,
      userEmail TEXT,
      PRIMARY KEY (notificationId, userEmail)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      userEmail TEXT,
      userName TEXT,
      userRole TEXT,
      actionType TEXT,
      targetType TEXT,
      targetId TEXT,
      targetName TEXT,
      details TEXT,
      timestamp TEXT
    );
  `);

  // Fallback DB Migration to support soft-delete and notes pinning
  try {
    db.exec("ALTER TABLE users ADD COLUMN suspended INTEGER DEFAULT 0");
  } catch (err) {
    // Column already exists or table is still fresh
  }

  try {
    db.exec("ALTER TABLE notes ADD COLUMN pinned INTEGER DEFAULT 0");
  } catch (err) {
    // Column already exists or table is still fresh
  }

  try {
    db.exec("ALTER TABLE tags ADD COLUMN groupName TEXT");
  } catch (err) {
    // Column already exists or table is still fresh
  }

  try {
    db.exec("ALTER TABLE interactions ADD COLUMN contactRoles TEXT");
  } catch (err) {
    // Column already exists or table is still fresh
  }

  try {
    db.exec("ALTER TABLE contacts ADD COLUMN tagIds TEXT");
  } catch (err) {
    // Column already exists or table is still fresh
  }

  try {
    db.exec("ALTER TABLE entities ADD COLUMN tagIds TEXT");
  } catch (err) {
    // Column already exists or table is still fresh
  }

  try {
    db.exec("ALTER TABLE engagements ADD COLUMN tagIds TEXT");
  } catch (err) {
    // Column already exists or table is still fresh
  }

  // New Fields migrations for backward compatibility
  try { db.exec("ALTER TABLE documents ADD COLUMN tagIds TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE notes ADD COLUMN Subject TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE notes ADD COLUMN visibility TEXT DEFAULT 'Public'"); } catch (e) {}
  try { db.exec("ALTER TABLE documents ADD COLUMN visibility TEXT DEFAULT 'Public'"); } catch (e) {}
  try { db.exec("ALTER TABLE documents ADD COLUMN author TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE interactions ADD COLUMN Note TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE interactions ADD COLUMN PrevInteraction INTEGER"); } catch (e) {}
  try { db.exec("ALTER TABLE contacts ADD COLUMN FirstName TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE contacts ADD COLUMN MiddleName TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE contacts ADD COLUMN Lastname TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE contacts ADD COLUMN LinkedInURL TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE contacts ADD COLUMN Ratting INTEGER"); } catch (e) {}
  try { db.exec("ALTER TABLE contacts ADD COLUMN updatedAt TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE entities ADD COLUMN AddressLine_1 TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE entities ADD COLUMN AddressLine_2 TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE entities ADD COLUMN Postalcode TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE entities ADD COLUMN City TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE entities ADD COLUMN Website TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE entities ADD COLUMN Rating INTEGER"); } catch (e) {}
  try { db.exec("ALTER TABLE interactions ADD COLUMN duration INTEGER"); } catch (e) {}
  try { db.exec("ALTER TABLE interactions ADD COLUMN followUpDate TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE interactions ADD COLUMN followUpNotes TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE interactions ADD COLUMN followUpCompleted INTEGER DEFAULT 0"); } catch (e) {}
  try { db.exec("ALTER TABLE interactions ADD COLUMN engagementId TEXT"); } catch (e) {}

  // Helper to check if user table is empty and seed
  const getOldHash = (pwd: string): string => {
    let hash = 0;
    const salt = "_crm_salt_2026_";
    const salted = pwd + salt;
    for (let i = 0; i < salted.length; i++) {
       hash = (hash << 5) - hash + salted.charCodeAt(i);
       hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

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

  // --- DATABASE RESET & DENSE SYSTEM SEEDING FOR CRM TESTING ---
  try {
    console.log("🧼 DATABASE RESET INITIATED: Clearing all rows to restore a pristine environment...");
    db.exec("DELETE FROM users");
    db.exec("DELETE FROM tags");
    db.exec("DELETE FROM notes");
    db.exec("DELETE FROM documents");
    db.exec("DELETE FROM interactions");
    db.exec("DELETE FROM contacts");
    db.exec("DELETE FROM entities");
    db.exec("DELETE FROM engagements");
    db.exec("DELETE FROM notifications");
    db.exec("DELETE FROM notification_reads");
    db.exec("DELETE FROM audit_logs");

    // 1. Seed Core Users (with custom salted hashes)
    const adminHash = getNewHash("password123", "admin@enterprise.com");
    const davidHash = getNewHash("password123", "david@enterprise.com");
    const alexHash = getNewHash("password123", "alex@enterprise.com");

    db.prepare("INSERT INTO users (email, passwordHash, name, role, suspended) VALUES (?, ?, ?, ?, 0)")
      .run("admin@enterprise.com", adminHash, "System Administrator", "Senior Analyst");
    db.prepare("INSERT INTO users (email, passwordHash, name, role, suspended) VALUES (?, ?, ?, ?, 0)")
      .run("david@enterprise.com", davidHash, "David Jenkins", "Senior Analyst");
    db.prepare("INSERT INTO users (email, passwordHash, name, role, suspended) VALUES (?, ?, ?, ?, 0)")
      .run("alex@enterprise.com", alexHash, "Alex Rivera", "Standard Analyst");

    // 2. Seed Structured Tags for Groups
    const seedTags = [
      // General Tags (Legacy/General Category)
      { id: "tag-1", name: "SLA Compliant", color: "indigo", groupName: null },
      { id: "tag-2", name: "Q3 Alignment", color: "emerald", groupName: null },
      { id: "tag-3", name: "Urgent Review", color: "red", groupName: null },

      // company_industry
      { id: "gt-ind-1", name: "Artificial Intelligence", color: "indigo", groupName: "company_industry" },
      { id: "gt-ind-2", name: "Web3 & Cloud Infra", color: "emerald", groupName: "company_industry" },
      { id: "gt-ind-3", name: "Developer Tooling", color: "blue", groupName: "company_industry" },
      { id: "gt-ind-4", name: "FinTech & Payments", color: "purple", groupName: "company_industry" },

      // company_tier
      { id: "gt-tier-1", name: "Strategic Enterprise", color: "emerald", groupName: "company_tier" },
      { id: "gt-tier-2", name: "Series A/B Backed", color: "blue", groupName: "company_tier" },
      { id: "gt-tier-3", name: "Bootstrapped Startup", color: "purple", groupName: "company_tier" },

      // contact_role
      { id: "gt-role-1", name: "Technical Founder", color: "purple", groupName: "contact_role" },
      { id: "gt-role-2", name: "VP of Engineering", color: "blue", groupName: "contact_role" },
      { id: "gt-role-3", name: "Product Manager", color: "pink", groupName: "contact_role" },

      // eng_type
      { id: "gt-engt-1", name: "SaaS Product Demo", color: "blue", groupName: "eng_type" },
      { id: "gt-engt-2", name: "Custom Integration", color: "purple", groupName: "eng_type" },
      { id: "gt-engt-3", name: "Architecture Advisory", color: "emerald", groupName: "eng_type" },

      // eng_status
      { id: "gt-engs-1", name: "In MVP Sandbox", color: "blue", groupName: "eng_status" },
      { id: "gt-engs-2", name: "In Production", color: "emerald", groupName: "eng_status" },
      { id: "gt-engs-3", name: "Security Review", color: "indigo", groupName: "eng_status" },

      // int_type
      { id: "gt-intt-1", name: "Code Review Sync", color: "blue", groupName: "int_type" },
      { id: "gt-intt-2", name: "User Q&A Session", color: "amber", groupName: "int_type" },
      { id: "gt-intt-3", name: "Architecture Pitch", color: "purple", groupName: "int_type" },
      { id: "gt-intt-4", name: "SLA Support Call", color: "red", groupName: "int_type" },

      // int_status
      { id: "gt-ints-1", name: "IN PROGRESS", color: "blue", groupName: "int_status" },
      { id: "gt-ints-2", name: "SCHEDULED", color: "purple", groupName: "int_status" },
      { id: "gt-ints-3", name: "COMPLETED", color: "emerald", groupName: "int_status" },
      { id: "gt-ints-4", name: "BLOCKED", color: "red", groupName: "int_status" },

      // oper_checklist
      { id: "checklist-nda", name: "NDA Signed", color: "indigo", groupName: "oper_checklist" },
      { id: "checklist-git", name: "Git Access Shared", color: "emerald", groupName: "oper_checklist" },
      { id: "checklist-cloud", name: "Cloud Target Ready", color: "blue", groupName: "oper_checklist" },

      // doc_type
      { id: "gt-dt-1", name: "API Specification", color: "red", groupName: "doc_type" },
      { id: "gt-dt-2", name: "Architecture Diagram", color: "emerald", groupName: "doc_type" },
      { id: "gt-dt-3", name: "SLA Master Contract", color: "blue", groupName: "doc_type" }
    ];

    const tagStmt = db.prepare("INSERT INTO tags (id, name, color, groupName) VALUES (?, ?, ?, ?)");
    for (const t of seedTags) {
      tagStmt.run(t.id, t.name, t.color, t.groupName);
    }

    // 3. Seed Corporate Accounts / Entities (Multiple)
    const seedEntities = [
      {
        id: "ent-1",
        name: "Acme AI Systems",
        industry: "Artificial Intelligence",
        tier: "Strategic",
        location: "San Francisco, CA",
        tagIds: JSON.stringify(["gt-ind-1", "gt-tier-1"]),
        AddressLine_1: "500 Innovation Way",
        AddressLine_2: "Suite 400",
        Postalcode: "94107",
        City: "San Francisco",
        Website: "https://acme-ai.io",
        Rating: 5
      },
      {
        id: "ent-2",
        name: "BlockStream Infra",
        industry: "Web3 & Cloud Infra",
        tier: "Enterprise",
        location: "Austin, TX",
        tagIds: JSON.stringify(["gt-ind-2", "gt-tier-2"]),
        AddressLine_1: "80 Cryptography Blvd",
        AddressLine_2: "",
        Postalcode: "78701",
        City: "Austin",
        Website: "https://blockinfra.net",
        Rating: 4
      },
      {
        id: "ent-3",
        name: "Novus FinTech",
        industry: "FinTech & Payments",
        tier: "Growth",
        location: "New York, NY",
        tagIds: JSON.stringify(["gt-ind-4", "gt-tier-3"]),
        AddressLine_1: "12 Wall St",
        AddressLine_2: "Plaza Level",
        Postalcode: "10005",
        City: "New York",
        Website: "https://novuspay.com",
        Rating: 3
      },
      {
        id: "ent-4",
        name: "VaporWare Labs",
        industry: "Developer Tooling",
        tier: "Growth",
        location: "Los Angeles, CA",
        tagIds: JSON.stringify(["gt-ind-3", "gt-tier-3"]),
        AddressLine_1: "99 Empty Promise Lane",
        AddressLine_2: "",
        Postalcode: "90210",
        City: "Los Angeles",
        Website: "https://vaporlabs.io",
        Rating: 1
      },
      {
        id: "ent-5",
        name: "ZettaByte Storage",
        industry: "Web3 & Cloud Infra",
        tier: "Growth",
        location: "Seattle, WA",
        tagIds: JSON.stringify(["gt-ind-2", "gt-tier-3"]),
        AddressLine_1: "101 Terabyte Terminal",
        AddressLine_2: "Building B",
        Postalcode: "98101",
        City: "Seattle",
        Website: "https://zettastorage.tech",
        Rating: 4
      },
      {
        id: "ent-6",
        name: "CyberShield Tech",
        industry: "Developer Tooling",
        tier: "Enterprise",
        location: "Boston, MA",
        tagIds: JSON.stringify(["gt-ind-3", "gt-tier-2"]),
        AddressLine_1: "128 Secure Parkway",
        AddressLine_2: "",
        Postalcode: "02108",
        City: "Boston",
        Website: "https://cybershield.security",
        Rating: 5
      },
      {
        id: "ent-7",
        name: "Apex Algorithmic",
        industry: "Artificial Intelligence",
        tier: "Strategic",
        location: "Denver, CO",
        tagIds: JSON.stringify(["gt-ind-1", "gt-tier-1"]),
        AddressLine_1: "42 Peak Elevation Way",
        AddressLine_2: "Penthouse",
        Postalcode: "80202",
        City: "Denver",
        Website: "https://apexalgo.ai",
        Rating: 5
      }
    ];

    const entStmt = db.prepare(`
      INSERT INTO entities (id, name, industry, tier, location, tagIds, AddressLine_1, AddressLine_2, Postalcode, City, Website, Rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const e of seedEntities) {
      entStmt.run(e.id, e.name, e.industry, e.tier, e.location, e.tagIds, e.AddressLine_1, e.AddressLine_2, e.Postalcode, e.City, e.Website, e.Rating);
    }

    // 4. Seed Contacts / Key Leads (Multiple)
    const seedContacts = [
      {
        id: "con-1",
        name: "Alice Vance",
        role: "VP of Engineering",
        company: "Acme AI Systems",
        email: "alice@acme-ai.io",
        phone: "+1-555-0199",
        tagIds: JSON.stringify(["gt-role-2"]),
        FirstName: "Alice",
        MiddleName: "M.",
        Lastname: "Vance",
        LinkedInURL: "https://linkedin.com/in/alicev",
        Ratting: 5
      },
      {
        id: "con-2",
        name: "Bob Carter",
        role: "Technical Founder",
        company: "BlockStream Infra",
        email: "bob@blockinfra.net",
        phone: "+1-555-0142",
        tagIds: JSON.stringify(["gt-role-1"]),
        FirstName: "Bob",
        MiddleName: "",
        Lastname: "Carter",
        LinkedInURL: "https://linkedin.com/in/bobcarter",
        Ratting: 4
      },
      {
        id: "con-3",
        name: "Charlie Dunne",
        role: "Product Manager",
        company: "Novus FinTech",
        email: "charlie@novuspay.com",
        phone: "+1-555-0188",
        tagIds: JSON.stringify(["gt-role-3"]),
        FirstName: "Charlie",
        MiddleName: "D.",
        Lastname: "Dunne",
        LinkedInURL: "https://linkedin.com/in/charliedunne",
        Ratting: 3
      },
      {
        id: "con-4",
        name: "Diana Prince",
        role: "VP of Engineering",
        company: "CyberShield Tech",
        email: "diana@cybershield.security",
        phone: "+1-555-0211",
        tagIds: JSON.stringify(["gt-role-2"]),
        FirstName: "Diana",
        MiddleName: "",
        Lastname: "Prince",
        LinkedInURL: "https://linkedin.com/in/dianaprince",
        Ratting: 5
      },
      {
        id: "con-5",
        name: "Evan Wright",
        role: "Technical Founder",
        company: "ZettaByte Storage",
        email: "evan@zettastorage.tech",
        phone: "+1-555-0322",
        tagIds: JSON.stringify(["gt-role-1"]),
        FirstName: "Evan",
        MiddleName: "J.",
        Lastname: "Wright",
        LinkedInURL: "https://linkedin.com/in/evanwright",
        Ratting: 4
      },
      {
        id: "con-6",
        name: "Fiona Gallagher",
        role: "Product Manager",
        company: "Apex Algorithmic",
        email: "fiona@apexalgo.ai",
        phone: "+1-555-0455",
        tagIds: JSON.stringify(["gt-role-3"]),
        FirstName: "Fiona",
        MiddleName: "R.",
        Lastname: "Gallagher",
        LinkedInURL: "https://linkedin.com/in/fionagallagher",
        Ratting: 4
      }
    ];

    const conStmt = db.prepare(`
      INSERT INTO contacts (id, name, role, company, email, phone, tagIds, FirstName, MiddleName, Lastname, LinkedInURL, Ratting, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of seedContacts) {
      conStmt.run(c.id, c.name, c.role, c.company, c.email, c.phone, c.tagIds, c.FirstName, c.MiddleName, c.Lastname, c.LinkedInURL, c.Ratting, new Date().toISOString());
    }

    // 5. Seed Engagements (Multiple)
    const seedEngagements = [
      {
        id: "eng-1",
        title: "Acme Enterprise AI Core Migration",
        client: "Acme AI Systems",
        type: "Custom Integration",
        startDate: "2026-07-01",
        endDate: "2026-10-31",
        status: "Active",
        description: "Deploying core AI modeling clusters inside the Acme secure cloud perimeter.",
        tagIds: JSON.stringify(["gt-engt-2", "gt-engs-2"])
      },
      {
        id: "eng-2",
        title: "BlockStream MVP Setup",
        client: "BlockStream Infra",
        type: "SaaS Product Demo",
        startDate: "2026-07-05",
        endDate: "2026-08-15",
        status: "Under Negotiation",
        description: "Onboarding initial validator telemetry nodes to our metrics platform.",
        tagIds: JSON.stringify(["gt-engt-1", "gt-engs-1"])
      },
      {
        id: "eng-3",
        title: "Novus FinTech Scaling Review",
        client: "Novus FinTech",
        type: "Architecture Advisory",
        startDate: "2026-07-15",
        endDate: "2026-08-31",
        status: "Pending Draft",
        description: "Database performance auditing and scaling roadmap drafting.",
        tagIds: JSON.stringify(["gt-engt-3", "gt-engs-3"])
      },
      {
        id: "eng-4",
        title: "CyberShield SecOps Evaluation",
        client: "CyberShield Tech",
        type: "Architecture Advisory",
        startDate: "2026-07-01",
        endDate: "2026-07-25",
        status: "Active",
        description: "Comprehensive audits of developer cluster security boundaries and RBAC mapping.",
        tagIds: JSON.stringify(["gt-engt-3", "gt-engs-3"])
      },
      {
        id: "eng-5",
        title: "Apex AI Model Optimization Sync",
        client: "Apex Algorithmic",
        type: "Custom Integration",
        startDate: "2026-07-10",
        endDate: "2026-09-30",
        status: "Active",
        description: "Refining inference pipelines and throughput statistics for peak core efficiency.",
        tagIds: JSON.stringify(["gt-engt-2", "gt-engs-1"])
      }
    ];

    const engStmt = db.prepare(`
      INSERT INTO engagements (id, title, client, type, startDate, endDate, status, description, tagIds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const e of seedEngagements) {
      engStmt.run(e.id, e.title, e.client, e.type, e.startDate, e.endDate, e.status, e.description, e.tagIds);
    }

    // 6. Seed Interactions / Touchpoints (Multiple, interdependent, various statuses, starting from July 1st)
    const seedInteractions = [
      {
        id: "Int-1",
        subject: "Corporate Alignment and NDA Signing",
        type: "User Q&A Session",
        assignee: "David Jenkins",
        status: "COMPLETED",
        client: "Acme AI Systems",
        date: "2026-07-01",
        summary: "Completed executive briefing and finalized the NDA agreement.",
        tagIds: JSON.stringify(["checklist-nda", "gt-ints-3"]),
        contactRoles: JSON.stringify({ "con-1": "Decision Maker" }),
        Note: "NDA successfully signed and cataloged.",
        PrevInteraction: null,
        duration: 45,
        engagementId: "eng-1",
        followUpDate: "2026-07-03",
        followUpNotes: "Proceed to system architecture exploration workshop.",
        followUpCompleted: 1
      },
      {
        id: "Int-2",
        subject: "System Architecture Exploration Workshop",
        type: "Architecture Pitch",
        assignee: "David Jenkins",
        status: "COMPLETED",
        client: "Acme AI Systems",
        date: "2026-07-03",
        summary: "Reviewed internal data schemas and network security constraints.",
        tagIds: JSON.stringify(["gt-dt-2", "gt-ints-3"]),
        contactRoles: JSON.stringify({ "con-1": "Participant" }),
        Note: "Architecture blueprint approved in principal.",
        PrevInteraction: "Int-1",
        duration: 90,
        engagementId: "eng-1",
        followUpDate: "2026-07-08",
        followUpNotes: "Provide initial API Specification blueprints.",
        followUpCompleted: 1
      },
      {
        id: "Int-3",
        subject: "API Specification Proposal Review",
        type: "Code Review Sync",
        assignee: "Alex Rivera",
        status: "IN PROGRESS",
        client: "Acme AI Systems",
        date: "2026-07-08",
        summary: "Joint review of draft API payloads with Acme VP of Eng Alice Vance.",
        tagIds: JSON.stringify(["gt-dt-1", "gt-ints-1"]),
        contactRoles: JSON.stringify({ "con-1": "Reviewer" }),
        Note: "Minor schema updates requested. Currently in progress.",
        PrevInteraction: "Int-2",
        duration: 60,
        engagementId: "eng-1",
        followUpDate: "2026-07-15",
        followUpNotes: "Trigger GitHub Repo access and begin cloud pipeline setup.",
        followUpCompleted: 0
      },
      {
        id: "Int-4",
        subject: "Cloud Infrastructure Deployment Sync",
        type: "SLA Support Call",
        assignee: "Alex Rivera",
        status: "SCHEDULED",
        client: "Acme AI Systems",
        date: null, // Left null to show as a WAITING dependency on Gantt chart!
        summary: "Establish target containers inside AWS and complete secure token configurations.",
        tagIds: JSON.stringify(["checklist-cloud", "gt-ints-2"]),
        contactRoles: JSON.stringify({ "con-1": "Admin Access Owner" }),
        Note: "On hold until API Specification is fully accepted and completed.",
        PrevInteraction: "Int-3",
        duration: 120,
        engagementId: "eng-1",
        followUpDate: "2026-07-22",
        followUpNotes: "Prepare final verification walkthrough.",
        followUpCompleted: 0
      },
      {
        id: "Int-5",
        subject: "Security Compliance Walkthrough",
        type: "Code Review Sync",
        assignee: "System Administrator",
        status: "BLOCKED",
        client: "Acme AI Systems",
        date: null, // waiting/projected
        summary: "Formal sign-off of security and data privacy postures.",
        tagIds: JSON.stringify(["checklist-sec", "gt-ints-4"]),
        contactRoles: JSON.stringify({ "con-1": "Auditor" }),
        Note: "Blocked until cloud deployment token parameters are finalized.",
        PrevInteraction: "Int-4",
        duration: 60,
        engagementId: "eng-1",
        followUpDate: null,
        followUpNotes: null,
        followUpCompleted: 0
      },
      {
        id: "Int-6",
        subject: "BlockStream Technical MVP Alignment",
        type: "User Q&A Session",
        assignee: "Alex Rivera",
        status: "COMPLETED",
        client: "BlockStream Infra",
        date: "2026-07-06",
        summary: "Answered initial queries regarding data replication and network latencies.",
        tagIds: JSON.stringify(["gt-ints-3"]),
        contactRoles: JSON.stringify({ "con-2": "Key Contact" }),
        Note: "Solid validation. Bob was pleased.",
        PrevInteraction: null,
        duration: 45,
        engagementId: "eng-2",
        followUpDate: "2026-07-12",
        followUpNotes: "Perform sample database query load simulation.",
        followUpCompleted: 1
      },
      {
        id: "Int-7",
        subject: "Core Performance Simulation",
        type: "Code Review Sync",
        assignee: "Alex Rivera",
        status: "IN PROGRESS",
        client: "BlockStream Infra",
        date: "2026-07-12",
        summary: "Profiling validator nodes under various query workloads.",
        tagIds: JSON.stringify(["checklist-git", "gt-ints-1"]),
        contactRoles: JSON.stringify({ "con-2": "Primary Tester" }),
        Note: "Running performance simulations under high scale.",
        PrevInteraction: "Int-6",
        duration: 90,
        engagementId: "eng-2",
        followUpDate: "2026-07-19",
        followUpNotes: "Deliver integration results deck.",
        followUpCompleted: 0
      },
      {
        id: "Int-8",
        subject: "Novus Payments Database Handshake",
        type: "User Q&A Session",
        assignee: "David Jenkins",
        status: "SCHEDULED",
        client: "Novus FinTech",
        date: "2026-07-15",
        summary: "Establishing schema connections and access tokens.",
        tagIds: JSON.stringify(["gt-ints-2"]),
        contactRoles: JSON.stringify({ "con-3": "Product Owner" }),
        Note: "Scheduled session to establish structural interface mappings.",
        PrevInteraction: null,
        duration: 60,
        engagementId: "eng-3",
        followUpDate: "2026-07-20",
        followUpNotes: "Define audit checklists.",
        followUpCompleted: 0
      },
      {
        id: "Int-9",
        subject: "CyberShield Initial Discovery Meeting",
        type: "User Q&A Session",
        assignee: "Alex Rivera",
        status: "COMPLETED",
        client: "CyberShield Tech",
        date: "2026-07-02",
        summary: "Identified core pain points with CyberShield SaaS logging architecture and access management structures.",
        tagIds: JSON.stringify(["gt-ints-3"]),
        contactRoles: JSON.stringify({ "con-4": "Primary Contact" }),
        Note: "Diana was impressed with response times and wants to schedule architecture sync.",
        PrevInteraction: null,
        duration: 30,
        engagementId: "eng-4",
        followUpDate: "2026-07-09",
        followUpNotes: "Conduct SecOps Integration Blueprint Sync",
        followUpCompleted: 1
      },
      {
        id: "Int-10",
        subject: "SecOps Integration Blueprint Sync",
        type: "Architecture Pitch",
        assignee: "David Jenkins",
        status: "IN PROGRESS",
        client: "CyberShield Tech",
        date: "2026-07-09",
        summary: "Mapping unified access clusters inside VPC security boundaries.",
        tagIds: JSON.stringify(["gt-ints-1"]),
        contactRoles: JSON.stringify({ "con-4": "Architect Champion" }),
        Note: "Currently updating schemas based on Diana's hardware constraints.",
        PrevInteraction: "Int-9",
        duration: 60,
        engagementId: "eng-4",
        followUpDate: "2026-07-16",
        followUpNotes: "Execute production simulation trial dry run.",
        followUpCompleted: 0
      },
      {
        id: "Int-11",
        subject: "Production Simulation Trial Run",
        type: "Code Review Sync",
        assignee: "David Jenkins",
        status: "SCHEDULED",
        client: "CyberShield Tech",
        date: null, // waiting
        summary: "Executing mock workload simulations across multiple geographically isolated node sets.",
        tagIds: JSON.stringify(["gt-ints-2"]),
        contactRoles: JSON.stringify({ "con-4": "Tester" }),
        Note: "Projected to automatically activate in chronological pipeline once Blueprint Sync is complete.",
        PrevInteraction: "Int-10",
        duration: 90,
        engagementId: "eng-4",
        followUpDate: null,
        followUpNotes: null,
        followUpCompleted: 0
      },
      {
        id: "Int-12",
        subject: "Apex AI Model Engagement Alignment",
        type: "User Q&A Session",
        assignee: "David Jenkins",
        status: "COMPLETED",
        client: "Apex Algorithmic",
        date: "2026-07-11",
        summary: "Strategic brief regarding proprietary model compliance, NDA parameters, and licensing terms.",
        tagIds: JSON.stringify(["checklist-nda", "gt-ints-3"]),
        contactRoles: JSON.stringify({ "con-6": "Key Executive" }),
        Note: "Strategic account NDA successfully resolved. Highly confidential parameters established.",
        PrevInteraction: null,
        duration: 60,
        engagementId: "eng-5",
        followUpDate: "2026-07-18",
        followUpNotes: "Initiate Model Throughtput Optimization Profiling",
        followUpCompleted: 1
      },
      {
        id: "Int-13",
        subject: "Apex Model Throughput Optimization Profile",
        type: "Code Review Sync",
        assignee: "Alex Rivera",
        status: "SCHEDULED",
        client: "Apex Algorithmic",
        date: null, // waiting
        summary: "Audit performance clusters, mapping token pipeline rates.",
        tagIds: JSON.stringify(["gt-ints-2"]),
        contactRoles: JSON.stringify({ "con-6": "Product Specialist" }),
        Note: "Confidential setup. Requires Senior oversight before go-live sync.",
        PrevInteraction: "Int-12",
        duration: 120,
        engagementId: "eng-5",
        followUpDate: "2026-07-25",
        followUpNotes: "Final summary dashboard delivery",
        followUpCompleted: 0
      },
      {
        id: "Int-14",
        subject: "BlockStream Security Hardening Audit",
        type: "Code Review Sync",
        assignee: "Alex Rivera",
        status: "SCHEDULED",
        client: "BlockStream Infra",
        date: null, // waiting for Int-7 (Core Performance Simulation)
        summary: "Audit cluster authentication logic, credential rotations, and encrypted token layers.",
        tagIds: JSON.stringify(["gt-ints-2"]),
        contactRoles: JSON.stringify({ "con-2": "Lead Developer" }),
        Note: "Waiting for Int-7 simulation profile reports.",
        PrevInteraction: "Int-7",
        duration: 90,
        engagementId: "eng-2",
        followUpDate: "2026-07-24",
        followUpNotes: "Conduct actual mirror deploy validation.",
        followUpCompleted: 0
      },
      {
        id: "Int-15",
        subject: "BlockStream Validator Orchestrator Launch",
        type: "SLA Support Call",
        assignee: "Alex Rivera",
        status: "SCHEDULED",
        client: "BlockStream Infra",
        date: null, // waiting for Int-14
        summary: "Full orchestrator deployment on target production instances with live traffic.",
        tagIds: JSON.stringify(["checklist-cloud", "gt-ints-2"]),
        contactRoles: JSON.stringify({ "con-2": "Primary Operator" }),
        Note: "Projected workflow node following security hardening certification.",
        PrevInteraction: "Int-14",
        duration: 120,
        engagementId: "eng-2",
        followUpDate: "2026-07-30",
        followUpNotes: "SLA onboarding complete.",
        followUpCompleted: 0
      },
      {
        id: "Int-16",
        subject: "Novus Payments Security & Gateway Advisory",
        type: "Architecture Pitch",
        assignee: "David Jenkins",
        status: "SCHEDULED",
        client: "Novus FinTech",
        date: null, // waiting for Int-8 (Novus Payments Database Handshake)
        summary: "Detailed review of secure transaction token paths and sandbox merchant key isolation.",
        tagIds: JSON.stringify(["gt-ints-2"]),
        contactRoles: JSON.stringify({ "con-3": "Product Owner" }),
        Note: "Waiting for completion of database handshake verification.",
        PrevInteraction: "Int-8",
        duration: 60,
        engagementId: "eng-3",
        followUpDate: null,
        followUpNotes: null,
        followUpCompleted: 0
      },
      {
        id: "Int-17",
        subject: "Novus Settlement Ledger Verification Sync",
        type: "Code Review Sync",
        assignee: "Alex Rivera",
        status: "SCHEDULED",
        client: "Novus FinTech",
        date: null, // waiting for Int-16
        summary: "Verifying transactional state outputs and auditing balance ledgers against raw database tables.",
        tagIds: JSON.stringify(["gt-ints-2"]),
        contactRoles: JSON.stringify({ "con-3": "Reviewer" }),
        Note: "Will occur automatically after gateway compliance is approved.",
        PrevInteraction: "Int-16",
        duration: 60,
        engagementId: "eng-3",
        followUpDate: null,
        followUpNotes: null,
        followUpCompleted: 0
      },
      {
        id: "Int-18",
        subject: "ZettaByte Cold-Tier Backup Design Sync",
        type: "User Q&A Session",
        assignee: "Alex Rivera",
        status: "COMPLETED",
        client: "ZettaByte Storage",
        date: "2026-07-05",
        summary: "Discussed S3 cold-storage access control guidelines and cost-saving metrics.",
        tagIds: JSON.stringify(["gt-ints-3"]),
        contactRoles: JSON.stringify({ "con-5": "Technical Liaison" }),
        Note: "Evan approved the overall high-level S3 archive diagrams.",
        PrevInteraction: null,
        duration: 45,
        engagementId: null,
        followUpDate: "2026-07-12",
        followUpNotes: "Construct prototype S3 verification loops.",
        followUpCompleted: 1
      },
      {
        id: "Int-19",
        subject: "ZettaByte S3 Cluster Prototype Verification",
        type: "Code Review Sync",
        assignee: "Alex Rivera",
        status: "IN PROGRESS",
        client: "ZettaByte Storage",
        date: "2026-07-12",
        summary: "Establishing local cluster nodes and compiling latency graphs.",
        tagIds: JSON.stringify(["gt-ints-1"]),
        contactRoles: JSON.stringify({ "con-5": "Liaison" }),
        Note: "Working closely with Evan's local team to verify credentials.",
        PrevInteraction: "Int-18",
        duration: 90,
        engagementId: null,
        followUpDate: "2026-07-20",
        followUpNotes: "Execute heavy load replica dry-run checks.",
        followUpCompleted: 0
      },
      {
        id: "Int-20",
        subject: "ZettaByte Mass Replication Test Dry Run",
        type: "SLA Support Call",
        assignee: "Alex Rivera",
        status: "SCHEDULED",
        client: "ZettaByte Storage",
        date: null, // waiting for Int-19
        summary: "Running multi-terabyte dataset simulation to calculate recovery metrics.",
        tagIds: JSON.stringify(["gt-ints-2"]),
        contactRoles: JSON.stringify({ "con-5": "Observer" }),
        Note: "Waiting for prototype node to achieve stable heartbeat status.",
        PrevInteraction: "Int-19",
        duration: 180,
        engagementId: null,
        followUpDate: "2026-07-27",
        followUpNotes: "Prepare final mirror cut-over checklist.",
        followUpCompleted: 0
      },
      {
        id: "Int-21",
        subject: "ZettaByte Production Mirror Cutover",
        type: "Architecture Pitch",
        assignee: "David Jenkins",
        status: "SCHEDULED",
        client: "ZettaByte Storage",
        date: null, // waiting for Int-20
        summary: "Direct traffic redirect to final S3-compatible cold tier.",
        tagIds: JSON.stringify(["checklist-cloud", "gt-ints-2"]),
        contactRoles: JSON.stringify({ "con-5": "VP Ops" }),
        Note: "Requires full administrative oversight before DNS changes.",
        PrevInteraction: "Int-20",
        duration: 60,
        engagementId: null,
        followUpDate: null,
        followUpNotes: null,
        followUpCompleted: 0
      }
    ];

    const intStmt = db.prepare(`
      INSERT INTO interactions (id, subject, type, assignee, status, client, date, summary, tagIds, contactRoles, Note, PrevInteraction, duration, engagementId, followUpDate, followUpNotes, followUpCompleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const i of seedInteractions) {
      intStmt.run(
        i.id,
        i.subject,
        i.type,
        i.assignee,
        i.status,
        i.client,
        i.date,
        i.summary,
        i.tagIds,
        i.contactRoles,
        i.Note,
        i.PrevInteraction,
        i.duration,
        i.engagementId,
        i.followUpDate,
        i.followUpNotes,
        i.followUpCompleted
      );
    }

    // 7. Seed Notes
    const seedNotes = [
      {
        id: "note-1",
        content: "Acme AI Systems NDA signed by CEO and legal counsel. Ready to commence technical onboarding.",
        createdAt: "2026-07-01T10:00:00Z",
        author: "david@enterprise.com",
        linkedToType: "interaction",
        linkedToId: "Int-1",
        pinned: 1,
        Subject: "Acme Legal Signoff",
        visibility: "Public"
      },
      {
        id: "note-2",
        content: "Alice Vance requested specific AWS token format for container setup. Refer to AWS secrets manager configuration guide v2.",
        createdAt: "2026-07-08T14:30:00Z",
        author: "alex@enterprise.com",
        linkedToType: "interaction",
        linkedToId: "Int-3",
        pinned: 1,
        Subject: "Acme Token Format Notes",
        visibility: "Public"
      },
      {
        id: "note-3",
        content: "Contact Bob Carter is checking with the board on series B capital deployment schedules. Keep updated.",
        createdAt: "2026-07-06T11:15:00Z",
        author: "david@enterprise.com",
        linkedToType: "contact",
        linkedToId: "con-2",
        pinned: 0,
        Subject: "Investor Capital Alignment",
        visibility: "Team"
      },
      {
        id: "note-4",
        content: "ZettaByte team looking for cold-tier S3 backup support structures next week.",
        createdAt: "2026-07-05T09:00:00Z",
        author: "alex@enterprise.com",
        linkedToType: "entity",
        linkedToId: "ent-5",
        pinned: 1,
        Subject: "ZettaByte S3 Storage Request",
        visibility: "Public"
      },
      {
        id: "note-5",
        content: "CyberShield has extremely strict SOC2 compliance requirements. All blueprints must define encryption-at-rest explicitly inside the configurations.",
        createdAt: "2026-07-02T16:00:00Z",
        author: "david@enterprise.com",
        linkedToType: "engagement",
        linkedToId: "eng-4",
        pinned: 0,
        Subject: "CyberShield Compliance Constraint",
        visibility: "Team"
      },
      {
        id: "note-6",
        content: "Strategic: Apex Algorithmic models are optimized for GPU clusters. Ensure David manages this account alignment with Senior access tier credentials.",
        createdAt: "2026-07-11T12:00:00Z",
        author: "david@enterprise.com",
        linkedToType: "entity",
        linkedToId: "ent-7",
        pinned: 1,
        Subject: "Strategic Apex Account Isolation",
        visibility: "Private"
      }
    ];

    const noteStmt = db.prepare(`
      INSERT INTO notes (id, content, createdAt, author, linkedToType, linkedToId, pinned, Subject, visibility)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const n of seedNotes) {
      noteStmt.run(n.id, n.content, n.createdAt, n.author, n.linkedToType, n.linkedToId, n.pinned, n.Subject, n.visibility);
    }

    // 8. Seed Archive Documents
    const seedDocs = [
      {
        id: "doc-1",
        title: "Acme AI Systems Signed NDA",
        fileType: "Contract",
        fileSize: "1.4 MB",
        uploadedAt: "2026-07-01T10:05:00Z",
        linkedToType: "entity",
        linkedToId: "ent-1",
        tagIds: JSON.stringify(["checklist-nda"]),
        author: "david@enterprise.com",
        visibility: "Public"
      },
      {
        id: "doc-2",
        title: "Core API Architecture Spec v1.8",
        fileType: "PDF",
        fileSize: "4.2 MB",
        uploadedAt: "2026-07-05T09:00:00Z",
        linkedToType: "engagement",
        linkedToId: "eng-1",
        tagIds: JSON.stringify(["gt-dt-1"]),
        author: "alex@enterprise.com",
        visibility: "Public"
      },
      {
        id: "doc-3",
        title: "BlockStream Validator Setup Blueprint",
        fileType: "Briefing",
        fileSize: "880 KB",
        uploadedAt: "2026-07-10T11:00:00Z",
        linkedToType: "engagement",
        linkedToId: "eng-2",
        tagIds: JSON.stringify(["gt-dt-2"]),
        author: "alex@enterprise.com",
        visibility: "Public"
      },
      {
        id: "doc-4",
        title: "CyberShield Custom Integration Proposal",
        fileType: "PDF",
        fileSize: "2.1 MB",
        uploadedAt: "2026-07-03T11:00:00Z",
        linkedToType: "engagement",
        linkedToId: "eng-4",
        tagIds: JSON.stringify(["gt-dt-3"]),
        author: "david@enterprise.com",
        visibility: "Public"
      },
      {
        id: "doc-5",
        title: "Apex Algorithmic Architecture Pitch v2",
        fileType: "Briefing",
        fileSize: "5.8 MB",
        uploadedAt: "2026-07-12T14:00:00Z",
        linkedToType: "engagement",
        linkedToId: "eng-5",
        tagIds: JSON.stringify(["gt-dt-2"]),
        author: "david@enterprise.com",
        visibility: "Private"
      }
    ];

    const docStmt = db.prepare(`
      INSERT INTO documents (id, title, fileType, fileSize, uploadedAt, linkedToType, linkedToId, tagIds, author, visibility)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const d of seedDocs) {
      docStmt.run(d.id, d.title, d.fileType, d.fileSize, d.uploadedAt, d.linkedToType, d.linkedToId, d.tagIds, d.author, d.visibility);
    }
    console.log("🏆 DATABASE RESET & SEED COMPLETED: Successfully injected default admin, users, grouped tags, entities, contacts, engagements, interdependent processes, docs, and notes starting July 1st!");
  } catch (seedErr: any) {
    console.error("❌ SQLITE SYSTEM SEEDING FAILURE:", seedErr.message);
  }

  // DB Startup and Migration Integrity Analysis
  try {
    const totalUsers = (db.prepare("SELECT count(*) as count FROM users").get() as any).count;
    const totalTags = (db.prepare("SELECT count(*) as count FROM tags").get() as any).count;
    const totalNotes = (db.prepare("SELECT count(*) as count FROM notes").get() as any).count;
    const totalDocs = (db.prepare("SELECT count(*) as count FROM documents").get() as any).count;
    const totalInteractions = (db.prepare("SELECT count(*) as count FROM interactions").get() as any).count;
    const totalContacts = (db.prepare("SELECT count(*) as count FROM contacts").get() as any).count;
    const totalEntities = (db.prepare("SELECT count(*) as count FROM entities").get() as any).count;
    const totalEngagements = (db.prepare("SELECT count(*) as count FROM engagements").get() as any).count;
    const totalNotifications = (db.prepare("SELECT count(*) as count FROM notifications").get() as any).count;
    const totalAuditLogs = (db.prepare("SELECT count(*) as count FROM audit_logs").get() as any).count;

    console.log("================================================================================");
    console.log("⚡ ENGINE STANDBY: SQLITE DATABASE INITIALIZED & VERIFIED SUCCESSFULLY");
    console.log(`📂 DB File: database.db`);
    console.log(`👥 Users Tracked:       ${totalUsers} active operator seats`);
    console.log(`🏷️  Tags Registries:     ${totalTags} styles`);
    console.log(`📝 Logs / Notes:        ${totalNotes} indices`);
    console.log(`📎 Documents Index:     ${totalDocs} items`);
    console.log(`🔄 Tasks/Interactions:  ${totalInteractions} lines`);
    console.log(`👤 Contact Cards:       ${totalContacts} leads`);
    console.log(`🏢 Corporate Accounts:  ${totalEntities} registries`);
    console.log(`💼 Active Engagements:  ${totalEngagements} active initiatives`);
    console.log(`🔔 Notifications Total: ${totalNotifications} entries`);
    console.log(`📋 Audit Logs Rowcount: ${totalAuditLogs} items`);
    console.log("🛡️  INTEGRITY CHECKS: Primary schema migrations verified & executed safely.");
    console.log("================================================================================");
  } catch (err: any) {
    console.error("❌ SQLITE MIGRATION DIAGNOSTICS FAILURE:", err.message);
  }

  // WS clients set & broadcast notification helper
  const broadcastNotification = (notif: any) => {
    if (!wss) return;
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        const clientEmail = client.userEmail;
        const clientRole = client.userRole;

        // Skip broadcasting back to the user who triggered the event
        if (clientEmail === notif.actionUserEmail) {
          return;
        }

        // Permissions check: If tier is Strategic, only Senior Analyst role views it
        if (notif.entityTier === "Strategic" && clientRole !== "Senior Analyst") {
          return;
        }

        client.send(JSON.stringify({
          type: "NOTIFICATION_RECEIVED",
          data: {
            ...notif,
            isRead: 0
          }
        }));
      }
    });
  };

  const addNotification = (
    req: any,
    actionType: "create" | "update" | "delete",
    entityId: string,
    entityName: string,
    entityTier: string,
    message: string
  ) => {
    try {
      const actionUserEmail = req.headers["x-user-email"] || "system@enterprise.com";
      const actionUserName = req.headers["x-user-name"] || "System Operator";
      const id = "notif-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
      const createdAt = new Date().toISOString();

      db.prepare(`
        INSERT INTO notifications (id, actionUserEmail, actionUserName, actionType, entityId, entityName, entityTier, message, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, actionUserEmail, actionUserName, actionType, entityId, entityName, entityTier, message, createdAt);

      const notif = {
        id,
        actionUserEmail,
        actionUserName,
        actionType,
        entityId,
        entityName,
        entityTier,
        message,
        createdAt
      };

      broadcastNotification(notif);
    } catch (err) {
      console.error("Failed to insert and broadcast notification:", err);
    }
  };

  const addAuditLog = (
    req: any,
    actionType: "CREATE" | "UPDATE" | "DELETE" | "BATCH_DELETE" | "BATCH_UPDATE",
    targetType: "Entity" | "Contact" | "Interaction" | "Engagement" | "Note" | "Document" | "User" | "Tag",
    targetId: string,
    targetName: string,
    details: string
  ) => {
    try {
      const userEmail = req.headers["x-user-email"] || "system@enterprise.com";
      const userName = req.headers["x-user-name"] || "System Operator";
      const userRole = req.headers["x-user-role"] || "Operator Unit";
      const id = "audit-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
      const timestamp = new Date().toISOString();

      db.prepare(`
        INSERT INTO audit_logs (id, userEmail, userName, userRole, actionType, targetType, targetId, targetName, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, userEmail, userName, userRole, actionType, targetType, targetId, targetName, details, timestamp);
    } catch (err) {
      console.error("Failed to insert audit log:", err);
    }
  };

  // API Endpoints: GET ALL STATE
  app.get("/api/all", (req, res) => {
    try {
      const users = db.prepare("SELECT * FROM users").all();
      const tags = db.prepare("SELECT * FROM tags").all();
      const notes = db.prepare("SELECT * FROM notes").all();
      const docs = db.prepare("SELECT * FROM documents").all().map((d: any) => ({
        ...d,
        tagIds: d.tagIds ? JSON.parse(d.tagIds) : []
      }));
      const ints = db.prepare("SELECT * FROM interactions").all().map((i: any) => ({
        ...i,
        tagIds: i.tagIds ? JSON.parse(i.tagIds) : [],
        contactRoles: i.contactRoles ? JSON.parse(i.contactRoles) : {},
        followUpCompleted: i.followUpCompleted === 1
      }));
      const contacts = db.prepare("SELECT * FROM contacts").all().map((c: any) => ({
        ...c,
        tagIds: c.tagIds ? JSON.parse(c.tagIds) : []
      }));
      const entities = db.prepare("SELECT * FROM entities").all().map((e: any) => ({
        ...e,
        tagIds: e.tagIds ? JSON.parse(e.tagIds) : []
      }));
      const engagements = db.prepare("SELECT * FROM engagements").all().map((g: any) => ({
        ...g,
        tagIds: g.tagIds ? JSON.parse(g.tagIds) : []
      }));

      res.json({
        systemUsers: users,
        tags,
        notes,
        documents: docs,
        interactions: ints,
        contacts,
        entities,
        engagements
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Users Mutator
  app.post("/api/users", (req, res) => {
    try {
      const { email, passwordHash, name, role, suspended } = req.body;
      const requestRole = req.headers["x-user-role"] || "";

      // Strict enforcement: Only Senior Analyst (Administrator) can register or assign the System Administrator role
      if (role === "Senior Analyst" && requestRole !== "Senior Analyst") {
        return res.status(403).json({ error: "Access Denied: Only a Senior Analyst can register or assign the System Administrator role." });
      }

      db.prepare("INSERT OR REPLACE INTO users (email, passwordHash, name, role, suspended) VALUES (?, ?, ?, ?, ?)").run(email, passwordHash, name, role, suspended ?? 0);
      addAuditLog(req, "CREATE", "User", email, name, `Registered or re-created operator user with role: ${role}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/users", (req, res) => {
    try {
      const { email, passwordHash, name, role, suspended } = req.body;
      const requestRole = req.headers["x-user-role"] || "";

      // Strict enforcement: Only Senior Analyst can assign the System Administrator role
      if (role === "Senior Analyst" && requestRole !== "Senior Analyst") {
        return res.status(403).json({ error: "Access Denied: Only a Senior Analyst can assign the System Administrator role." });
      }

      db.prepare("UPDATE users SET passwordHash = ?, name = ?, role = ?, suspended = ? WHERE email = ?").run(passwordHash, name, role, suspended ?? 0, email);
      addAuditLog(req, "UPDATE", "User", email, name, `Updated operator user profile, new role: ${role} (Suspended status: ${suspended ?? 0})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/users/:email/restore", (req, res) => {
    try {
      const u = db.prepare("SELECT * FROM users WHERE email = ?").get(req.params.email) as any;
      if (u) {
        db.prepare("UPDATE users SET suspended = 0 WHERE email = ?").run(req.params.email);
        addAuditLog(req, "UPDATE", "User", req.params.email, u.name || req.params.email, `Restored and reactivated operator seat`);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Operator not found" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/users/:email", (req, res) => {
    try {
      const u = db.prepare("SELECT * FROM users WHERE email = ?").get(req.params.email) as any;
      if (u) {
        db.prepare("UPDATE users SET suspended = 1 WHERE email = ?").run(req.params.email);
        addAuditLog(req, "DELETE", "User", req.params.email, u.name || req.params.email, `Soft-deleted / Suspended operator user`);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Operator not found" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/users/:email/permanent", (req, res) => {
    try {
      const requestRole = req.headers["x-user-role"] || "";
      if (requestRole !== "Senior Analyst") {
        return res.status(403).json({ error: "Access Denied: Only a Senior Analyst can permanently remove users." });
      }

      const u = db.prepare("SELECT * FROM users WHERE email = ?").get(req.params.email) as any;
      if (u) {
        db.prepare("DELETE FROM users WHERE email = ?").run(req.params.email);
        addAuditLog(req, "DELETE", "User", req.params.email, u.name || req.params.email, `Permanently removed auditor/operator account`);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Operator not found" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Tags Mutator
  app.post("/api/tags", (req, res) => {
    try {
      const { id, name, color, groupName } = req.body;
      db.prepare("INSERT OR REPLACE INTO tags (id, name, color, groupName) VALUES (?, ?, ?, ?)").run(id, name, color, groupName || null);
      addAuditLog(req, "CREATE", "Tag", id, name, `Created or updated tag in group '${groupName || 'general'}' with color: ${color}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/tags/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM tags WHERE id = ?").run(req.params.id);
      addAuditLog(req, "DELETE", "Tag", req.params.id, "N/A", `Deleted tag ID: ${req.params.id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Notes Mutator
  app.post("/api/notes", (req, res) => {
    try {
      const { id, content, createdAt, author, linkedToType, linkedToId, pinned, Subject, visibility } = req.body;
      db.prepare("INSERT OR REPLACE INTO notes (id, content, createdAt, author, linkedToType, linkedToId, pinned, Subject, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, content, createdAt, author, linkedToType, linkedToId, pinned ? 1 : 0, Subject || "", visibility || "Public");
      addAuditLog(req, "CREATE", "Note", id, content.substr(0, 30) + "...", `Created or updated note attachment (Pinned: ${!!pinned}, Visibility: ${visibility || "Public"}), linked to ${linkedToType} (#${linkedToId})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/notes/:id", (req, res) => {
    try {
      const n = db.prepare("SELECT * FROM notes WHERE id = ?").get(req.params.id) as any;
      db.prepare("DELETE FROM notes WHERE id = ?").run(req.params.id);
      if (n) {
        addAuditLog(req, "DELETE", "Note", req.params.id, n.content.substr(0, 30) + "...", `Deleted notes entry belonging to ${n.linkedToType} (#${n.linkedToId})`);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Documents Mutator
  app.post("/api/documents", (req, res) => {
    try {
      const { id, title, fileType, fileSize, uploadedAt, linkedToType, linkedToId, tagIds, author, visibility } = req.body;
      db.prepare("INSERT OR REPLACE INTO documents (id, title, fileType, fileSize, uploadedAt, linkedToType, linkedToId, tagIds, author, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, title, fileType, fileSize, uploadedAt, linkedToType, linkedToId, JSON.stringify(tagIds || []), author || "System Operator", visibility || "Public");
      addAuditLog(req, "CREATE", "Document", id, title, `Uploaded ${fileType} document "${title}" (${fileSize}) linked to ${linkedToType} (Visibility: ${visibility || "Public"})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/documents/:id", (req, res) => {
    try {
      const { title, fileType, fileSize, tagIds, author, visibility } = req.body;
      db.prepare("UPDATE documents SET title = ?, fileType = ?, fileSize = ?, tagIds = ?, author = ?, visibility = ? WHERE id = ?").run(title, fileType, fileSize, JSON.stringify(tagIds || []), author || "System Operator", visibility || "Public", req.params.id);
      addAuditLog(req, "UPDATE", "Document", req.params.id, title, `Updated document "${title}" metadata (Visibility: ${visibility || "Public"})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/documents/:id", (req, res) => {
    try {
      const d = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id) as any;
      db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
      if (d) {
        addAuditLog(req, "DELETE", "Document", req.params.id, d.title, `Permanently purged secure archive file "${d.title}" from ${d.linkedToType}`);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Interactions Mutator
  app.post("/api/interactions", (req, res) => {
    try {
      const { id, subject, type, assignee, status, client, date, summary, tagIds, contactRoles, Note, PrevInteraction, followUpDate, followUpNotes, followUpCompleted, duration, engagementId } = req.body;
      const durationVal = (duration !== undefined && duration !== null && duration !== "") ? parseInt(duration) : null;
      db.prepare("INSERT OR REPLACE INTO interactions (id, subject, type, assignee, status, client, date, summary, tagIds, contactRoles, Note, PrevInteraction, followUpDate, followUpNotes, followUpCompleted, duration, engagementId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        id, subject, type, assignee, status, client, date, summary,
        JSON.stringify(tagIds || []), JSON.stringify(contactRoles || {}), Note || "", PrevInteraction || null,
        followUpDate || null, followUpNotes || null, followUpCompleted ? 1 : 0, durationVal, engagementId || null
      );
      addAuditLog(req, "CREATE", "Interaction", id, subject, `Created contact/client interaction "${subject}" with client "${client}"`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/interactions/:id", (req, res) => {
    try {
      const { subject, type, assignee, status, client, date, summary, tagIds, contactRoles, Note, PrevInteraction, followUpDate, followUpNotes, followUpCompleted, duration, engagementId } = req.body;
      const durationVal = (duration !== undefined && duration !== null && duration !== "") ? parseInt(duration) : null;
      db.prepare("UPDATE interactions SET subject = ?, type = ?, assignee = ?, status = ?, client = ?, date = ?, summary = ?, tagIds = ?, contactRoles = ?, Note = ?, PrevInteraction = ?, followUpDate = ?, followUpNotes = ?, followUpCompleted = ?, duration = ?, engagementId = ? WHERE id = ?").run(
        subject, type, assignee, status, client, date, summary,
        JSON.stringify(tagIds || []), JSON.stringify(contactRoles || {}), Note || "", PrevInteraction || null,
        followUpDate || null, followUpNotes || null, followUpCompleted ? 1 : 0, durationVal, engagementId || null, req.params.id
      );
      addAuditLog(req, "UPDATE", "Interaction", req.params.id, subject, `Updated interaction "${subject}" attributes (Status: ${status}, Assignee: ${assignee})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/interactions/:id", (req, res) => {
    try {
      const i = db.prepare("SELECT * FROM interactions WHERE id = ?").get(req.params.id) as any;
      db.prepare("DELETE FROM interactions WHERE id = ?").run(req.params.id);
      if (i) {
        addAuditLog(req, "DELETE", "Interaction", req.params.id, i.subject, `Purged interaction ledger entry for "${i.subject}"`);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Contacts Mutator
  app.post("/api/contacts", (req, res) => {
    try {
      const { id, name, role, company, email, phone, tagIds, FirstName, MiddleName, Lastname, LinkedInURL, Ratting, updatedAt } = req.body;
      const now = updatedAt || new Date().toISOString();
      db.prepare("INSERT OR REPLACE INTO contacts (id, name, role, company, email, phone, tagIds, FirstName, MiddleName, Lastname, LinkedInURL, Ratting, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, name, role, company, email, phone, JSON.stringify(tagIds || []), FirstName || "", MiddleName || "", Lastname || "", LinkedInURL || "", typeof Ratting === 'number' ? Ratting : null, now);
      addAuditLog(req, "CREATE", "Contact", id, name, `Registered contact "${name}" (${role} at ${company})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/contacts/:id", (req, res) => {
    try {
      const { name, role, company, email, phone, tagIds, FirstName, MiddleName, Lastname, LinkedInURL, Ratting } = req.body;
      const now = new Date().toISOString();
      db.prepare("UPDATE contacts SET name = ?, role = ?, company = ?, email = ?, phone = ?, tagIds = ?, FirstName = ?, MiddleName = ?, Lastname = ?, LinkedInURL = ?, Ratting = ?, updatedAt = ? WHERE id = ?").run(name, role, company, email, phone, JSON.stringify(tagIds || []), FirstName || "", MiddleName || "", Lastname || "", LinkedInURL || "", typeof Ratting === 'number' ? Ratting : null, now, req.params.id);
      addAuditLog(req, "UPDATE", "Contact", req.params.id, name, `Modified information for contact "${name}" (${role} at ${company})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/contacts/:id", (req, res) => {
    try {
      const c = db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id) as any;
      db.prepare("DELETE FROM contacts WHERE id = ?").run(req.params.id);
      if (c) {
        addAuditLog(req, "DELETE", "Contact", req.params.id, c.name, `Deleted contact profile for "${c.name}" (${c.role} at ${c.company})`);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Entities Mutator
  app.post("/api/entities", (req, res) => {
    try {
      const { id, name, industry, tier, location, tagIds, AddressLine_1, AddressLine_2, Postalcode, City, Website, Rating } = req.body;
      db.prepare("INSERT OR REPLACE INTO entities (id, name, industry, tier, location, tagIds, AddressLine_1, AddressLine_2, Postalcode, City, Website, Rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, name, industry, tier, location, JSON.stringify(tagIds || []), AddressLine_1 || "", AddressLine_2 || "", Postalcode || "", City || "", Website || "", typeof Rating === 'number' ? Rating : null);
      
      const userName = req.headers["x-user-name"] || "System Operator";
      addNotification(
        req,
        "create",
        id,
        name,
        tier,
        `${userName} created corporate organization "${name}" (${tier} Account)`
      );
      addAuditLog(req, "CREATE", "Entity", id, name, `Created corporate organization "${name}" (${tier} account under ${industry} classification)`);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/entities/:id", (req, res) => {
    try {
      const { name, industry, tier, location, tagIds, AddressLine_1, AddressLine_2, Postalcode, City, Website, Rating } = req.body;
      db.prepare("UPDATE entities SET name = ?, industry = ?, tier = ?, location = ?, tagIds = ?, AddressLine_1 = ?, AddressLine_2 = ?, Postalcode = ?, City = ?, Website = ?, Rating = ? WHERE id = ?").run(name, industry, tier, location, JSON.stringify(tagIds || []), AddressLine_1 || "", AddressLine_2 || "", Postalcode || "", City || "", Website || "", typeof Rating === 'number' ? Rating : null, req.params.id);
      
      const userName = req.headers["x-user-name"] || "System Operator";
      addNotification(
        req,
        "update",
        req.params.id,
        name,
        tier,
        `${userName} updated corporate organization "${name}" (${tier} Account)`
      );
      addAuditLog(req, "UPDATE", "Entity", req.params.id, name, `Modified corporate organization characteristics for "${name}" (Tier: ${tier})`);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/entities/:id", (req, res) => {
    try {
      const ent = db.prepare("SELECT * FROM entities WHERE id = ?").get(req.params.id) as any;
      db.prepare("DELETE FROM entities WHERE id = ?").run(req.params.id);
      
      if (ent) {
        const userName = req.headers["x-user-name"] || "System Operator";
        addNotification(
          req,
          "delete",
          req.params.id,
          ent.name,
          ent.tier,
          `${userName} removed corporate organization "${ent.name}" (${ent.tier} Account)`
        );
        addAuditLog(req, "DELETE", "Entity", req.params.id, ent.name, `Removed corporate organization registry for "${ent.name}" (${ent.tier} Account)`);
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Engagements Mutator
  app.post("/api/engagements", (req, res) => {
    try {
      const { id, title, client, type, startDate, endDate, status, description, tagIds } = req.body;
      db.prepare("INSERT OR REPLACE INTO engagements (id, title, client, type, startDate, endDate, status, description, tagIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, title, client, type, startDate, endDate, status, description, JSON.stringify(tagIds || []));
      addAuditLog(req, "CREATE", "Engagement", id, title, `Activated brand engagement unit "${title}" with client "${client}" (${type} model)`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/engagements/:id", (req, res) => {
    try {
      const { title, client, type, startDate, endDate, status, description, tagIds } = req.body;
      db.prepare("UPDATE engagements SET title = ?, client = ?, type = ?, startDate = ?, endDate = ?, status = ?, description = ?, tagIds = ? WHERE id = ?").run(title, client, type, startDate, endDate, status, description, JSON.stringify(tagIds || []), req.params.id);
      addAuditLog(req, "UPDATE", "Engagement", req.params.id, title, `Modified brand engagement structure for "${title}" (Status set to ${status})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/engagements/:id", (req, res) => {
    try {
      const eg = db.prepare("SELECT * FROM engagements WHERE id = ?").get(req.params.id) as any;
      db.prepare("DELETE FROM engagements WHERE id = ?").run(req.params.id);
      if (eg) {
        addAuditLog(req, "DELETE", "Engagement", req.params.id, eg.title, `Archived or removed brand engagement "${eg.title}" belonging to client "${eg.client}"`);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- BATCH OPERATIONAL ENDPOINTS ---
  app.post("/api/interactions/batch-delete", (req: any, res: any) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Missing ids array" });
      }
      const placeholders = ids.map(() => "?").join(",");
      db.prepare(`DELETE FROM interactions WHERE id IN (${placeholders})`).run(...ids);
      addAuditLog(req, "BATCH_DELETE", "Interaction", ids.join(", "), `${ids.length} records`, `Performed bulk deletion on ${ids.length} interaction(s)`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/interactions/batch-update-status", (req: any, res: any) => {
    try {
      const { ids, status } = req.body;
      if (!Array.isArray(ids) || ids.length === 0 || !status) {
        return res.status(400).json({ error: "Missing ids or status" });
      }
      const placeholders = ids.map(() => "?").join(",");
      db.prepare(`UPDATE interactions SET status = ? WHERE id IN (${placeholders})`).run(status, ...ids);
      addAuditLog(req, "BATCH_UPDATE", "Interaction", ids.join(", "), `${ids.length} records`, `Bulk modified ${ids.length} interaction(s) status to ${status}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/contacts/batch-delete", (req: any, res: any) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Missing ids array" });
      }
      const placeholders = ids.map(() => "?").join(",");
      db.prepare(`DELETE FROM contacts WHERE id IN (${placeholders})`).run(...ids);
      addAuditLog(req, "BATCH_DELETE", "Contact", ids.join(", "), `${ids.length} records`, `Performed bulk profile purge on ${ids.length} contacts`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/contacts/batch-update-role", (req: any, res: any) => {
    try {
      const { ids, role } = req.body;
      if (!Array.isArray(ids) || ids.length === 0 || !role) {
        return res.status(400).json({ error: "Missing ids or role" });
      }
      const placeholders = ids.map(() => "?").join(",");
      const now = new Date().toISOString();
      db.prepare(`UPDATE contacts SET role = ?, updatedAt = ? WHERE id IN (${placeholders})`).run(role, now, ...ids);
      addAuditLog(req, "BATCH_UPDATE", "Contact", ids.join(", "), `${ids.length} records`, `Bulk refactored role metadata for ${ids.length} contacts to: ${role}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/contacts/batch-update-company", (req: any, res: any) => {
    try {
      const { ids, company } = req.body;
      if (!Array.isArray(ids) || ids.length === 0 || !company) {
        return res.status(400).json({ error: "Missing ids or company" });
      }
      const placeholders = ids.map(() => "?").join(",");
      const now = new Date().toISOString();
      db.prepare(`UPDATE contacts SET company = ?, updatedAt = ? WHERE id IN (${placeholders})`).run(company, now, ...ids);
      addAuditLog(req, "BATCH_UPDATE", "Contact", ids.join(", "), `${ids.length} records`, `Bulk updated employer organization for ${ids.length} contacts to: ${company}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // --- AUDIT SYSTEM ENDPOINTS ---
  app.get("/api/audit-logs", (req, res) => {
    try {
      const userRole = (req.headers["x-user-role"] as string) || "";
      if (userRole !== "Senior Analyst") {
        return res.status(403).json({ error: "Access Denied: Administrative Clearance Required" });
      }

      const logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC").all();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/audit-logs/purge", (req, res) => {
    try {
      const userRole = (req.headers["x-user-role"] as string) || "";
      if (userRole !== "Senior Analyst") {
        return res.status(403).json({ error: "Access Denied: Administrative Clearance Required" });
      }

      db.prepare("DELETE FROM audit_logs").run();
      addAuditLog(req, "DELETE", "Tag", "all", "Audit Ledger", "Purged entire system audit trails to lock workspace activity history");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // --- NOTIFICATIONS SYSTEM ENDPOINTS ---
  app.get("/api/notifications", (req, res) => {
    try {
      const userEmail = (req.headers["x-user-email"] as string) || "";
      const userRole = (req.headers["x-user-role"] as string) || "";

      const rows = db.prepare(`
        SELECT n.*, 
               CASE WHEN nr.notificationId IS NOT NULL THEN 1 ELSE 0 END as isRead
        FROM notifications n
        LEFT JOIN notification_reads nr ON n.id = nr.notificationId AND nr.userEmail = ?
        ORDER BY n.createdAt DESC
      `).all(userEmail) as any[];

      // Filter by permissions
      const visibleRows = rows.filter((r) => {
        if (r.entityTier === "Strategic" && userRole !== "Senior Analyst") {
          return false;
        }
        return true;
      });

      res.json(visibleRows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/notifications/read", (req: any, res: any) => {
    try {
      const userEmail = (req.headers["x-user-email"] as string) || "";
      const { notificationIds } = req.body;
      if (!Array.isArray(notificationIds)) {
        return res.status(400).json({ error: "Missing or invalid notificationIds array" });
      }

      const stmt = db.prepare("INSERT OR IGNORE INTO notification_reads (notificationId, userEmail) VALUES (?, ?)");
      for (const id of notificationIds) {
        stmt.run(id, userEmail);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/notifications/read-all", (req, res) => {
    try {
      const userEmail = (req.headers["x-user-email"] as string) || "";
      const userRole = (req.headers["x-user-role"] as string) || "";

      const rows = db.prepare("SELECT id, entityTier FROM notifications").all() as any[];
      const visibleIds = rows
        .filter((r) => !(r.entityTier === "Strategic" && userRole !== "Senior Analyst"))
        .map((r) => r.id);

      const stmt = db.prepare("INSERT OR IGNORE INTO notification_reads (notificationId, userEmail) VALUES (?, ?)");
      for (const id of visibleIds) {
        stmt.run(id, userEmail);
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // Vite development middleware vs Static Production files
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Setup WebSocket Server for real-time notifications
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws: any, req: any) => {
    try {
      const parameters = req.url ? parse(req.url, true).query : {};
      ws.userEmail = parameters.email || "";
      ws.userRole = parameters.role || "";
    } catch (e) {
      console.error("Error setting up WS client details:", e);
    }
  });
}

startServer();
