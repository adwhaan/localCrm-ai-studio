import { Session, AuditLog, Notification } from "../types";

export interface ICrmApiService {
  setSession(session: Session | null): void;
  loadAuditLogs(): Promise<AuditLog[]>;
  purgeAuditLogs(): Promise<boolean>;
  loadSQLiteState(): Promise<any>;
  loadNotifications(): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<boolean>;
  markAllNotificationsAsRead(): Promise<boolean>;
  syncToServer(url: string, method: string, body?: any): Promise<boolean>;
  hashPassword(pwd: string, email: string): Promise<string>;
}

export class CrmApiService implements ICrmApiService {
  private session: Session | null = null;

  public setSession(session: Session | null): void {
    this.session = session;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.session) {
      headers["X-User-Email"] = this.session.email;
      headers["X-User-Name"] = this.session.name;
      headers["X-User-Role"] = this.session.role;
    }
    return headers;
  }

  public async loadAuditLogs(): Promise<AuditLog[]> {
    if (!this.session || this.session.role !== "Senior Analyst") return [];
    try {
      const res = await fetch("/api/audit-logs", {
        headers: this.getHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`Failed to load audit logs: ${res.statusText}`);
    } catch (e) {
      console.error("CRM Service Error [loadAuditLogs]:", e);
      return [];
    }
  }

  public async purgeAuditLogs(): Promise<boolean> {
    if (!this.session || this.session.role !== "Senior Analyst") return false;
    try {
      const res = await fetch("/api/audit-logs/purge", {
        method: "POST",
        headers: this.getHeaders()
      });
      return res.ok;
    } catch (e) {
      console.error("CRM Service Error [purgeAuditLogs]:", e);
      return false;
    }
  }

  public async loadSQLiteState(): Promise<any> {
    try {
      const res = await fetch("/api/all");
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`Failed to load full SQLite state: ${res.statusText}`);
    } catch (err) {
      console.error("CRM Service Error [loadSQLiteState]:", err);
      return null;
    }
  }

  public async loadNotifications(): Promise<Notification[]> {
    if (!this.session) return [];
    try {
      const res = await fetch("/api/notifications", {
        headers: this.getHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`Failed to load notifications: ${res.statusText}`);
    } catch (e) {
      console.error("CRM Service Error [loadNotifications]:", e);
      return [];
    }
  }

  public async markNotificationAsRead(id: string): Promise<boolean> {
    if (!this.session) return false;
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ notificationIds: [id] })
      });
      return res.ok;
    } catch (e) {
      console.error("CRM Service Error [markNotificationAsRead]:", e);
      return false;
    }
  }

  public async markAllNotificationsAsRead(): Promise<boolean> {
    if (!this.session) return false;
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: this.getHeaders()
      });
      return res.ok;
    } catch (e) {
      console.error("CRM Service Error [markAllNotificationsAsRead]:", e);
      return false;
    }
  }

  public async syncToServer(url: string, method: string, body?: any): Promise<boolean> {
    try {
      const res = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) {
        console.error("SQLite Sync Error:", await res.text());
        return false;
      }
      return true;
    } catch (e) {
      console.error("CRM Service Sync Failed:", e);
      return false;
    }
  }

  public async hashPassword(pwd: string, email: string): Promise<string> {
    let hash = 0;
    const userSeed = email.toLowerCase().trim();
    const salt = `_crm_salt_2026_${userSeed}_`;
    const salted = pwd + salt;
    for (let i = 0; i < salted.length; i++) {
      hash = (hash << 5) - hash + salted.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// Singleton instances can be default exported or injected
export const apiService = new CrmApiService();
export default apiService;
