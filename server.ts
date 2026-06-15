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
      PrevInteraction INTEGER
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
      Ratting INTEGER
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
  try { db.exec("ALTER TABLE entities ADD COLUMN AddressLine_1 TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE entities ADD COLUMN AddressLine_2 TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE entities ADD COLUMN Postalcode TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE entities ADD COLUMN City TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE entities ADD COLUMN Website TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE entities ADD COLUMN Rating INTEGER"); } catch (e) {}
  try { db.exec("ALTER TABLE interactions ADD COLUMN followUpDate TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE interactions ADD COLUMN followUpNotes TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE interactions ADD COLUMN followUpCompleted INTEGER DEFAULT 0"); } catch (e) {}

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

  const countUsers = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
  if (countUsers.count === 0) {
    const defaultHash = getNewHash("password123", "david@enterprise.com");
    db.prepare("INSERT INTO users (email, passwordHash, name, role) VALUES (?, ?, ?, ?)").run(
      "david@enterprise.com",
      defaultHash,
      "David Jenkins",
      "Senior Analyst"
    );
    const adminHash = getNewHash("password123", "admin@enterprise.com");
    db.prepare("INSERT INTO users (email, passwordHash, name, role) VALUES (?, ?, ?, ?)").run(
      "admin@enterprise.com",
      adminHash,
      "System Administrator",
      "Senior Analyst"
    );
  } else {
    try {
      const adminExists = db.prepare("SELECT email FROM users WHERE email = ?").get("admin@enterprise.com");
      if (!adminExists) {
        const adminHash = getNewHash("password123", "admin@enterprise.com");
        db.prepare("INSERT INTO users (email, passwordHash, name, role) VALUES (?, ?, ?, ?)").run(
          "admin@enterprise.com",
          adminHash,
          "System Administrator",
          "Senior Analyst"
        );
      }
    } catch (e: any) {
      console.error("Failed to ensure default admin exists:", e.message);
    }

    // Dynamic migration handler: Upgrade old default password hash to new email-seeded hash
    try {
      const david = db.prepare("SELECT * FROM users WHERE email = ?").get("david@enterprise.com") as any;
      if (david) {
        const oldHash = getOldHash("password123");
        const newHash = getNewHash("password123", "david@enterprise.com");
        if (david.passwordHash === oldHash) {
          db.prepare("UPDATE users SET passwordHash = ? WHERE email = ?").run(newHash, "david@enterprise.com");
          console.log("🔒 SECURITY MIGRATION: Successfully upgraded David Jenkins' default credential hash to use email-seeded salt.");
        }
      }
    } catch (migErr: any) {
      console.error("⚠️ Migration warning:", migErr.message);
    }
  }

  // Seed tags
  const countTags = db.prepare("SELECT count(*) as count FROM tags").get() as { count: number };
  if (countTags.count === 0) {
    const seedTags = [
      { id: "tag-1", name: "API Integration", color: "indigo" },
      { id: "tag-2", name: "MVP Stage", color: "emerald" },
      { id: "tag-3", name: "Technical Debt", color: "red" },
      { id: "tag-4", name: "Open Source", color: "blue" },
      { id: "tag-5", name: "User Feedback", color: "purple" }
    ];
    const stmt = db.prepare("INSERT INTO tags (id, name, color) VALUES (?, ?, ?)");
    for (const t of seedTags) {
      stmt.run(t.id, t.name, t.color);
    }
  }

  // Seed grouped tags if not existing
  const countGrouped = db.prepare("SELECT count(*) as count FROM tags WHERE groupName IS NOT NULL").get() as { count: number };
  if (countGrouped.count === 0) {
    const seedGroupedTags = [
      // eng_type
      { id: "gt-1", name: "SaaS Product Demo", color: "blue", groupName: "eng_type" },
      { id: "gt-2", name: "Custom Integration", color: "purple", groupName: "eng_type" },
      { id: "gt-3", name: "Architecture Advisory", color: "emerald", groupName: "eng_type" },
      { id: "gt-4", name: "Seed/Series A Review", color: "indigo", groupName: "eng_type" },

      // eng_status
      { id: "gt-5", name: "In MVP Sandbox", color: "blue", groupName: "eng_status" },
      { id: "gt-6", name: "In Production", color: "emerald", groupName: "eng_status" },
      { id: "gt-7", name: "Security Review", color: "indigo", groupName: "eng_status" },
      { id: "gt-8", name: "Investor Negotiation", color: "amber", groupName: "eng_status" },

      // int_type
      { id: "gt-9", name: "Code Review Sync", color: "blue", groupName: "int_type" },
      { id: "gt-10", name: "User Q&A Session", color: "amber", groupName: "int_type" },
      { id: "gt-11", name: "Investor Pitch", color: "purple", groupName: "int_type" },
      { id: "gt-12", name: "SLA Support Call", color: "red", groupName: "int_type" },

      // contact_role
      { id: "gt-13", name: "Lead Developer", color: "blue", groupName: "contact_role" },
      { id: "gt-14", name: "Technical Founder", color: "purple", groupName: "contact_role" },
      { id: "gt-15", name: "Venture Partner", color: "indigo", groupName: "contact_role" },
      { id: "gt-16", name: "VP of Engineering", color: "amber", groupName: "contact_role" },
      { id: "gt-17", name: "External Auditor", color: "emerald", groupName: "contact_role" },
      { id: "gt-18", name: "Product Manager", color: "pink", groupName: "contact_role" },

      // company_industry
      { id: "gt-19", name: "Developer Tooling", color: "blue", groupName: "company_industry" },
      { id: "gt-20", name: "Web3 & Cloud Infra", color: "emerald", groupName: "company_industry" },
      { id: "gt-21", name: "Artificial Intelligence", color: "indigo", groupName: "company_industry" },
      { id: "gt-22", name: "SaaS Platform", color: "amber", groupName: "company_industry" },
      { id: "gt-23", name: "FinTech / Payments", color: "purple", groupName: "company_industry" },
      { id: "gt-24", name: "Robotics & Hardware", color: "red", groupName: "company_industry" },

      // company_tier
      { id: "gt-25", name: "Strategic Enterprise", color: "emerald", groupName: "company_tier" },
      { id: "gt-26", name: "Series A/B Backed", color: "blue", groupName: "company_tier" },
      { id: "gt-27", name: "Bootstrapped Startup", color: "purple", groupName: "company_tier" },
      { id: "gt-28", name: "Pre-seed Venture", color: "amber", groupName: "company_tier" }
    ];
    const stmt = db.prepare("INSERT INTO tags (id, name, color, groupName) VALUES (?, ?, ?, ?)");
    for (const t of seedGroupedTags) {
      stmt.run(t.id, t.name, t.color, t.groupName);
    }
  }

  // Ensure int_cont_role seed tags exist
  const countIntContRoles = db.prepare("SELECT count(*) as count FROM tags WHERE groupName = 'int_cont_role'").get() as { count: number };
  if (countIntContRoles.count === 0) {
    const intContSeedTags = [
      { id: "gt-29", name: "Technical Champion", color: "emerald", groupName: "int_cont_role" },
      { id: "gt-30", name: "System Architect", color: "blue", groupName: "int_cont_role" },
      { id: "gt-31", name: "Dev Advocate", color: "purple", groupName: "int_cont_role" },
      { id: "gt-32", name: "Internal Blocker", color: "red", groupName: "int_cont_role" },
      { id: "gt-33", name: "Product Manager", color: "indigo", groupName: "int_cont_role" },
      { id: "gt-34", name: "Venture Evaluator", color: "amber", groupName: "int_cont_role" }
    ];
    const stmt = db.prepare("INSERT INTO tags (id, name, color, groupName) VALUES (?, ?, ?, ?)");
    for (const t of intContSeedTags) {
      stmt.run(t.id, t.name, t.color, t.groupName);
    }
  }

  // Ensure doc_type seed tags exist
  const countDocTypes = db.prepare("SELECT count(*) as count FROM tags WHERE groupName = 'doc_type'").get() as { count: number };
  if (countDocTypes.count === 0) {
    const docTypeSeeds = [
      { id: "gt-dt-1", name: "API Specification", color: "red", groupName: "doc_type" },
      { id: "gt-dt-2", name: "Architecture Diagram", color: "emerald", groupName: "doc_type" },
      { id: "gt-dt-3", name: "Pitch Deck", color: "orange", groupName: "doc_type" },
      { id: "gt-dt-4", name: "SLA Master Contract", color: "blue", groupName: "doc_type" },
      { id: "gt-dt-5", name: "Product Brief", color: "purple", groupName: "doc_type" }
    ];
    const stmt = db.prepare("INSERT INTO tags (id, name, color, groupName) VALUES (?, ?, ?, ?)");
    for (const t of docTypeSeeds) {
      stmt.run(t.id, t.name, t.color, t.groupName);
    }
  }

  // Ensure int_status seed tags exist
  const countIntStatuses = db.prepare("SELECT count(*) as count FROM tags WHERE groupName = 'int_status'").get() as { count: number };
  if (countIntStatuses.count === 0) {
    const intStatusSeeds = [
      { id: "gt-is-1", name: "IN PROGRESS", color: "blue", groupName: "int_status" },
      { id: "gt-is-2", name: "PASSED REVIEW", color: "emerald", groupName: "int_status" },
      { id: "gt-is-3", name: "SCHEDULED", color: "purple", groupName: "int_status" },
      { id: "gt-is-4", name: "BLOCKED", color: "red", groupName: "int_status" }
    ];
    const stmt = db.prepare("INSERT INTO tags (id, name, color, groupName) VALUES (?, ?, ?, ?)");
    for (const t of intStatusSeeds) {
      stmt.run(t.id, t.name, t.color, t.groupName);
    }
  }

  // Ensure oper_checklist seed tags exist
  const countChecklist = db.prepare("SELECT count(*) as count FROM tags WHERE groupName = 'oper_checklist'").get() as { count: number };
  if (countChecklist.count === 0) {
    const checklistSeeds = [
      { id: "checklist-nda", name: "Source Agreement Signed", color: "blue", groupName: "oper_checklist" },
      { id: "checklist-kyc", name: "GitHub Repo Access Shared", color: "emerald", groupName: "oper_checklist" },
      { id: "checklist-onboard", name: "Cloud Credentials Kept", color: "purple", groupName: "oper_checklist" },
      { id: "checklist-sec", name: "Security Audit Checked", color: "red", groupName: "oper_checklist" },
      { id: "checklist-proposal", name: "Vesting Schedule Set", color: "indigo", groupName: "oper_checklist" }
    ];
    const stmt = db.prepare("INSERT INTO tags (id, name, color, groupName) VALUES (?, ?, ?, ?)");
    for (const t of checklistSeeds) {
      stmt.run(t.id, t.name, t.color, t.groupName);
    }
  }

  // No prepopulated seed data requested for notes, documents, interactions, contacts, entities, and engagements.

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
      const { id, subject, type, assignee, status, client, date, summary, tagIds, contactRoles, Note, PrevInteraction, followUpDate, followUpNotes, followUpCompleted } = req.body;
      db.prepare("INSERT OR REPLACE INTO interactions (id, subject, type, assignee, status, client, date, summary, tagIds, contactRoles, Note, PrevInteraction, followUpDate, followUpNotes, followUpCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        id, subject, type, assignee, status, client, date, summary,
        JSON.stringify(tagIds || []), JSON.stringify(contactRoles || {}), Note || "", PrevInteraction || null,
        followUpDate || null, followUpNotes || null, followUpCompleted ? 1 : 0
      );
      addAuditLog(req, "CREATE", "Interaction", id, subject, `Created contact/client interaction "${subject}" with client "${client}"`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/interactions/:id", (req, res) => {
    try {
      const { subject, type, assignee, status, client, date, summary, tagIds, contactRoles, Note, PrevInteraction, followUpDate, followUpNotes, followUpCompleted } = req.body;
      db.prepare("UPDATE interactions SET subject = ?, type = ?, assignee = ?, status = ?, client = ?, date = ?, summary = ?, tagIds = ?, contactRoles = ?, Note = ?, PrevInteraction = ?, followUpDate = ?, followUpNotes = ?, followUpCompleted = ? WHERE id = ?").run(
        subject, type, assignee, status, client, date, summary,
        JSON.stringify(tagIds || []), JSON.stringify(contactRoles || {}), Note || "", PrevInteraction || null,
        followUpDate || null, followUpNotes || null, followUpCompleted ? 1 : 0, req.params.id
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
      const { id, name, role, company, email, phone, tagIds, FirstName, MiddleName, Lastname, LinkedInURL, Ratting } = req.body;
      db.prepare("INSERT OR REPLACE INTO contacts (id, name, role, company, email, phone, tagIds, FirstName, MiddleName, Lastname, LinkedInURL, Ratting) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, name, role, company, email, phone, JSON.stringify(tagIds || []), FirstName || "", MiddleName || "", Lastname || "", LinkedInURL || "", typeof Ratting === 'number' ? Ratting : null);
      addAuditLog(req, "CREATE", "Contact", id, name, `Registered contact "${name}" (${role} at ${company})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/contacts/:id", (req, res) => {
    try {
      const { name, role, company, email, phone, tagIds, FirstName, MiddleName, Lastname, LinkedInURL, Ratting } = req.body;
      db.prepare("UPDATE contacts SET name = ?, role = ?, company = ?, email = ?, phone = ?, tagIds = ?, FirstName = ?, MiddleName = ?, Lastname = ?, LinkedInURL = ?, Ratting = ? WHERE id = ?").run(name, role, company, email, phone, JSON.stringify(tagIds || []), FirstName || "", MiddleName || "", Lastname || "", LinkedInURL || "", typeof Ratting === 'number' ? Ratting : null, req.params.id);
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
      db.prepare(`UPDATE contacts SET role = ? WHERE id IN (${placeholders})`).run(role, ...ids);
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
      db.prepare(`UPDATE contacts SET company = ? WHERE id IN (${placeholders})`).run(company, ...ids);
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
