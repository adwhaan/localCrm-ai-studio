export interface CustomTag {
  id: string;
  name: string;
  color: "blue" | "red" | "emerald" | "amber" | "purple" | "indigo";
  groupName?: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  linkedToType: "interaction" | "contact" | "entity" | "document" | "engagement";
  linkedToId: string;
  pinned?: number | boolean;
  Subject: string;
  visibility?: "Private" | "Team" | "Public";
}

export interface Document {
  id: string;
  title: string;
  fileType: "PDF" | "Spreadsheet" | "Presentation" | "Contract" | "Briefing";
  fileSize: string;
  uploadedAt: string;
  linkedToType: "interaction" | "contact" | "entity" | "engagement";
  linkedToId: string;
  tagIds?: string[];
  author: string;
  visibility?: "Private" | "Team" | "Public";
}

export interface Engagement {
  id: string;
  title: string;
  client: string; // Associated corporate organization name
  type: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Pending Draft" | "Closed" | "Under Negotiation";
  description: string;
  tagIds?: string[];
}

export interface Interaction {
  id: string;
  subject: string;
  type: string;
  assignee: string;
  status: "IN PROGRESS" | "COMPLETED" | "SCHEDULED" | "BLOCKED" | "CANCELED";
  client: string; // Entity name
  date: string;
  summary: string;
  tagIds: string[];
  contactRoles?: Record<string, string>;
  Note?: string;
  PrevInteraction?: string | number | null;
  engagementId?: string | null;
  followUpDate?: string;
  followUpNotes?: string;
  followUpCompleted?: boolean;
  duration?: number | null;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string; // Entity name
  email?: string;
  phone?: string;
  tagIds?: string[];
  FirstName: string;
  MiddleName?: string;
  Lastname?: string;
  LinkedInURL?: string;
  Ratting?: number;
  updatedAt?: string;
}

export interface Entity {
  id: string;
  name: string;
  industry: string;
  tier: "Strategic" | "Enterprise" | "Key Account" | "Growth";
  location: string;
  tagIds?: string[];
  AddressLine_1?: string;
  AddressLine_2?: string;
  Postalcode?: string;
  City?: string;
  Website?: string;
  Rating?: number;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "error";
}

export interface Session {
  email: string;
  name: string;
  role: string;
}

export interface Notification {
  id: string;
  actionUserEmail: string;
  actionUserName: string;
  actionType: "create" | "update" | "delete";
  entityId: string;
  entityName: string;
  entityTier: string;
  message: string;
  createdAt: string;
  isRead: number;
}

export interface AuditLog {
  id: string;
  userEmail: string;
  userName: string;
  userRole: string;
  actionType: "CREATE" | "UPDATE" | "DELETE" | "BATCH_DELETE" | "BATCH_UPDATE";
  targetType: "Entity" | "Contact" | "Interaction" | "Engagement" | "Note" | "Document" | "User" | "Tag";
  targetId: string;
  targetName: string;
  details: string;
  timestamp: string;
}

export interface SystemUser {
  email: string;
  name: string;
  role: string;
  suspended?: number | boolean;
}
