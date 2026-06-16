import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AdminTagGroupsManager } from "./components/AdminTagGroupsManager";
import { GroupedTagDropdown, GroupedTagsInput } from "./components/GroupedTagInputs";
import { DateRangePicker } from "./components/DateRangePicker";
import { ContactsDashboard } from "./components/ContactsDashboard";
import { EntitiesDashboard } from "./components/EntitiesDashboard";
import { EntitiesMap } from "./components/EntitiesMap";
import { InteractionsDashboard } from "./components/InteractionsDashboard";
import { InterdependencyGantt } from "./components/InterdependencyGantt";
import { EngagementsDashboard } from "./components/EngagementsDashboard";
import {
  LayoutDashboard,
  Users,
  Building,
  Search,
  Bell,
  Plus,
  X,
  ChevronRight,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Pin,
  PinOff,
  Clock,
  Tag,
  FileText,
  Paperclip,
  Link,
  Lock,
  LogOut,
  ShieldCheck,
  Check,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Handshake,
  UserCheck,
  Briefcase,
  Notebook,
  Filter,
  ChevronDown,
  Calendar,
  LayoutGrid,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ShieldAlert,
  RefreshCw,
  SlidersHorizontal,
  History,
  Shield,
  Download,
  CheckSquare,
  Settings,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Edit3,
  ArrowUpDown
} from "lucide-react";

import {
  CustomTag,
  Note,
  Document,
  Engagement,
  Interaction,
  Contact,
  Entity,
  Toast,
  Notification,
  AuditLog,
  Session,
  SystemUser
} from "./types";

import {
  SEED_TAGS,
  SEED_NOTES,
  SEED_DOCUMENTS,
  SEED_INTERACTIONS,
  SEED_CONTACTS,
  SEED_ENTITIES,
  SEED_ENGAGEMENTS,
  ASSIGNEES,
  getThemeClasses,
  getDensityPadding
} from "./data";
import { apiService } from "./services/CrmApiService";

export default function App() {
  // Session State
  const [session, setSession] = useState<{ email: string; name: string; role: string } | null>(() => {
    const saved = localStorage.getItem("crm_active_session");
    return saved ? JSON.parse(saved) : null;
  });

  // User Profile, Notification Preferences, and UI state
  const [userProfileName, setUserProfileName] = useState(() => {
    const saved = localStorage.getItem("crm_active_session");
    if (saved) {
      try {
        return JSON.parse(saved).name || "";
      } catch (e) {}
    }
    return "";
  });

  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    const cached = localStorage.getItem("crm_notification_prefs");
    return cached ? JSON.parse(cached) : {
      emailAlerts: true,
      watchdogReminders: true,
      desktopNotifications: false,
      weeklyDigest: true,
      alertThresholdHours: 24,
      alertFrequency: "immediate"
    };
  });

  const [uiSettings, setUiSettings] = useState(() => {
    const cached = localStorage.getItem("crm_ui_settings");
    return cached ? JSON.parse(cached) : {
      theme: "slate", // "slate" | "charcoal" | "pitch-dark" | "amber-sepia"
      density: "cozy" // "compact" | "cozy" | "spacious"
    };
  });

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState("Auditor Seat");
  const [showPassword, setShowPassword] = useState(false);

  const clearAuthInputs = () => {
    setAuthEmail("");
    setAuthPassword("");
    setAuthConfirmPassword("");
    setAuthName("");
    setAuthRole("Auditor Seat");
    setShowPassword(false);
  };

  const [authScreen, _setAuthScreen] = useState<"login" | "signup" | "reset">("login");
  const setAuthScreen = (screen: "login" | "signup" | "reset") => {
    _setAuthScreen(screen);
    clearAuthInputs();
  };

  // Persistence States
  const [tags, setTags] = useState<CustomTag[]>(() => {
    const cached = localStorage.getItem("crm_tags");
    return cached ? JSON.parse(cached) : SEED_TAGS;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const cached = localStorage.getItem("crm_notes");
    return cached ? JSON.parse(cached) : SEED_NOTES;
  });

  const [documents, setDocuments] = useState<Document[]>(() => {
    const cached = localStorage.getItem("crm_documents");
    return cached ? JSON.parse(cached) : SEED_DOCUMENTS;
  });

  const [interactions, setInteractions] = useState<Interaction[]>(() => {
    const cached = localStorage.getItem("crm_interactions");
    return cached ? JSON.parse(cached) : SEED_INTERACTIONS;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const cached = localStorage.getItem("crm_contacts");
    return cached ? JSON.parse(cached) : SEED_CONTACTS;
  });

  const [entities, setEntities] = useState<Entity[]>(() => {
    const cached = localStorage.getItem("crm_entities");
    return cached ? JSON.parse(cached) : SEED_ENTITIES;
  });

  const [engagements, setEngagements] = useState<Engagement[]>(() => {
    const cached = localStorage.getItem("crm_engagements");
    return cached ? JSON.parse(cached) : SEED_ENGAGEMENTS;
  });

  const [systemUsers, setSystemUsers] = useState<any[]>(() => {
    const cached = localStorage.getItem("crm_users");
    return cached ? JSON.parse(cached) : [];
  });

  // Navigation and Search
  const [activeTab, setActiveTab] = useState<"dashboard" | "interactions" | "engagements" | "contacts" | "entities" | "notes" | "documents" | "users" | "audit" | "tags" | "settings">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Settings form states
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState("");
  const [settingsNewPassword, setSettingsNewPassword] = useState("");
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState("");

  // System Audit Ledger filter states
  const [auditTargetFilter, setAuditTargetFilter] = useState<string>("ALL");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");
  const [auditTextSearch, setAuditTextSearch] = useState<string>("");
  const [auditInsightRange, setAuditInsightRange] = useState<"30" | "all">("30");

  // Filtering & Sorting configuration states
  const [conSearch, setConSearch] = useState("");
  const [conRatingFilter, setConRatingFilter] = useState<string>("ALL");
  const [conSortDir, setConSortDir] = useState<"asc" | "desc" | "none">("none");
  const [conQuickSort, setConQuickSort] = useState<"none" | "name-asc" | "name-desc" | "modified-desc">("none");

  const [entSearch, setEntSearch] = useState("");
  const [entRatingFilter, setEntRatingFilter] = useState<string>("ALL");
  const [entSortDir, setEntSortDir] = useState<"asc" | "desc" | "none">("none");

  // Modal and detail actions
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  const [newType, setNewType] = useState<"interaction" | "contact" | "entity" | "engagement" | "user">("interaction");

  // Dashboard / List Mode Toggles
  const [contactsViewMode, setContactsViewMode] = useState<"list" | "dashboard">("list");
  const [entitiesViewMode, setEntitiesViewMode] = useState<"list" | "dashboard" | "map">("list");
  const [interactionsSubView, setInteractionsSubView] = useState<"list" | "gantt" | "dashboard">("list");
  const [engagementsViewMode, setEngagementsViewMode] = useState<"list" | "dashboard">("list");

  const [selectedItem, setSelectedItem] = useState<{
    dataType: "interaction" | "contact" | "entity" | "engagement" | "user";
    data: any;
  } | null>(null);

  // Selected item internal drawer state
  const [drawerTab, setDrawerTab] = useState<"tags" | "notes" | "docs">("tags");
  const [selectedTagToLink, setSelectedTagToLink] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<CustomTag["color"]>("blue");
  
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteSubject, setNewNoteSubject] = useState("");
  const [newNoteVisibility, setNewNoteVisibility] = useState<"Private" | "Team" | "Public">("Public");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<Document["fileType"]>("PDF");
  const [newDocSize, setNewDocSize] = useState("");
  const [newDocTags, setNewDocTags] = useState<string[]>([]);
  const [newDocVisibility, setNewDocVisibility] = useState<"Private" | "Team" | "Public">("Public");

  // Create entry form states
  const [intForm, setIntForm] = useState({
    subject: "",
    type: "Meeting" as Interaction["type"],
    assignee: "",
    status: "IN PROGRESS" as Interaction["status"],
    client: "",
    date: new Date().toISOString().split("T")[0],
    summary: "",
    Note: "",
    PrevInteraction: null as number | null,
    engagementId: null as string | null,
    followUpDate: "",
    followUpNotes: "",
    followUpCompleted: false,
    duration: ""
  });

  const [contactForm, setContactForm] = useState({
    FirstName: "",
    MiddleName: "",
    Lastname: "",
    role: "",
    company: "",
    email: "",
    phone: "",
    LinkedInURL: "",
    Ratting: null as number | null
  });

  const [entityForm, setEntityForm] = useState({
    name: "",
    industry: "",
    tier: "Enterprise" as Entity["tier"],
    location: "",
    AddressLine_1: "",
    AddressLine_2: "",
    Postalcode: "",
    City: "",
    Website: "",
    Rating: null as number | null
  });

  const [engagementForm, setEngagementForm] = useState({
    title: "",
    client: "",
    type: "SOW Contract" as Engagement["type"],
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    status: "Active" as Engagement["status"],
    description: ""
  });

  const [operatorForm, setOperatorForm] = useState({
    name: "",
    email: "",
    role: "Auditor Seat",
    passphrase: ""
  });

  // Box Selection States for Batch Actions
  const [selectedInteractionIds, setSelectedInteractionIds] = useState<string[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedAdminItemIds, setSelectedAdminItemIds] = useState<string[]>([]);

  // Interaction Filter States
  const [interactionAssigneeFilter, setInteractionAssigneeFilter] = useState<string>("ALL");
  const [interactionTimeRangeFilter, setInteractionTimeRangeFilter] = useState<string>("ALL");
  const [interactionStartDateFilter, setInteractionStartDateFilter] = useState<string>("");
  const [interactionEndDateFilter, setInteractionEndDateFilter] = useState<string>("");
  const [interactionStatusFilters, setInteractionStatusFilters] = useState<Interaction["status"][]>(["IN PROGRESS", "SCHEDULED", "COMPLETED", "BLOCKED"]);
  const [interactionsViewMode, setInteractionsViewMode] = useState<"kanban" | "calendar">("kanban");
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => new Date().getMonth()); // 0-indexed dynamically
  const [timelineFilterMode, setTimelineFilterMode] = useState<"Active" | "All">("Active");
  const [timelineZoom, setTimelineZoom] = useState<"Monthly" | "Quarterly" | "Annual">("Quarterly");
  const [timelineOffsetDays, setTimelineOffsetDays] = useState<number>(0);
  const [timelineRefDateStr, setTimelineRefDateStr] = useState<string>(() => {
    const todayObj = new Date();
    return `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;
  });
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // States for the Engagement Detail & Linked Interactions Sub-View
  const [selectedEngagementForView, setSelectedEngagementForView] = useState<Engagement | null>(null);
  const [subViewSearchQuery, setSubViewSearchQuery] = useState("");
  const [subViewTypeFilter, setSubViewTypeFilter] = useState("ALL");
  const [subViewStatusFilter, setSubViewStatusFilter] = useState("ALL");
  const [subViewSortColumn, setSubViewSortColumn] = useState<"date" | "followUpDate">("date");
  const [subViewSortDirection, setSubViewSortDirection] = useState<"asc" | "desc">("desc");

  const centerTimelineOnDate = (dateStr: string, zoomValue?: "Monthly" | "Quarterly" | "Annual") => {
    const refTime = new Date(dateStr).getTime();
    const todayObj = new Date();
    const tStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;
    const todayDate = new Date(tStr);

    const targetZoom = zoomValue || timelineZoom;
    const oneDay = 24 * 60 * 60 * 1000;
    let minTimeDefault = todayDate.getTime() - 45 * oneDay;
    let maxTimeDefault = todayDate.getTime() + 180 * oneDay;

    if (targetZoom === "Monthly") {
      minTimeDefault = todayDate.getTime() - 20 * oneDay;
      maxTimeDefault = todayDate.getTime() + 40 * oneDay;
    } else if (targetZoom === "Quarterly") {
      minTimeDefault = todayDate.getTime() - 60 * oneDay;
      maxTimeDefault = todayDate.getTime() + 120 * oneDay;
    } else if (targetZoom === "Annual") {
      minTimeDefault = todayDate.getTime() - 150 * oneDay;
      maxTimeDefault = todayDate.getTime() + 300 * oneDay;
    }

    const totalSpanDefault = maxTimeDefault - minTimeDefault;
    const midTimeDefault = minTimeDefault + totalSpanDefault / 2;

    const offsetDays = Math.round((refTime - midTimeDefault) / oneDay);
    setTimelineOffsetDays(offsetDays);
  };

  // Calendar drag-and-hold auto-scroll/shift refs
  const calendarGridRef = React.useRef<HTMLDivElement | null>(null);
  const timelineGridRef = React.useRef<HTMLDivElement | null>(null);
  const isDraggingInteractionRef = React.useRef<boolean>(false);
  const activeEdgeRef = React.useRef<"left" | "right" | "top" | "bottom" | null>(null);
  const calendarTimerRef = React.useRef<any>(null);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      if (!isDraggingInteractionRef.current || !calendarGridRef.current) return;
      const rect = calendarGridRef.current.getBoundingClientRect();
      const { clientX, clientY } = e;

      let detectedEdge: "left" | "right" | "top" | "bottom" | null = null;

      // Detect Left edge: horizontally left, vertically inside grid boundaries
      if (
        clientX >= rect.left - 30 &&
        clientX <= rect.left + 45 &&
        clientY >= rect.top - 20 &&
        clientY <= rect.bottom + 20
      ) {
        detectedEdge = "left";
      }
      // Detect Right edge: horizontally right, vertically inside grid boundaries
      else if (
        clientX >= rect.right - 45 &&
        clientX <= rect.right + 30 &&
        clientY >= rect.top - 20 &&
        clientY <= rect.bottom + 20
      ) {
        detectedEdge = "right";
      }
      // Detect Top edge: vertically top, horizontally inside grid boundaries
      else if (
        clientY >= rect.top - 30 &&
        clientY <= rect.top + 45 &&
        clientX >= rect.left - 20 &&
        clientX <= rect.right + 20
      ) {
        detectedEdge = "top";
      }
      // Detect Bottom edge: vertically bottom, horizontally inside grid boundaries
      else if (
        clientY >= rect.bottom - 45 &&
        clientY <= rect.bottom + 30 &&
        clientX >= rect.left - 20 &&
        clientX <= rect.right + 20
      ) {
        detectedEdge = "bottom";
      }

      if (detectedEdge !== activeEdgeRef.current) {
        activeEdgeRef.current = detectedEdge;
        if (calendarTimerRef.current) {
          clearInterval(calendarTimerRef.current);
          calendarTimerRef.current = null;
        }

        if (detectedEdge) {
          const performShift = (edge: "left" | "right" | "top" | "bottom") => {
            if (edge === "left") {
              setCalendarMonth((prev) => {
                if (prev === 0) {
                  setCalendarYear((y) => y - 1);
                  return 11;
                }
                return prev - 1;
              });
            } else if (edge === "right") {
              setCalendarMonth((prev) => {
                if (prev === 11) {
                  setCalendarYear((y) => y + 1);
                  return 0;
                }
                return prev + 1;
              });
            } else if (edge === "top") {
              setCalendarYear((prev) => prev - 1);
            } else if (edge === "bottom") {
              setCalendarYear((prev) => prev + 1);
            }
          };

          // Wait 1000ms holding near the edge before first shifting, then repeat every 1000ms
          calendarTimerRef.current = setInterval(() => {
            performShift(detectedEdge);
          }, 1000);
        }
      }
    };

    const handleGlobalDragEnd = () => {
      isDraggingInteractionRef.current = false;
      activeEdgeRef.current = null;
      if (calendarTimerRef.current) {
        clearInterval(calendarTimerRef.current);
        calendarTimerRef.current = null;
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragend", handleGlobalDragEnd);
    window.addEventListener("drop", handleGlobalDragEnd);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragend", handleGlobalDragEnd);
      window.removeEventListener("drop", handleGlobalDragEnd);
      if (calendarTimerRef.current) {
        clearInterval(calendarTimerRef.current);
      }
    };
  }, []);

  // Custom System Confirm Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ title, message, onConfirm });
  };

  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query || !text) return text;
    const escapedQuery = String(query).replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    try {
      const parts = String(text).split(new RegExp(`(${escapedQuery})`, "gi"));
      return (
        <>
          {parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase() ? (
              <mark key={index} className="bg-amber-150 text-amber-950 font-semibold px-0.5 rounded">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </>
      );
    } catch {
      return text;
    }
  };

  // Admin Override Panel Filter States
  const [adminVisibilitySearch, setAdminVisibilitySearch] = useState<string>("");
  const [adminVisibilityTypeFilter, setAdminVisibilityTypeFilter] = useState<"ALL" | "note" | "doc">("ALL");
  const [adminVisibilityLevelFilter, setAdminVisibilityLevelFilter] = useState<"ALL" | "Private" | "Team" | "Public">("ALL");

  // Process / Filter Interactions based on configuration
  const allAvailableAssignees = useMemo(() => {
    const names = new Set<string>();
    contacts.forEach((c) => {
      if (c.name) names.add(c.name);
    });
    interactions.forEach((i) => {
      if (i.assignee) names.add(i.assignee);
    });
    return Array.from(names);
  }, [contacts, interactions]);

  const formAssigneeOptions = useMemo(() => {
    if (!intForm.client) {
      return [];
    }
    return contacts.filter(
      (c) => (c.company || "").toLowerCase() === intForm.client.toLowerCase()
    );
  }, [contacts, intForm.client]);

  const editAssigneeOptions = useMemo(() => {
    if (!selectedItem || selectedItem.dataType !== "interaction") return [];
    const clientCompany = selectedItem.data.client;
    if (!clientCompany) {
      return contacts;
    }
    return contacts.filter(
      (c) => (c.company || "").toLowerCase() === clientCompany.toLowerCase()
    );
  }, [contacts, selectedItem]);

  // Note/Document Visibility Helpers
  const getAssociatedEntityName = (linkedToType: string, linkedToId: string): string => {
    if (!linkedToType || !linkedToId) return "";
    if (linkedToType === "entity") {
      const ent = entities.find(e => e.id === linkedToId);
      return ent ? ent.name : "";
    } else if (linkedToType === "contact") {
      const con = contacts.find(c => c.id === linkedToId);
      return con ? con.company : "";
    } else if (linkedToType === "engagement") {
      const eng = engagements.find(e => e.id === linkedToId);
      return eng ? eng.client : "";
    } else if (linkedToType === "interaction") {
      const intRow = interactions.find(i => i.id === linkedToId);
      return intRow ? intRow.client : "";
    } else if (linkedToType === "document") {
      const doc = documents.find(d => d.id === linkedToId);
      if (doc) {
        return getAssociatedEntityName(doc.linkedToType, doc.linkedToId);
      }
    }
    return "";
  };

  const isUserAssociatedWithEntity = (entityName: string): boolean => {
    if (!entityName) return true; // General item (not attached to entity) available to the team
    if (!session) return false;

    const userMatchedName = (session.name || "").toLowerCase().trim();
    const userMatchedEmail = (session.email || "").toLowerCase().trim();
    const targetEntityLower = entityName.toLowerCase().trim();

    // Is current operator the assignee in any interaction belonging to this company?
    const hasAssignedInteraction = interactions.some(i => 
      (i.client || "").toLowerCase().trim() === targetEntityLower && 
      ((i.assignee || "").toLowerCase().trim() === userMatchedName || (i.assignee || "").toLowerCase().trim() === userMatchedEmail)
    );
    if (hasAssignedInteraction) return true;

    // Does the operator have a contact profile in this entity's company?
    const hasContactProfile = contacts.some(c => 
      (c.company || "").toLowerCase().trim() === targetEntityLower &&
      ((c.name || "").toLowerCase().trim() === userMatchedName || (c.email || "").toLowerCase().trim() === userMatchedEmail)
    );
    if (hasContactProfile) return true;

    return false;
  };

  const isOwner = (item: { author?: string }): boolean => {
    if (!session || !item.author) return false;
    const userMatchedName = (session.name || "").toLowerCase().trim();
    const userMatchedEmail = (session.email || "").toLowerCase().trim();
    const authorLower = item.author.toLowerCase().trim();
    return authorLower === userMatchedName || authorLower === userMatchedEmail;
  };

  const canUserViewItem = (item: { author?: string; visibility?: string; linkedToType: string; linkedToId: string }): boolean => {
    if (!session) return false;
    
    // Creator can always view their own notes/documents
    const isCreator = isOwner(item);
    if (isCreator) return true;

    const visibility = item.visibility || "Public";
    if (visibility === "Public") {
      return true;
    }
    if (visibility === "Private") {
      return isCreator;
    }
    if (visibility === "Team") {
      const entityName = getAssociatedEntityName(item.linkedToType, item.linkedToId);
      return isUserAssociatedWithEntity(entityName);
    }
    return false;
  };

  const visibleNotes = useMemo(() => {
    return notes.filter((n) => canUserViewItem(n));
  }, [notes, session, contacts, interactions, entities, engagements, documents]);

  const visibleDocuments = useMemo(() => {
    return documents.filter((d) => canUserViewItem(d));
  }, [documents, session, contacts, interactions, entities, engagements]);

  const filteredInteractions = useMemo(() => {
    return interactions.filter((item) => {
      // 1. Assignee filtering
      if (interactionAssigneeFilter !== "ALL" && item.assignee !== interactionAssigneeFilter) {
        return false;
      }

      // 2. Time Range filtering
      if (interactionTimeRangeFilter !== "ALL") {
        const itemDate = new Date(item.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (interactionTimeRangeFilter === "TODAY") {
          const itemDateStr = item.date; // YYYY-MM-DD
          const todayStr = today.toISOString().split("T")[0];
          if (itemDateStr !== todayStr) return false;
        } else if (interactionTimeRangeFilter === "WEEK") {
          const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          const sevenDaysHence = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (itemDate < sevenDaysAgo || itemDate > sevenDaysHence) return false;
        } else if (interactionTimeRangeFilter === "MONTH") {
          const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          const thirtyDaysHence = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (itemDate < thirtyDaysAgo || itemDate > thirtyDaysHence) return false;
        } else if (interactionTimeRangeFilter === "FUTURE") {
          if (itemDate < today) return false;
        } else if (interactionTimeRangeFilter === "CUSTOM") {
          if (interactionStartDateFilter) {
            const start = new Date(interactionStartDateFilter);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          if (interactionEndDateFilter) {
            const end = new Date(interactionEndDateFilter);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        }
      }

      // 3. Status filtering
      if (!interactionStatusFilters.includes(item.status)) {
        return false;
      }

      return true;
    });
  }, [interactions, interactionAssigneeFilter, interactionTimeRangeFilter, interactionStartDateFilter, interactionEndDateFilter, interactionStatusFilters]);

  // Auto-clear selection lists on tab activation changes
  useEffect(() => {
    setSelectedInteractionIds([]);
    setSelectedContactIds([]);
  }, [activeTab]);

  // Ensure initial focus is on the Dashboard view upon startup
  useEffect(() => {
    setActiveTab("dashboard");
  }, []);

  // System Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([
    "Sarah K. updated status of 'Q4 Marketing Alignment' to IN PROGRESS",
    "Michael R. completed interaction log 'Enterprise Onboarding Sync'",
    "Julianne Apex was linked as stakeholder for Apex Solutions Ltd.",
    "System security credentials loaded and validated"
  ]);

  interface Notification {
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

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [readVirtualNotifIds, setReadVirtualNotifIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("crm_read_virtual_notifs") || "[]");
    } catch {
      return [];
    }
  });

  const markVirtualNotifAsRead = (id: string) => {
    setReadVirtualNotifIds((prev) => {
      const next = [...prev, id];
      localStorage.setItem("crm_read_virtual_notifs", JSON.stringify(next));
      return next;
    });
  };

  const markAllVirtualNotifsAsRead = (ids: string[]) => {
    setReadVirtualNotifIds((prev) => {
      const next = Array.from(new Set([...prev, ...ids]));
      localStorage.setItem("crm_read_virtual_notifs", JSON.stringify(next));
      return next;
    });
  };

  // Flag interactions marked 'SCHEDULED' or 'BLOCKED' when the due date is within 24 hours of the system date
  const impendingInteractions = useMemo(() => {
    const sysDate = new Date();
    return interactions.filter((item) => {
      if (item.status !== "SCHEDULED" && item.status !== "BLOCKED") return false;
      if (!item.date) return false;
      
      const targetDate = new Date(item.date);
      // item.date is typically formatted as YYYY-MM-DD
      const diffTime = targetDate.getTime() - sysDate.getTime();
      const diffHours = diffTime / (1000 * 60 * 60);
      
      // within 24 hours of system date (including past today/overdue and coming up tomorrow)
      return diffHours >= -24 && diffHours <= 24;
    });
  }, [interactions]);

  const virtualNotifications = useMemo(() => {
    return impendingInteractions.map((item) => {
      const id = `notif-impending-${item.id}`;
      const isRead = readVirtualNotifIds.includes(id) ? 1 : 0;
      return {
        id,
        actionUserEmail: "system@enterprise.com",
        actionUserName: "System Watchdog",
        actionType: item.status === "BLOCKED" ? "delete" as const : "update" as const,
        entityId: item.id,
        entityName: item.subject,
        entityTier: "Impending",
        message: `⏰ [${item.status}] Interaction "${item.subject}" for ${item.client} is due within 24 hours (Due: ${item.date})!`,
        createdAt: new Date(item.date).toISOString(),
        isRead
      };
    });
  }, [impendingInteractions, readVirtualNotifIds]);

  const allNotifications = useMemo(() => {
    const combined = [...virtualNotifications, ...notifications];
    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [virtualNotifications, notifications]);

  // Linked Interactions for the selected engagement sub-view
  const linkedInteractions = useMemo(() => {
    if (!selectedEngagementForView) return [];
    
    // Link by client name matching AND date within start/end dates
    const matches = interactions.filter(interaction => {
      if (interaction.engagementId) {
        return interaction.engagementId === selectedEngagementForView.id;
      }
      const dateOk = !interaction.date || (
        interaction.date >= selectedEngagementForView.startDate &&
        interaction.date <= selectedEngagementForView.endDate
      );
      return interaction.client === selectedEngagementForView.client && dateOk;
    });

    return matches;
  }, [interactions, selectedEngagementForView]);

  // Filtered and sorted interactions for the sub-view
  const filteredSubViewInteractions = useMemo(() => {
    let list = [...linkedInteractions];

    // 1. Text Search Filter
    if (subViewSearchQuery.trim()) {
      const query = subViewSearchQuery.toLowerCase();
      list = list.filter(item => {
        return (item.subject || "").toLowerCase().includes(query) ||
               (item.summary || "").toLowerCase().includes(query) ||
               (item.assignee || "").toLowerCase().includes(query) ||
               (item.type || "").toLowerCase().includes(query) ||
               (item.Note || "").toLowerCase().includes(query) ||
               (item.followUpNotes || "").toLowerCase().includes(query);
      });
    }

    // 2. Type Filter
    if (subViewTypeFilter !== "ALL") {
      const typeLower = subViewTypeFilter.toLowerCase();
      list = list.filter(item => (item.type || "").toLowerCase() === typeLower);
    }

    // 3. Status Filter
    if (subViewStatusFilter !== "ALL") {
      const statusLower = subViewStatusFilter.toLowerCase();
      list = list.filter(item => (item.status || "").toLowerCase() === statusLower);
    }

    // 4. Sorting on date columns
    list.sort((a, b) => {
      let dateA = "";
      let dateB = "";

      if (subViewSortColumn === "date") {
        dateA = a.date || "";
        dateB = b.date || "";
      } else if (subViewSortColumn === "followUpDate") {
        dateA = a.followUpDate || "";
        dateB = b.followUpDate || "";
      }

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      const compare = dateA.localeCompare(dateB);
      return subViewSortDirection === "asc" ? compare : -compare;
    });

    return list;
  }, [linkedInteractions, subViewSearchQuery, subViewTypeFilter, subViewStatusFilter, subViewSortColumn, subViewSortDirection]);

  interface AuditLog {
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

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Filtered logs for insight calculations (either past 30 days or all-time)
  const auditTargetLogs = useMemo(() => {
    if (auditInsightRange === "30") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return auditLogs.filter(log => new Date(log.timestamp) >= thirtyDaysAgo);
    }
    return auditLogs;
  }, [auditLogs, auditInsightRange]);

  // Compute most active operators in selected timeframe
  const auditActiveOperators = useMemo(() => {
    const counts: Record<string, { email: string; name: string; role: string; count: number }> = {};
    auditTargetLogs.forEach(log => {
      const email = log.userEmail || "anonymous@enterprise.com";
      if (!counts[email]) {
        counts[email] = {
          email,
          name: log.userName || email.split("@")[0],
          role: log.userRole || "Operator",
          count: 0
        };
      }
      counts[email].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [auditTargetLogs]);

  // Compute most modified entities/records in selected timeframe
  const auditModifiedEntities = useMemo(() => {
    const counts: Record<string, {
      key: string;
      type: string;
      id: string;
      name: string;
      count: number;
      creates: number;
      updates: number;
      deletes: number;
      lastActive: string;
    }> = {};

    auditTargetLogs.forEach(log => {
      const tId = log.targetId || "unknown";
      const tType = log.targetType || "System";
      const key = `${tType}::${tId}`;
      if (!counts[key]) {
        counts[key] = {
          key,
          type: tType,
          id: tId,
          name: log.targetName || `Record #${tId.substring(0, 8)}`,
          count: 0,
          creates: 0,
          updates: 0,
          deletes: 0,
          lastActive: log.timestamp
        };
      }
      counts[key].count++;
      if (log.actionType === "CREATE") counts[key].creates++;
      else if (log.actionType === "UPDATE" || log.actionType === "BATCH_UPDATE") counts[key].updates++;
      else if (log.actionType === "DELETE" || log.actionType === "BATCH_DELETE") counts[key].deletes++;

      if (new Date(log.timestamp) > new Date(counts[key].lastActive)) {
        counts[key].lastActive = log.timestamp;
      }
    });

    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [auditTargetLogs]);

  // Compute additional metrics for summary insights
  const auditSystemMetrics = useMemo(() => {
    if (auditTargetLogs.length === 0) return { peakHour: "N/A", deletePercent: "0%", adminActionPercent: "0%" };
    
    // Peak hour calculation
    const hourCounts: Record<number, number> = {};
    let peakHr = 0;
    let maxCount = 0;
    
    // Action breakdown
    let totalActions = 0;
    let deleteActions = 0;
    let adminActions = 0;

    auditTargetLogs.forEach(log => {
      totalActions++;
      const hr = new Date(log.timestamp).getUTCHours();
      hourCounts[hr] = (hourCounts[hr] || 0) + 1;
      if (hourCounts[hr] > maxCount) {
        maxCount = hourCounts[hr];
        peakHr = hr;
      }
      if (log.actionType && log.actionType.includes("DELETE")) {
        deleteActions++;
      }
      if (log.userRole === "Senior Analyst") {
        adminActions++;
      }
    });

    const formattedPeakHour = totalActions > 0 ? `${String(peakHr).padStart(2, '0')}:00 UTC` : "N/A";
    const deletePercent = totalActions > 0 ? `${Math.round((deleteActions / totalActions) * 100)}%` : "0%";
    const adminActionPercent = totalActions > 0 ? `${Math.round((adminActions / totalActions) * 100)}%` : "0%";

    return {
      peakHour: formattedPeakHour,
      deletePercent,
      adminActionPercent
    };
  }, [auditTargetLogs]);

  // Unified memo for filtered logs used on rendering and exports
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Filter by dynamic vault class/target type
      if (auditTargetFilter !== "ALL" && log.targetType !== auditTargetFilter) return false;
      
      // Filter by specific/range actions
      if (auditActionFilter !== "ALL") {
        if (auditActionFilter === "BATCH" && (!log.actionType || !log.actionType.startsWith("BATCH"))) return false;
        if (auditActionFilter !== "BATCH" && log.actionType !== auditActionFilter) return false;
      }
      
      // Filter by loose query matching
      if (auditTextSearch.trim()) {
        const q = auditTextSearch.toLowerCase();
        return (
          (log.userEmail || "").toLowerCase().includes(q) ||
          (log.userName || "").toLowerCase().includes(q) ||
          (log.details || "").toLowerCase().includes(q) ||
          (log.targetName || "").toLowerCase().includes(q) ||
          (log.targetId || "").toLowerCase().includes(q) ||
          (log.userRole || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditLogs, auditTargetFilter, auditActionFilter, auditTextSearch]);

  const handleExportAuditLogsToCSV = () => {
    if (filteredAuditLogs.length === 0) {
      showToast("No audit logs in current filter criteria to export.", "info");
      return;
    }

    // Explicit RFC-compliant CSV headers
    const headers = [
      "Timestamp (UTC)",
      "Operator Name",
      "Operator Email",
      "Operator Role",
      "Action Type",
      "Target Subsystem",
      "Target ID",
      "Target Name",
      "Transaction Details"
    ];

    // Explicit rows constructor
    const rows = filteredAuditLogs.map((log) => {
      const formattedTimestamp = new Date(log.timestamp).toISOString();
      return [
        formattedTimestamp,
        log.userName || "Anonymous",
        log.userEmail || "anonymous@enterprise.com",
        log.userRole || "Operator",
        log.actionType || "UNKNOWN",
        log.targetType || "System",
        log.targetId || "N/A",
        log.targetName || "N/A",
        log.details || ""
      ];
    });

    // Format content with double quote escaping and wrap cells holding comma, quotation marks or carriage returns
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell);
            const escaped = str.replace(/"/g, '""');
            if (
              escaped.includes(",") ||
              escaped.includes('"') ||
              escaped.includes("\n") ||
              escaped.includes("\r")
            ) {
              return `"${escaped}"`;
            }
            return escaped;
          })
          .join(",")
      )
    ].join("\n");

    // Standard DOM link click simulation wrapper for direct document triggers
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const filterDesc = [
      auditTargetFilter !== "ALL" ? `vault_${auditTargetFilter}` : "",
      auditActionFilter !== "ALL" ? `act_${auditActionFilter}` : "",
      auditTextSearch.trim() ? "search" : ""
    ]
      .filter(Boolean)
      .join("_") || "complete";

    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `system_audit_ledger_${filterDesc}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Successfully downloaded CSV file with ${filteredAuditLogs.length} audit records.`, "success");
  };

  // Synchronize apiService credentials with the active React session
  useEffect(() => {
    apiService.setSession(session);
  }, [session]);

  const loadAuditLogs = async () => {
    const logs = await apiService.loadAuditLogs();
    if (logs) {
      setAuditLogs(logs);
    }
  };

  const purgeAuditLogs = async () => {
    showConfirm(
      "Purge Audit Ledger",
      "CRITICAL WARNING: Are you absolutely sure you want to permanently purge all system audit logs? This is irreversible and will lose full lineage visibility.",
      async () => {
        const success = await apiService.purgeAuditLogs();
        if (success) {
          showToast("Audit ledger purged successfully.", "info");
          loadAuditLogs();
        }
      }
    );
  };

  // Hashing Function with Unique Email-Seeded Salt
  const hashPassword = async (pwd: string, email: string): Promise<string> => {
    return apiService.hashPassword(pwd, email);
  };

  // SQLite API synchronization helper
  const syncToServer = async (url: string, method: string, body?: any) => {
    await apiService.syncToServer(url, method, body);
  };

  // Pull loadSQLiteState out of useEffect so we can call it on demand (e.g., when WebSocket notification arrives)
  const loadSQLiteState = async () => {
    const data = await apiService.loadSQLiteState();
    if (data) {
      if (data.tags) {
        setTags(data.tags);
        localStorage.setItem("crm_tags", JSON.stringify(data.tags));
      }
      if (data.notes) {
        setNotes(data.notes);
        localStorage.setItem("crm_notes", JSON.stringify(data.notes));
      }
      if (data.documents) {
        setDocuments(data.documents);
        localStorage.setItem("crm_documents", JSON.stringify(data.documents));
      }
      if (data.interactions) {
        setInteractions(data.interactions);
        localStorage.setItem("crm_interactions", JSON.stringify(data.interactions));
      }
      if (data.contacts) {
        setContacts(data.contacts);
        localStorage.setItem("crm_contacts", JSON.stringify(data.contacts));
      }
      if (data.entities) {
        setEntities(data.entities);
        localStorage.setItem("crm_entities", JSON.stringify(data.entities));
      }
      if (data.engagements) {
        setEngagements(data.engagements);
        localStorage.setItem("crm_engagements", JSON.stringify(data.engagements));
      }
      if (data.systemUsers) {
        setSystemUsers(data.systemUsers);
        localStorage.setItem("crm_users", JSON.stringify(data.systemUsers));
      }
    }
  };

  const loadNotifications = async () => {
    const data = await apiService.loadNotifications();
    if (data) {
      setNotifications(data);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    const success = await apiService.markNotificationAsRead(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n))
      );
    }
  };

  const markAllNotificationsAsRead = async () => {
    const success = await apiService.markAllNotificationsAsRead();
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
    }
  };

  // Load all initial state from backend SQLite DB on mount
  useEffect(() => {
    loadSQLiteState();
  }, []);

  // Sync notes to local storage
  useEffect(() => {
    localStorage.setItem("crm_notes", JSON.stringify(notes));
  }, [notes]);

  // Fetch notifications on mount & session changes
  useEffect(() => {
    loadNotifications();
  }, [session]);

  // Fetch audit logs on mount & session changes or when audit tab is open
  useEffect(() => {
    if (session && session.role === "Senior Analyst") {
      loadAuditLogs();
    }
  }, [session, activeTab]);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!session) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?email=${encodeURIComponent(session.email)}&role=${encodeURIComponent(session.role)}`;
    
    let ws: WebSocket;
    let reconnectTimer: any;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connection established");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "NOTIFICATION_RECEIVED") {
            setNotifications((prev) => [msg.data, ...prev]);
            showToast(`🔔 ${msg.data.message}`, "info");
            loadSQLiteState();
          }
        } catch (err) {
          console.error("Failed to parse websocket message:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed, schedule reconnect...");
        reconnectTimer = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket encountered error:", err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = () => {}; 
        ws.close();
      }
      clearTimeout(reconnectTimer);
    };
  }, [session]);

  const showToast = (message: string, type: Toast["type"] = "success") => {
    const newToast: Toast = { id: Math.random().toString(), message, type };
    setToasts((prev) => [...prev, newToast]);
    setActivityLog((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 15)]);
    setTimeout(() => { setToasts((prev) => prev.filter((t) => t.id !== newToast.id)); }, 4000);
  };

  // --- CLIENT-SIDE BATCH ACTION HANDLERS ---
  const handleBatchInteractionDelete = async () => {
    if (selectedInteractionIds.length === 0) return;
    showConfirm(
      "Delete Selected Interactions",
      `Are you sure you want to delete ${selectedInteractionIds.length} selected interactions? This action is permanent.`,
      async () => {
        try {
          const res = await fetch("/api/interactions/batch-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedInteractionIds })
          });
          if (res.ok) {
            setInteractions(prev => prev.filter(i => !selectedInteractionIds.includes(i.id)));
            showToast(`Successfully deleted ${selectedInteractionIds.length} interactions`, "success");
            setSelectedInteractionIds([]);
            await loadSQLiteState();
          } else {
            showToast("Failed to perform batch deletion", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Error executing batch deletion", "error");
        }
      }
    );
  };

  const handleBatchInteractionStatusUpdate = async (newStatus: "IN PROGRESS" | "SCHEDULED" | "COMPLETED" | "BLOCKED" | "CANCELED") => {
    if (selectedInteractionIds.length === 0) return;
    try {
      const res = await fetch("/api/interactions/batch-update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedInteractionIds, status: newStatus })
      });
      if (res.ok) {
        const nextInteractions = interactions.map(i => {
          if (selectedInteractionIds.includes(i.id)) {
            return { ...i, status: newStatus };
          }
          return i;
        });
        setInteractions(nextInteractions);
        showToast(`Updated ${selectedInteractionIds.length} interactions to ${newStatus}`, "success");
        if (newStatus === "COMPLETED") {
          await triggerCompletedDependencies(selectedInteractionIds, nextInteractions);
        }
        setSelectedInteractionIds([]);
      } else {
        showToast("Failed to update status in batch", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating batch statuses", "error");
    }
  };

  const handleBatchContactDelete = async () => {
    if (selectedContactIds.length === 0) return;
    showConfirm(
      "Delete Selected Contacts",
      `Are you sure you want to delete ${selectedContactIds.length} selected contacts? This action is permanent.`,
      async () => {
        try {
          const res = await fetch("/api/contacts/batch-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedContactIds })
          });
          if (res.ok) {
            setContacts(prev => prev.filter(c => !selectedContactIds.includes(c.id)));
            showToast(`Successfully deleted ${selectedContactIds.length} contacts`, "success");
            setSelectedContactIds([]);
            await loadSQLiteState();
          } else {
            showToast("Failed to perform batch deletion", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Error executing batch deletion", "error");
        }
      }
    );
  };

  const handleBatchContactRoleUpdate = async (newRole: string) => {
    if (selectedContactIds.length === 0 || !newRole) return;
    try {
      const res = await fetch("/api/contacts/batch-update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedContactIds, role: newRole })
      });
      if (res.ok) {
        setContacts(prev => prev.map(c => {
          if (selectedContactIds.includes(c.id)) {
            return { ...c, role: newRole };
          }
          return c;
        }));
        showToast(`Updated role of ${selectedContactIds.length} contacts to ${newRole}`, "success");
        setSelectedContactIds([]);
      } else {
        showToast("Failed to update contact roles in batch", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating batch roles", "error");
    }
  };

  const handleBatchContactCompanyUpdate = async (newCompany: string) => {
    if (selectedContactIds.length === 0 || !newCompany) return;
    try {
      const res = await fetch("/api/contacts/batch-update-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedContactIds, company: newCompany })
      });
      if (res.ok) {
        setContacts(prev => prev.map(c => {
          if (selectedContactIds.includes(c.id)) {
            return { ...c, company: newCompany };
          }
          return c;
        }));
        showToast(`Changed company of ${selectedContactIds.length} contacts to ${newCompany}`, "success");
        setSelectedContactIds([]);
      } else {
        showToast("Failed to update contact company in batch", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating batch company details", "error");
    }
  };


  // Core Authentication Routines
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showToast("Please provide both email and passcode.", "error");
      return;
    }
    const cleanEmail = authEmail.trim();
    
    // Dynamically retrieve the latest registrations directly from the database to support seamless multi-operator logins
    let usersList = [];
    try {
      const data = await apiService.loadSQLiteState();
      if (data && data.systemUsers) {
        usersList = data.systemUsers;
        setSystemUsers(usersList);
        localStorage.setItem("crm_users", JSON.stringify(usersList));
      } else {
        usersList = JSON.parse(localStorage.getItem("crm_users") || "[]");
      }
    } catch (err) {
      console.warn("Failed retrieving live operator cache, relying on offline registry:", err);
      usersList = JSON.parse(localStorage.getItem("crm_users") || "[]");
    }

    const user = usersList.find((u: any) => u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (!user) {
      showToast("Access denined. Unrecognised operator unit.", "error");
      return;
    }
    if (user.suspended) {
      showToast("Security Exception: This operator seat has been suspended by system administrator.", "error");
      return;
    }
    const hashed = await hashPassword(authPassword, cleanEmail);
    if (user.passwordHash !== hashed) {
      showToast("Invalid credentials hash match failed.", "error");
      return;
    }
    const sessionData = { email: user.email, name: user.name, role: user.role };
    setSession(sessionData);
    setUserProfileName(user.name);
    localStorage.setItem("crm_active_session", JSON.stringify(sessionData));
    clearAuthInputs();
    showToast(`Welcome back, Operator ${user.name}! Connected.`, "success");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !authConfirmPassword || !authName) {
      showToast("Please fully complete registration credentials.", "error");
      return;
    }
    if (authPassword !== authConfirmPassword) {
      showToast("Confirmation coordinates mismatch.", "error");
      return;
    }
    const cleanEmail = authEmail.trim();
    const cleanName = authName.trim();
    
    // Load fresh data before checking existing emails
    let usersList = [];
    try {
      const data = await apiService.loadSQLiteState();
      if (data && data.systemUsers) {
        usersList = data.systemUsers;
      } else {
        usersList = JSON.parse(localStorage.getItem("crm_users") || "[]");
      }
    } catch (err) {
      usersList = JSON.parse(localStorage.getItem("crm_users") || "[]");
    }

    if (usersList.some((u: any) => u.email.toLowerCase() === cleanEmail.toLowerCase())) {
      showToast("This email has already been registered.", "error");
      return;
    }
    const hashed = await hashPassword(authPassword, cleanEmail);
    const newUser = { email: cleanEmail, passwordHash: hashed, name: cleanName, role: authRole };
    const updatedUsers = [...usersList, newUser];
    localStorage.setItem("crm_users", JSON.stringify(updatedUsers));
    setSystemUsers(updatedUsers);
    await syncToServer("/api/users", "POST", newUser);
    // Reload state after syncing
    await loadSQLiteState();
    setSession({ email: cleanEmail, name: cleanName, role: authRole });
    setUserProfileName(cleanName);
    localStorage.setItem("crm_active_session", JSON.stringify({ email: cleanEmail, name: cleanName, role: authRole }));
    clearAuthInputs();
    showToast(`Operator profiles set up successfully. Connected.`, "success");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authName || !authPassword || !authConfirmPassword) {
      showToast("Please provide matching identifiers to update password.", "error");
      return;
    }
    if (authPassword !== authConfirmPassword) {
      showToast("Credential verification mismatch.", "error");
      return;
    }
    const cleanEmail = authEmail.trim();
    const cleanName = authName.trim();
    
    // Fetch latest user states from DB
    let usersList = [];
    try {
      const data = await apiService.loadSQLiteState();
      if (data && data.systemUsers) {
        usersList = data.systemUsers;
        setSystemUsers(usersList);
        localStorage.setItem("crm_users", JSON.stringify(usersList));
      } else {
        usersList = JSON.parse(localStorage.getItem("crm_users") || "[]");
      }
    } catch (err) {
      usersList = JSON.parse(localStorage.getItem("crm_users") || "[]");
    }

    const idx = usersList.findIndex((u: any) => u.email.toLowerCase() === cleanEmail.toLowerCase() && u.name.toLowerCase() === cleanName.toLowerCase());
    if (idx === -1) {
      showToast("Operator identifier verification failed.", "error");
      return;
    }
    usersList[idx].passwordHash = await hashPassword(authPassword, cleanEmail);
    localStorage.setItem("crm_users", JSON.stringify(usersList));
    setSystemUsers(usersList);
    await syncToServer("/api/users", "PUT", usersList[idx]);
    clearAuthInputs();
    showToast("Operator passphrase securely updated. Please login.", "success");
    setAuthScreen("login");
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("crm_active_session");
    clearAuthInputs();
    showToast("Operator session closed. Local matrix locked.", "info");
  };

  // Permission-aware Entities Visible to Active Session User
  const visibleEntities = useMemo(() => {
    if (!session) return [];
    return entities.filter((e) => {
      // Senior Analyst gets all access
      if (session.role === "Senior Analyst") return true;
      // All other roles do not have permission to view Strategic accounts
      if (e.tier === "Strategic") return false;
      return true;
    });
  }, [entities, session]);

  // Search filter index query matching
  const searchResults = useMemo(() => {
    if (!searchQuery) return { interactions: [], contacts: [], entities: [], engagements: [] };
    const q = searchQuery.toLowerCase();
    return {
      interactions: interactions.filter((i) => (i.subject || "").toLowerCase().includes(q) || (i.summary || "").toLowerCase().includes(q) || (i.client || "").toLowerCase().includes(q)),
      contacts: contacts.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.role || "").toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)),
      entities: visibleEntities.filter((e) => (e.name || "").toLowerCase().includes(q) || (e.industry || "").toLowerCase().includes(q) || (e.location || "").toLowerCase().includes(q)),
      engagements: engagements.filter((g) => (g.title || "").toLowerCase().includes(g.title ? q : "") || (g.client || "").toLowerCase().includes(g.client ? q : "") || (g.type || "").toLowerCase().includes(g.type ? q : "") || (g.description || "").toLowerCase().includes(g.description ? q : "")),
      total: 0
    };
  }, [searchQuery, interactions, contacts, visibleEntities, engagements]);

  useEffect(() => {
    setIsSearchActive(searchQuery.trim().length > 0);
  }, [searchQuery]);

  // CRUD actions
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newType === "interaction") {
      if (!intForm.subject || !intForm.client) {
        showToast("Subject and Corporate Account link required.", "error");
        return;
      }
      const newInt: Interaction = {
        id: `int-${Date.now()}`,
        ...intForm,
        PrevInteraction: intForm.PrevInteraction || null,
        engagementId: intForm.engagementId || null,
        duration: intForm.duration ? parseInt(String(intForm.duration)) : null,
        tagIds: [],
        contactRoles: {},
        followUpDate: intForm.followUpDate || "",
        followUpNotes: intForm.followUpNotes || "",
        followUpCompleted: !!intForm.followUpCompleted
      };
      setInteractions([newInt, ...interactions]);
      syncToServer("/api/interactions", "POST", newInt);
      showToast(`Meeting interaction '${intForm.subject}' created.`, "success");
      setIntForm({
        subject: "",
        type: "Meeting",
        assignee: "",
        status: "IN PROGRESS",
        client: "",
        date: new Date().toISOString().split("T")[0],
        summary: "",
        Note: "",
        PrevInteraction: null,
        engagementId: null,
        followUpDate: "",
        followUpNotes: "",
        followUpCompleted: false,
        duration: ""
      });
    } else if (newType === "contact") {
      if (!contactForm.FirstName || !contactForm.company) {
        showToast("Contact Name and corporate company required.", "error");
        return;
      }
      const fullName = `${contactForm.FirstName} ${contactForm.MiddleName ? contactForm.MiddleName + ' ' : ''}${contactForm.Lastname || ""}`.trim();
      const newCon: Contact = {
        id: `con-${Date.now()}`,
        name: fullName,
        ...contactForm,
        Ratting: typeof contactForm.Ratting === 'number' ? contactForm.Ratting : undefined
      };
      setContacts([newCon, ...contacts]);
      syncToServer("/api/contacts", "POST", newCon);
      showToast(`Client contact '${fullName}' indexed.`, "success");
      setContactForm({ FirstName: "", MiddleName: "", Lastname: "", role: "", company: "", email: "", phone: "", LinkedInURL: "", Ratting: null });
    } else if (newType === "entity") {
      if (!entityForm.name || !entityForm.industry) {
        showToast("Corporate Organization Name and industry classification required.", "error");
        return;
      }
      const newEnt: Entity = {
        id: `ent-${Date.now()}`,
        ...entityForm,
        Rating: typeof entityForm.Rating === 'number' ? entityForm.Rating : undefined
      };
      setEntities([newEnt, ...entities]);
      syncToServer("/api/entities", "POST", newEnt);
      showToast(`Corporate Account '${entityForm.name}' established.`, "success");
      setEntityForm({ name: "", industry: "", tier: "Enterprise", location: "", AddressLine_1: "", AddressLine_2: "", Postalcode: "", City: "", Website: "", Rating: null });
    } else if (newType === "engagement") {
      if (!engagementForm.title || !engagementForm.client) {
        showToast("Engagement Title and Associated Client are required.", "error");
        return;
      }
      const newEng: Engagement = {
        id: `eng-${Date.now()}`,
        ...engagementForm
      };
      setEngagements([newEng, ...engagements]);
      syncToServer("/api/engagements", "POST", newEng);
      showToast(`Engagement Initiative '${engagementForm.title}' established.`, "success");
      setEngagementForm({ title: "", client: "", type: "SOW Contract", startDate: new Date().toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0], status: "Active", description: "" });
    } else if (newType === "user") {
      if (!operatorForm.name || !operatorForm.email || !operatorForm.passphrase) {
        showToast("operator Name, email, and passphrase required.", "error");
        return;
      }
      const cleanEmail = operatorForm.email.trim();
      const cleanName = operatorForm.name.trim();

      // Enforce: only an admin role (Senior Analyst) can register a new admin user
      if (operatorForm.role === "Senior Analyst" && session?.role !== "Senior Analyst") {
        showToast("Access Denied: Only a System Administrator (Senior Analyst) can register new administrator seats.", "error");
        return;
      }

      // Check if email already exists
      if (systemUsers.some((u: any) => u.email.toLowerCase() === cleanEmail.toLowerCase())) {
        showToast("An operator with this email has already been registered.", "error");
        return;
      }

      const hashed = await hashPassword(operatorForm.passphrase, cleanEmail);
      const newUser = { email: cleanEmail, passwordHash: hashed, name: cleanName, role: operatorForm.role, suspended: 0 };
      const updatedList = [...systemUsers, newUser];
      setSystemUsers(updatedList);
      localStorage.setItem("crm_users", JSON.stringify(updatedList));
      await syncToServer("/api/users", "POST", newUser);
      await loadSQLiteState();
      showToast(`Operator profile registered: ${cleanName}`, "success");
      setOperatorForm({ name: "", email: "", role: session?.role === "Senior Analyst" ? "Senior Analyst" : "Auditor Seat", passphrase: "" });
    }
    setIsNewModalOpen(false);
  };

  const triggerCompletedDependencies = async (completedIds: string[], currentInteractions: Interaction[]) => {
    let listToUpdate = [...currentInteractions];
    let updatedAny = false;
    let activatedList: string[] = [];

    let changedInLoop = true;
    while (changedInLoop) {
      changedInLoop = false;
      listToUpdate = listToUpdate.map((item) => {
        if (item.PrevInteraction) {
          const dependencyIdStr = String(item.PrevInteraction);
          // Find the predecessor interaction to check its follow-up date and status
          const predecessor = listToUpdate.find(prev => 
            prev.id === dependencyIdStr || 
            String(prev.id.replace(/\D/g, '') || prev.id) === dependencyIdStr
          );
          const isPredecessorCompleted = completedIds.includes(dependencyIdStr) || 
            (predecessor && predecessor.status === "COMPLETED");
          
          const needsActivation = isPredecessorCompleted && (!item.date || item.status === "SCHEDULED");
          if (needsActivation) {
            updatedAny = true;
            changedInLoop = true;
            activatedList.push(item.subject);
            
            // Choose between the predecessor's followUpDate or the current date fallback
            const fallbackDate = new Date().toISOString().split("T")[0];
            const activatedDate = item.date || (predecessor && predecessor.followUpDate ? predecessor.followUpDate : fallbackDate);

            return {
              ...item,
              date: activatedDate,
              status: "IN PROGRESS" as const
            };
          }
        }
        return item;
      });
    }

    if (updatedAny) {
      setInteractions(listToUpdate);
      // Sync each modified dependent item to the server
      for (const item of listToUpdate) {
        const originalItem = currentInteractions.find(i => i.id === item.id);
        if (originalItem && (originalItem.date !== item.date || originalItem.status !== item.status)) {
          await syncToServer(`/api/interactions/${item.id}`, "PUT", item);
        }
      }
      showToast(`Predecessor completed! Dependencies started: ${activatedList.join(", ")}`, "success");
    }
  };

  const handleUpdateItem = async (type: "interaction" | "contact" | "entity" | "engagement" | "user", payload: any) => {
    if (type === "interaction") {
      setInteractions((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
      await syncToServer(`/api/interactions/${payload.id}`, "PUT", payload);
      if (payload.status === "COMPLETED") {
        const latestInteractions = interactions.map(i => i.id === payload.id ? payload : i);
        await triggerCompletedDependencies([payload.id], latestInteractions);
      }
      await loadSQLiteState();
      showToast("Interaction briefing updated.", "success");
    } else if (type === "contact") {
      setContacts((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
      await syncToServer(`/api/contacts/${payload.id}`, "PUT", payload);
      await loadSQLiteState();
      showToast("Contact coordinates updated.", "success");
    } else if (type === "entity") {
      setEntities((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
      await syncToServer(`/api/entities/${payload.id}`, "PUT", payload);
      await loadSQLiteState();
      showToast("Corporate account profiles modified.", "success");
    } else if (type === "engagement") {
      setEngagements((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
      await syncToServer(`/api/engagements/${payload.id}`, "PUT", payload);
      await loadSQLiteState();
      showToast("Engagement details modified.", "success");
    } else if (type === "user") {
      setSystemUsers((prev) => {
        const updated = prev.map((item) => (item.email === payload.email ? payload : item));
        localStorage.setItem("crm_users", JSON.stringify(updated));
        return updated;
      });
      await syncToServer(`/api/users`, "PUT", payload);
      await loadSQLiteState();
      showToast("Operator Seat updated successfully.", "success");
    }
    setSelectedItem(null);
  };

  const handleDeleteItem = async (type: "interaction" | "contact" | "entity" | "engagement" | "user", id: string) => {
    if (type === "interaction") {
      setInteractions((prev) => prev.filter((item) => item.id !== id));
      await syncToServer(`/api/interactions/${id}`, "DELETE");
      await loadSQLiteState();
      showToast("Interaction registry removed.", "info");
    } else if (type === "contact") {
      setContacts((prev) => prev.filter((item) => item.id !== id));
      await syncToServer(`/api/contacts/${id}`, "DELETE");
      await loadSQLiteState();
      showToast("Stakeholder contact card removed.", "info");
    } else if (type === "entity") {
      setEntities((prev) => prev.filter((item) => item.id !== id));
      await syncToServer(`/api/entities/${id}`, "DELETE");
      await loadSQLiteState();
      showToast("Corporate profile structure discarded.", "info");
    } else if (type === "engagement") {
      setEngagements((prev) => prev.filter((item) => item.id !== id));
      await syncToServer(`/api/engagements/${id}`, "DELETE");
      await loadSQLiteState();
      showToast("Engagement Initiative discarded.", "info");
    } else if (type === "user") {
      if (id.toLowerCase() === session?.email.toLowerCase()) {
        showToast("Constraint Violation: You cannot suspend your own active operator seat session.", "error");
        return;
      }
      const activeUsers = systemUsers.filter((u) => !u.suspended);
      if (activeUsers.length <= 1) {
        showToast("Constraint Violation: Workspace must retain at least 1 active operator seat.", "error");
        return;
      }
      const activeSeniorAnalysts = systemUsers.filter((u) => u.role === "Senior Analyst" && !u.suspended);
      const targetUser = systemUsers.find((u) => u.email === id);
      if (targetUser && targetUser.role === "Senior Analyst" && activeSeniorAnalysts.length <= 1) {
        showToast("Constraint Violation: Workspace must retain at least 1 active Primary Seat (Senior Analyst) Operator.", "error");
        return;
      }

      const updated = systemUsers.map((item) => (item.email === id ? { ...item, suspended: 1 } : item));
      setSystemUsers(updated);
      localStorage.setItem("crm_users", JSON.stringify(updated));
      await syncToServer(`/api/users/${id}`, "DELETE");
      await loadSQLiteState();
      showToast("Operator profile suspended.", "info");
    }
    setSelectedItem(null);
  };

  const handleRestoreUser = async (email: string) => {
    try {
      const targetUser = systemUsers.find((u) => u.email === email);
      if (targetUser) {
        const updated = systemUsers.map((item) => (item.email === email ? { ...item, suspended: 0 } : item));
        setSystemUsers(updated);
        localStorage.setItem("crm_users", JSON.stringify(updated));
        const res = await fetch(`/api/users/${email}/restore`, { method: "POST" });
        if (res.ok) {
          showToast(`Seat privileges restored successfully for ${targetUser.name}.`, "success");
          loadSQLiteState();
        } else {
          showToast("Failed to restore operator seat privileges.", "error");
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to restore operator seat.", "error");
    }
  };

  const handlePermanentDeleteUser = async (email: string, name: string) => {
    if (session?.role !== "Senior Analyst") {
      showToast("Access Denied: Only a Senior Analyst (Administrator) can permanently remove operator accounts.", "error");
      return;
    }
    if (email.toLowerCase() === session?.email?.toLowerCase()) {
      showToast("Constraint Violation: You cannot delete your own active operator seat session.", "error");
      return;
    }
    const activeUsers = systemUsers.filter((u) => !u.suspended);
    if (activeUsers.length <= 1 && !systemUsers.find((u) => u.email === email)?.suspended) {
      showToast("Constraint Violation: Workspace must retain at least 1 active operator seat before deleting.", "error");
      return;
    }
    const activeSeniorAnalysts = systemUsers.filter((u) => u.role === "Senior Analyst" && !u.suspended);
    const targetUser = systemUsers.find((u) => u.email === email);
    if (targetUser && targetUser.role === "Senior Analyst" && !targetUser.suspended && activeSeniorAnalysts.length <= 1) {
      showToast("Constraint Violation: Workspace must retain at least 1 active Primary Seat (Senior Analyst) Operator before deletion.", "error");
      return;
    }

    showConfirm(
      "Remove Operator Account Permanently",
      `Are you absolutely certain you want to permanently delete the operator account for "${name}" (${email})? This action is completely irreversible and deletes their profile from the central SQLite registry.`,
      async () => {
        try {
          const res = await fetch(`/api/users/${encodeURIComponent(email)}/permanent`, {
            method: "DELETE",
            headers: {
              "X-User-Email": session?.email || "",
              "X-User-Name": session?.name || "",
              "X-User-Role": session?.role || ""
            }
          });
          if (res.ok) {
            setSystemUsers((prev) => {
              const updated = prev.filter((item) => item.email !== email);
              localStorage.setItem("crm_users", JSON.stringify(updated));
              return updated;
            });
            showToast(`Operator account for ${name} has been permanently removed.`, "success");
            await loadSQLiteState();
          } else {
            const errText = await res.text();
            showToast(`Failed to permanently delete operator account: ${errText || "unspecified error"}`, "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Error permanently deleting operator account.", "error");
        }
      }
    );
  };

  // Dynamic Connection Sync Helpers inside open drawer
  const linkedTags = useMemo(() => {
    if (!selectedItem) return [];
    if (["interaction", "contact", "entity", "engagement"].includes(selectedItem.dataType)) {
      return tags.filter((t) => selectedItem.data.tagIds?.includes(t.id));
    }
    // For other datatypes, we can filter tags implicitly linked or support flexible tag association
    return [];
  }, [selectedItem, tags]);

  const linkedNotes = useMemo(() => {
    if (!selectedItem) return [];
    return visibleNotes
      .filter((n) => n.linkedToType === selectedItem.dataType && n.linkedToId === selectedItem.data.id)
      .sort((a, b) => {
        const aPinned = a.pinned ? 1 : 0;
        const bPinned = b.pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [selectedItem, visibleNotes]);

  const displayedContacts = useMemo(() => {
    let list = [...contacts];

    // Filter by search query
    if (conSearch.trim()) {
      const q = conSearch.toLowerCase();
      list = list.filter((c) => 
        (c.name || "").toLowerCase().includes(q) ||
        (c.role || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
      );
    }

    // Filter by rating
    if (conRatingFilter !== "ALL") {
      const rVal = conRatingFilter === "NONE" ? null : parseInt(conRatingFilter);
      list = list.filter((c) => {
        const itemRating = c.Ratting !== undefined ? c.Ratting : c.Rating;
        if (rVal === null) return itemRating === undefined || itemRating === null;
        return itemRating === rVal;
      });
    }

    // Sort by rating or Quick Sort
    if (conQuickSort !== "none") {
      list.sort((a, b) => {
        if (conQuickSort === "name-asc") {
          return (a.name || "").localeCompare(b.name || "");
        }
        if (conQuickSort === "name-desc") {
          return (b.name || "").localeCompare(a.name || "");
        }
        if (conQuickSort === "modified-desc") {
          const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return tB - tA;
        }
        return 0;
      });
    } else if (conSortDir !== "none") {
      list.sort((a, b) => {
        const rA = a.Ratting !== undefined ? a.Ratting : (a.Rating !== undefined ? a.Rating : -1);
        const rB = b.Ratting !== undefined ? b.Ratting : (b.Rating !== undefined ? b.Rating : -1);
        return conSortDir === "asc" ? rA - rB : rB - rA;
      });
    }

    return list;
  }, [contacts, conSearch, conRatingFilter, conSortDir, conQuickSort]);

  const displayedEntities = useMemo(() => {
    let list = [...visibleEntities];

    // Filter by search query
    if (entSearch.trim()) {
      const q = entSearch.toLowerCase();
      list = list.filter((e) => 
        (e.name || "").toLowerCase().includes(q) ||
        (e.location || "").toLowerCase().includes(q) ||
        (e.City || "").toLowerCase().includes(q) ||
        (e.industry || "").toLowerCase().includes(q) ||
        (e.tier || "").toLowerCase().includes(q) ||
        (e.Website || "").toLowerCase().includes(q)
      );
    }

    // Filter by rating
    if (entRatingFilter !== "ALL") {
      const rVal = entRatingFilter === "NONE" ? null : parseInt(entRatingFilter);
      list = list.filter((e) => {
        const itemRating = e.Rating;
        if (rVal === null) return itemRating === undefined || itemRating === null;
        return itemRating === rVal;
      });
    }

    // Sort by rating
    if (entSortDir !== "none") {
      list.sort((a, b) => {
        const rA = a.Rating !== undefined ? a.Rating : -1;
        const rB = b.Rating !== undefined ? b.Rating : -1;
        return entSortDir === "asc" ? rA - rB : rB - rA;
      });
    }

    return list;
  }, [visibleEntities, entSearch, entRatingFilter, entSortDir]);

  const filteredAndSortedNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = visibleNotes.filter((note) => {
      if (!q) return true;
      return (
        note.content.toLowerCase().includes(q) ||
        note.author.toLowerCase().includes(q)
      );
    });
    return filtered.sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [visibleNotes, searchQuery]);

  const linkedDocs = useMemo(() => {
    if (!selectedItem) return [];
    return visibleDocuments.filter((d) => d.linkedToType === selectedItem.dataType && d.linkedToId === selectedItem.data.id);
  }, [selectedItem, visibleDocuments]);

  // Options to link unassigned elements
  const availableUnlinkedTags = useMemo(() => {
    if (!selectedItem || !["interaction", "contact", "entity", "engagement"].includes(selectedItem.dataType)) return [];
    const used = selectedItem.data.tagIds || [];
    return tags.filter((t) => !used.includes(t.id));
  }, [selectedItem, tags]);

  const handleLinkTag = () => {
    if (!selectedTagToLink || !selectedItem || !["interaction", "contact", "entity", "engagement"].includes(selectedItem.dataType)) return;
    const updated = {
      ...selectedItem.data,
      tagIds: [...(selectedItem.data.tagIds || []), selectedTagToLink]
    };
    
    if (selectedItem.dataType === "interaction") {
      setInteractions((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } else if (selectedItem.dataType === "contact") {
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } else if (selectedItem.dataType === "entity") {
      setEntities((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } else if (selectedItem.dataType === "engagement") {
      setEngagements((prev) => prev.map((eg) => (eg.id === updated.id ? updated : eg)));
    }

    setSelectedItem({ ...selectedItem, data: updated });
    setSelectedTagToLink("");
    showToast("Workspace tag connection mapped.", "success");
    
    const endpointMap: Record<string, string> = {
      interaction: "interactions",
      contact: "contacts",
      entity: "entities",
      engagement: "engagements"
    };
    syncToServer(`/api/${endpointMap[selectedItem.dataType]}/${updated.id}`, "PUT", updated);
  };

  const handleUnlinkTag = (tagId: string) => {
    if (!selectedItem || !["interaction", "contact", "entity", "engagement"].includes(selectedItem.dataType)) return;
    const updated = {
      ...selectedItem.data,
      tagIds: (selectedItem.data.tagIds || []).filter((id: string) => id !== tagId)
    };

    if (selectedItem.dataType === "interaction") {
      setInteractions((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } else if (selectedItem.dataType === "contact") {
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } else if (selectedItem.dataType === "entity") {
      setEntities((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } else if (selectedItem.dataType === "engagement") {
      setEngagements((prev) => prev.map((eg) => (eg.id === updated.id ? updated : eg)));
    }

    setSelectedItem({ ...selectedItem, data: updated });
    showToast("Workspace tag connection unlinked.", "info");

    const endpointMap: Record<string, string> = {
      interaction: "interactions",
      contact: "contacts",
      entity: "entities",
      engagement: "engagements"
    };
    syncToServer(`/api/${endpointMap[selectedItem.dataType]}/${updated.id}`, "PUT", updated);
  };

  const handleCreateAndLinkTag = () => {
    if (!newTagName.trim() || !selectedItem || !["interaction", "contact", "entity", "engagement"].includes(selectedItem.dataType)) return;
    const tagId = `tag-${Date.now()}`;
    const newTag: CustomTag = { id: tagId, name: newTagName.trim(), color: newTagColor };
    setTags((prev) => [...prev, newTag]);
    syncToServer("/api/tags", "POST", newTag);
    
    const updated = {
      ...selectedItem.data,
      tagIds: [...(selectedItem.data.tagIds || []), tagId]
    };

    if (selectedItem.dataType === "interaction") {
      setInteractions((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } else if (selectedItem.dataType === "contact") {
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } else if (selectedItem.dataType === "entity") {
      setEntities((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } else if (selectedItem.dataType === "engagement") {
      setEngagements((prev) => prev.map((eg) => (eg.id === updated.id ? updated : eg)));
    }

    setSelectedItem({ ...selectedItem, data: updated });
    setNewTagName("");
    showToast(`New tag #${newTagName} established and linked.`, "success");

    const endpointMap: Record<string, string> = {
      interaction: "interactions",
      contact: "contacts",
      entity: "entities",
      engagement: "engagements"
    };
    syncToServer(`/api/${endpointMap[selectedItem.dataType]}/${updated.id}`, "PUT", updated);
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim() || !newNoteSubject.trim() || !selectedItem) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
      author: session?.name || "David J.",
      linkedToType: selectedItem.dataType,
      linkedToId: selectedItem.data.id,
      Subject: newNoteSubject.trim(),
      visibility: newNoteVisibility
    };
    setNotes((prev) => [...prev, newNote]);
    setNewNoteContent("");
    setNewNoteSubject("");
    setNewNoteVisibility("Public");
    showToast("Linked activity log note added.", "success");
    syncToServer("/api/notes", "POST", newNote);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    showToast("Linked note log discarded.", "info");
    syncToServer(`/api/notes/${noteId}`, "DELETE");
  };

  const handleTogglePinNote = (noteId: string) => {
    let targetNote: Note | undefined;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const updated = { ...n, pinned: n.pinned ? 0 : 1 };
          targetNote = updated;
          return updated;
        }
        return n;
      })
    );
    // Use a small timeout or wait to sync
    setTimeout(() => {
      // Find the updated note from the setNotes update, or construct it
      const currentNotes = JSON.parse(localStorage.getItem("crm_notes") || "[]");
      const found = currentNotes.find((n: Note) => n.id === noteId);
      if (found) {
        syncToServer("/api/notes", "POST", found);
        showToast(found.pinned ? "Ledger note pinned to top." : "Ledger note unpinned.", "success");
      }
    }, 100);
  };

  const handleAddDocument = () => {
    if (!newDocTitle.trim() || !selectedItem) {
      showToast("Please provide document file name.", "error");
      return;
    }
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      fileType: newDocType,
      fileSize: newDocSize.trim() || "1.4 MB",
      uploadedAt: new Date().toISOString(),
      linkedToType: selectedItem.dataType as any,
      linkedToId: selectedItem.data.id,
      tagIds: newDocTags,
      author: session?.name || "David Jenkins",
      visibility: newDocVisibility
    };
    setDocuments((prev) => [...prev, newDoc]);
    setNewDocTitle("");
    setNewDocSize("");
    setNewDocTags([]);
    setNewDocVisibility("Public");
    showToast("Corporate document attachment linked in database.", "success");
    syncToServer("/api/documents", "POST", newDoc);
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    showToast("Document reference attachment removed.", "info");
    syncToServer(`/api/documents/${docId}`, "DELETE");
  };

  const handleChangeNoteVisibility = (noteId: string, visibility: "Private" | "Team" | "Public") => {
    let allowed = false;
    let message = "";
    
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const owner = isOwner(n);
          const isAdmin = session?.role === "Senior Analyst";
          
          if (!owner && !isAdmin) {
            message = "Permission Denied: Only the owner of this note can change its visibility.";
            return n;
          }
          if (visibility === "Private" && !owner) {
            message = "Access Rejected: Admins cannot change non-owned notes to Private.";
            return n;
          }
          
          allowed = true;
          const updated = { ...n, visibility };
          syncToServer("/api/notes", "POST", updated);
          return updated;
        }
        return n;
      })
    );
    
    if (allowed) {
      showToast(`Note visibility updated to ${visibility}.`, "success");
    } else if (message) {
      showToast(message, "error");
    }
  };

  const handleChangeDocVisibility = (docId: string, visibility: "Private" | "Team" | "Public") => {
    let allowed = false;
    let message = "";
    
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          const owner = isOwner(d);
          const isAdmin = session?.role === "Senior Analyst";
          
          if (!owner && !isAdmin) {
            message = "Permission Denied: Only the owner of this document can change its visibility.";
            return d;
          }
          if (visibility === "Private" && !owner) {
            message = "Access Rejected: Admins cannot change non-owned documents to Private.";
            return d;
          }
          
          allowed = true;
          const updated = { ...d, visibility };
          syncToServer(`/api/documents/${d.id}`, "PUT", updated);
          return updated;
        }
        return d;
      })
    );
    
    if (allowed) {
      showToast(`Document visibility updated to ${visibility}.`, "success");
    } else if (message) {
      showToast(message, "error");
    }
  };

  const adminOverrideItems = useMemo(() => {
    const wrappedNotes = notes.map(n => {
      const owner = isOwner(n);
      const isRestricted = !owner && (n.visibility === "Private" || n.visibility === "Team");
      return {
        id: n.id,
        itemType: "note" as const,
        titleOrSubject: n.Subject || "General Operational Note",
        displayContent: isRestricted ? "•••••••• [Content Masked for Administrative Privacy]" : n.content,
        author: n.author || "System Operator",
        uploadedOrCreated: n.createdAt,
        visibility: (n.visibility || "Public") as "Private" | "Team" | "Public",
        linkedToType: n.linkedToType,
        linkedToId: n.linkedToId,
      };
    });

    const wrappedDocs = documents.map(d => {
      return {
        id: d.id,
        itemType: "doc" as const,
        titleOrSubject: d.title,
        displayContent: `File Type: ${d.fileType} (${d.fileSize})`,
        author: d.author || "System Operator",
        uploadedOrCreated: d.uploadedAt,
        visibility: (d.visibility || "Public") as "Private" | "Team" | "Public",
        linkedToType: d.linkedToType,
        linkedToId: d.linkedToId,
      };
    });

    let allItems = [...wrappedNotes, ...wrappedDocs];

    if (adminVisibilityTypeFilter !== "ALL") {
      allItems = allItems.filter(item => item.itemType === adminVisibilityTypeFilter);
    }

    if (adminVisibilityLevelFilter !== "ALL") {
      allItems = allItems.filter(item => item.visibility === adminVisibilityLevelFilter);
    }

    if (adminVisibilitySearch.trim()) {
      const q = adminVisibilitySearch.toLowerCase();
      allItems = allItems.filter(item => 
        item.titleOrSubject.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }

    return allItems;
  }, [notes, documents, session, adminVisibilityTypeFilter, adminVisibilityLevelFilter, adminVisibilitySearch]);

  const handleBulkChangeVisibility = (visibility: "Team" | "Public") => {
    if (selectedAdminItemIds.length === 0) {
      showToast("Please select at least one item list entry to apply bulk change.", "error");
      return;
    }

    let notesUpdated = 0;
    let docsUpdated = 0;

    setNotes((prevNotes) =>
      prevNotes.map((n) => {
        if (selectedAdminItemIds.includes(n.id)) {
          notesUpdated++;
          const updated = { ...n, visibility };
          syncToServer("/api/notes", "POST", updated);
          return updated;
        }
        return n;
      })
    );

    setDocuments((prevDocs) =>
      prevDocs.map((d) => {
        if (selectedAdminItemIds.includes(d.id)) {
          docsUpdated++;
          const updated = { ...d, visibility };
          syncToServer(`/api/documents/${d.id}`, "PUT", updated);
          return updated;
        }
        return d;
      })
    );

    showToast(`Successfully overridden visibility to '${visibility}' for ${selectedAdminItemIds.length} items (${notesUpdated} notes, ${docsUpdated} documents).`, "success");
    setSelectedAdminItemIds([]);
  };

  const getColorClasses = (color: CustomTag["color"]) => {
    switch (color) {
      case "red": return "bg-rose-50 border-rose-200 text-rose-700";
      case "amber": return "bg-amber-50 border-amber-200 text-amber-700";
      case "emerald": return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "purple": return "bg-purple-50 border-purple-200 text-purple-700";
      case "indigo": return "bg-indigo-50 border-indigo-200 text-indigo-700";
      default: return "bg-blue-50 border-blue-200 text-blue-700";
    }
  };

  const getStatusClasses = (status: Interaction["status"]) => {
    switch (status) {
      case "COMPLETED":
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
          dot: "bg-emerald-500",
          border: "border-l-4 border-l-emerald-500",
          text: "COMPLETED"
        };
      case "BLOCKED":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-700",
          dot: "bg-rose-500",
          border: "border-l-4 border-l-rose-500",
          text: "BLOCKED"
        };
      case "IN PROGRESS":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-500",
          dot: "bg-amber-500",
          border: "border-l-4 border-l-amber-500",
          text: "IN PROGRESS"
        };
      case "SCHEDULED":
        return {
          bg: "bg-blue-50 border-blue-200 text-blue-600",
          dot: "bg-blue-500",
          border: "border-l-4 border-l-blue-500",
          text: "SCHEDULED"
        };
      case "CANCELED":
        return {
          bg: "bg-slate-100 border-slate-300 text-slate-500",
          dot: "bg-slate-400",
          border: "border-l-4 border-l-slate-400",
          text: "CANCELED"
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-200 text-slate-500",
          dot: "bg-slate-400",
          border: "border-l-4 border-l-slate-400",
          text: status
        };
    }
  };

  // Secure Auth Console Intercept
  if (!session) {
    return (
      <div id="secure-auth-workspace" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans text-slate-300">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-8 space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 bg-blue-600 rounded-xl items-center justify-center text-white font-extrabold text-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              E
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Enterprise Alignment Hub</h2>
            <p className="text-xs text-slate-500">Security-authenticated interaction and document link portal</p>
          </div>

          {authScreen === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Operator Coordinates (Email)</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="david@enterprise.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 pl-10 rounded-lg text-white placeholder-slate-600 focus:border-blue-500 outline-none text-xs transition"
                  />
                  <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Passphrase</label>
                  <button type="button" onClick={() => setAuthScreen("reset")} className="text-[10px] text-blue-500 hover:underline">Reset Token</button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 pl-10 pr-10 rounded-lg text-white placeholder-slate-600 focus:border-blue-500 outline-none text-xs transition"
                  />
                  <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-500">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold tracking-wide shadow-lg flex justify-center items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Authenticate Operator
              </button>

              <div className="pt-2 border-t border-slate-800 text-center text-[11px] text-slate-500">
                New user? <button type="button" onClick={() => setAuthScreen("signup")} className="text-blue-500 font-bold hover:underline">Register Profile</button>
              </div>
            </form>
          )}

          {authScreen === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Julianne Apex"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Passphrase</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Confirm Passphrase</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm passphrase"
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs outline-none"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold tracking-wide">
                Establish Corporate Operator Profile
              </button>
              <div className="text-center text-[11px] text-slate-500">
                Back to <button type="button" onClick={() => setAuthScreen("login")} className="text-blue-500 hover:underline">Access Console</button>
              </div>
            </form>
          )}

          {authScreen === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Registered Email</label>
                <input
                  type="email"
                  required
                  placeholder="david@enterprise.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Operator Name (Exact Match)</label>
                <input
                  type="text"
                  required
                  placeholder="David Jenkins"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs outline-none"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold">
                Reset Access Token
              </button>
              <div className="text-center text-[11px] text-slate-500">
                Cancel reset and <button type="button" onClick={() => setAuthScreen("login")} className="text-blue-500 hover:underline">Go Back</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const th = getThemeClasses(uiSettings.theme);

  return (
    <div id="enterprise-crm-workspace" className={`min-h-screen flex antialiased font-sans transition-colors duration-200 ${th.bg}`}>
      
      {/* Dynamic Notifications Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl flex items-center justify-between gap-3 border transition-all duration-300 ${
              t.type === "success"
                ? "bg-white border-emerald-100 text-slate-900"
                : t.type === "error"
                ? "bg-rose-50 border-rose-100 text-rose-900"
                : "bg-slate-900 border-slate-800 text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === "success" && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />}
              {t.type === "error" && <div className="w-2 h-2 bg-rose-500 rounded-full" />}
              {t.type === "info" && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
              <span className="text-xs font-medium">{t.message}</span>
            </div>
            <button onClick={() => setToasts((prev) => prev.filter((to) => to.id !== t.id))} className="text-slate-400 hover:text-slate-600 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside id="crm-sidebar" className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0 text-slate-300">
        <div className="p-6 mb-2 flex items-center gap-3 border-b border-slate-800/60">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold select-none">
            E
          </div>
          <div className="flex flex-col">
            <span className="text-white font-semibold text-base tracking-tight leading-none">Enterprise CRM</span>
            <span className="text-[10px] text-slate-500 font-mono mt-1">Unified Links Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => { setActiveTab("dashboard"); setSelectedItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "dashboard" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-500" /> Dashboard
          </button>

          <button
            onClick={() => { setActiveTab("engagements"); setSelectedItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "engagements" ? "bg-slate-800 text-white animate-pulse" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Handshake className="w-4 h-4 text-sky-400" /> Engagements
          </button>

          <button
            onClick={() => { setActiveTab("interactions"); setSelectedItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "interactions" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" /> Interactions
          </button>

          <button
            onClick={() => { setActiveTab("contacts"); setSelectedItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "contacts" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-500" /> Contacts
          </button>

          <button
            onClick={() => { setActiveTab("entities"); setSelectedItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "entities" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <MapPin className="w-4 h-4 text-purple-500" /> Companies
          </button>

          <div className="pt-4 pb-2 border-t border-slate-800">
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Workspace Vaults</span>
          </div>

          <button
            onClick={() => { setActiveTab("notes"); setSelectedItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "notes" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Notebook className="w-4 h-4 text-indigo-400" /> Notes Ledger
          </button>

          <button
            onClick={() => { setActiveTab("documents"); setSelectedItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "documents" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Paperclip className="w-4 h-4 text-violet-400" /> Document Vault
          </button>

           <button
            onClick={() => { setActiveTab("users"); setSelectedItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "users" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <UserCheck className="w-4 h-4 text-pink-400" /> User Management
          </button>

          <button
            onClick={() => { setActiveTab("settings"); setSelectedItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "settings" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Settings className="w-4 h-4 text-teal-400" /> Settings Console
          </button>

          {session?.role === "Senior Analyst" && (
            <>
              <button
                onClick={() => { setActiveTab("tags"); setSelectedItem(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "tags" ? "bg-slate-800 text-white" : "text-sky-400/90 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Tag className="w-4 h-4 text-sky-400" /> Administrative Tag Groups
              </button>

              <button
                onClick={() => { setActiveTab("audit"); setSelectedItem(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "audit" ? "bg-slate-800 text-white" : "text-amber-400/90 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" /> System Audit Ledger
              </button>

              <button
                onClick={() => { setActiveTab("admin-visibility"); setSelectedItem(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "admin-visibility" ? "bg-slate-800 text-white" : "text-rose-400/90 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Lock className="w-4 h-4 text-rose-450" /> Admin Visibility Override
              </button>
            </>
          )}
        </nav>

        {/* Operational Diagnostics statistics sidebar */}
        <div className="mx-4 p-3.5 bg-slate-950/80 border border-slate-800/50 rounded-xl mb-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            <span>Link Sync Diagnostic</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Total Logged Links</span>
            <strong className="text-white font-mono">{tags.length + visibleNotes.length + visibleDocuments.length}</strong>
          </div>
        </div>

        {/* Security Session details */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white uppercase select-none shrink-0 border border-blue-500/30">
              {session.name ? session.name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "DJ"}
            </div>
            <div className="overflow-hidden leading-none space-y-1">
              <p className="text-xs text-white font-semibold truncate">{session.name || "Operator"}</p>
              <p className="text-[10px] text-slate-500 truncate">{session.role || "Operator Unit"}</p>
            </div>
          </div>
          <button onClick={handleLogout} title="Log Out Console" className="p-1.5 hover:bg-rose-950/40 rounded text-slate-400 hover:text-rose-400">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search Interactions, Contacts, Companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border border-transparent rounded-lg py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)} 
                className="p-2 text-slate-400 hover:text-slate-600 relative hover:bg-slate-50 rounded-lg transition-colors duration-200"
                id="notification-bell-btn"
              >
                <Bell className="w-5 h-5" />
                {allNotifications.filter((n) => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white antialiased scale-95 animate-bounce">
                    {allNotifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                  <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 text-xs">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center font-bold">
                      <span className="text-slate-700">Real-Time Event Feed ({allNotifications.filter((n) => !n.isRead).length} critical)</span>
                      {allNotifications.filter((n) => !n.isRead).length > 0 && (
                        <button 
                          onClick={() => {
                            markAllNotificationsAsRead();
                            markAllVirtualNotifsAsRead(virtualNotifications.map((v) => v.id));
                          }} 
                          className="text-blue-600 hover:text-blue-800 hover:underline text-[10px] transition-colors font-bold cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 leading-tight">
                      {allNotifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                          <Bell className="w-8 h-8 text-slate-200" />
                          <p className="italic">No events logged in the workspace</p>
                        </div>
                      ) : (
                        allNotifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`px-4 py-3 hover:bg-slate-50/50 flex items-start justify-between gap-3 transition duration-150 ${
                              !notif.isRead ? "bg-blue-50/20" : ""
                            }`}
                          >
                            <div className="flex gap-2">
                              <span className="text-base shrink-0 select-none mt-0.5">
                                {notif.id.startsWith("notif-impending-") ? "⏰" : notif.actionType === "create" ? "🆕" : notif.actionType === "update" ? "🔄" : "🗑️"}
                              </span>
                              <div className="space-y-1">
                                <p className={`text-slate-700 text-[11px] leading-snug ${!notif.isRead ? "font-semibold" : ""}`}>
                                  {notif.message}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>•</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wide ${
                                    notif.id.startsWith("notif-impending-") ? "bg-amber-100 text-amber-850" : "bg-slate-100 text-slate-500"
                                  }`}>
                                    {notif.entityTier}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {!notif.isRead && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (notif.id.startsWith("notif-impending-")) {
                                    markVirtualNotifAsRead(notif.id);
                                  } else {
                                    markNotificationAsRead(notif.id);
                                  }
                                }} 
                                title="Mark as read"
                                className="p-1 hover:bg-emerald-50 text-emerald-600 rounded shrink-0 self-center transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <button
              onClick={() => {
                if (activeTab === "contacts") setNewType("contact");
                else if (activeTab === "entities") setNewType("entity");
                else setNewType("interaction");
                setIsNewModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Registry
            </button>

            {/* QUICK-ACCESS MENU */}
            <div className="relative">
              <button
                onClick={() => setIsQuickAccessOpen(!isQuickAccessOpen)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg font-mono uppercase tracking-wide font-extrabold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="SOP Quick Action Menu"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Quick Access
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isQuickAccessOpen ? "rotate-180" : ""}`} />
              </button>

              {isQuickAccessOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsQuickAccessOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-1 text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                      One-Click Actions
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setNewType("interaction");
                          setIntForm({
                            subject: "",
                            type: "Meeting",
                            assignee: "",
                            status: "IN PROGRESS",
                            client: "",
                            date: new Date().toISOString().split("T")[0],
                            summary: "",
                            Note: "",
                            PrevInteraction: null,
                            followUpDate: "",
                            followUpNotes: "",
                            followUpCompleted: false,
                            duration: ""
                          });
                          setIsNewModalOpen(true);
                          setIsQuickAccessOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer text-xs"
                      >
                        <span className="text-sm">📝</span>
                        <span>Log Meeting / Touchpoint</span>
                      </button>

                      <button
                        onClick={() => {
                          setNewType("contact");
                          setContactForm({
                            FirstName: "",
                            LastName: "",
                            company: "",
                            email: "",
                            phone: "",
                            position: "",
                            linkedin: "",
                            notes: "",
                            tags: []
                          });
                          setIsNewModalOpen(true);
                          setIsQuickAccessOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer text-xs"
                      >
                        <span className="text-sm">👤</span>
                        <span>Add Contact Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setNewType("entity");
                          setEntityForm({
                            name: "",
                            industry: "",
                            tier: "Tier-1",
                            location: "",
                            domain: "",
                            size: "Medium",
                            City: "",
                            Website: "",
                            Rating: 3
                          });
                          setIsNewModalOpen(true);
                          setIsQuickAccessOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer text-xs"
                      >
                        <span className="text-sm">🏢</span>
                        <span>Add Company / Industry</span>
                      </button>

                      <button
                        onClick={() => {
                          setNewType("engagement");
                          setEngagementForm({
                            title: "",
                            type: "",
                            commencementDate: new Date().toISOString().split("T")[0],
                            status: "Pre-Agreement",
                            description: "",
                            ownerEmail: session?.email || "david@jenkins.com"
                          });
                          setIsNewModalOpen(true);
                          setIsQuickAccessOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer text-xs"
                      >
                        <span className="text-sm">🤝</span>
                        <span>Create Engagement</span>
                      </button>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsQuickAccessOpen(false);
                          const title = prompt("Enter Document Title / Code:");
                          if (title) {
                            const newDocObj: Document = {
                              id: `doc-${Date.now()}`,
                              title,
                              fileType: "PDF",
                              fileSize: "1.6 MB",
                              uploadedAt: new Date().toISOString().split("T")[0],
                              linkedToType: "interaction",
                              linkedToId: "general",
                              author: session?.name || "System Operator",
                              visibility: "Public"
                            };
                            setDocuments([newDocObj, ...documents]);
                            showToast(`Document '${title}' index registered directly.`, "success");
                            syncToServer("/api/documents", "POST", newDocObj);
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-indigo-700 font-bold cursor-pointer text-xs"
                      >
                        <span className="text-sm">📂</span>
                        <span>Upload/Index Document</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE TARGET PAGES */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* TAB 1: EXECUTIVE DASHBOARD CONTAINER (NO CHARTS, DYNAMIC INTERACTIONS FEED) */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Impending / Due Soon Alerts Notification Banner */}
              {impendingInteractions.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-sm text-xs leading-relaxed animate-in slide-in-from-top-4 duration-300">
                  <span className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold font-mono">⏰</span>
                    </span>
                  </span>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-bold text-amber-850 font-mono text-[11px] uppercase tracking-wider">SYS ALIGNMENT FEED: {impendingInteractions.length} CRITICAL TOUCHPOINTS {"(< 24 HOURS)"}</h4>
                    <p className="text-slate-600 text-[11px]">
                      The system watchdog has detected scheduled or blocked Touchpoint interactions. Click any ticket block below to update state:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono">
                      {impendingInteractions.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem({ dataType: "interaction", data: item })}
                          className="bg-white hover:bg-slate-50 border border-amber-200/80 px-2 py-1 rounded-md text-[10px] text-slate-700 font-semibold cursor-pointer shadow-xs transition hover:scale-102 flex items-center gap-1.5"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                          <span className="font-bold text-[9px] uppercase text-slate-400">{item.status}</span>
                          <span className="text-slate-800 font-sans">{item.subject}</span>
                          <span className="text-[9px] text-amber-700 font-bold">({item.date})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Dynamic KPI Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                <div onClick={() => setActiveTab("interactions")} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Touchpoint Logs</p>
                      <p className="text-2xl font-extrabold text-slate-900 font-mono leading-none">{interactions.length}</p>
                    </div>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-4 h-4" /></div>
                  </div>
                  <p className="mt-2 text-[9px] text-slate-400">Interactions stream</p>
                </div>

                <div onClick={() => setActiveTab("engagements")} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Corporate Engagements</p>
                      <p className="text-2xl font-extrabold text-slate-900 font-mono leading-none">{engagements.length}</p>
                    </div>
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-lg"><Handshake className="w-4 h-4" /></div>
                  </div>
                  <p className="mt-2 text-[9px] text-sky-600 font-bold font-mono">Active SOW state</p>
                </div>

                <div onClick={() => setActiveTab("contacts")} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Roster Contacts</p>
                      <p className="text-2xl font-extrabold text-slate-900 font-mono leading-none">{contacts.length}</p>
                    </div>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Users className="w-4 h-4" /></div>
                  </div>
                  <p className="mt-2 text-[9px] text-slate-400">Indexed stakeholder profiles</p>
                </div>

                <div onClick={() => setActiveTab("entities")} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Global Companies</p>
                      <p className="text-2xl font-extrabold text-slate-900 font-mono leading-none">{entities.length}</p>
                    </div>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><MapPin className="w-4 h-4" /></div>
                  </div>
                  <p className="mt-2 text-[9px] text-slate-400">Strategic company entries</p>
                </div>

                <div onClick={() => setActiveTab("documents")} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Document Vault</p>
                      <p className="text-2xl font-extrabold text-slate-900 font-mono leading-none">{visibleDocuments.length}</p>
                    </div>
                    <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><Paperclip className="w-4 h-4" /></div>
                  </div>
                  <p className="mt-2 text-[9px] text-slate-400">Indexed links and items</p>
                </div>

                <div onClick={() => setActiveTab("notes")} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes Ledger</p>
                      <p className="text-2xl font-extrabold text-slate-900 font-mono leading-none">{visibleNotes.length}</p>
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Notebook className="w-4 h-4" /></div>
                  </div>
                  <p className="mt-2 text-[9px] text-indigo-600 font-bold">Active link ledger</p>
                </div>
              </div>

              {/* Quick Action Control Hub */}
              <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-slate-900 font-bold text-sm tracking-tight flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-pink-500" /> Enterprise Operator & Vault Control Hub
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage system security operators, explore centralized notes, store documents and manage engagements directly.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto shrink-0 justify-end">
                  <button onClick={() => { setActiveTab("engagements"); setSelectedItem(null); }} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200 cursor-pointer">
                    <Handshake className="w-3.5 h-3.5 text-sky-505" /> SOW Engagements
                  </button>
                  <button onClick={() => { setActiveTab("notes"); setSelectedItem(null); }} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200 cursor-pointer">
                    <Notebook className="w-3.5 h-3.5 text-indigo-505" /> Notes Ledger
                  </button>
                  <button onClick={() => { setActiveTab("documents"); setSelectedItem(null); }} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200 cursor-pointer">
                    <Paperclip className="w-3.5 h-3.5 text-violet-505" /> Document Vault
                  </button>
                  <button onClick={() => { setActiveTab("users"); setSelectedItem(null); }} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer">
                    <UserCheck className="w-3.5 h-3.5" /> Operator Seats
                  </button>
                </div>
              </div>

              {/* TWO COLUMN ECOSYSTEM OVERVIEW (NO CHARTS) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Timeline activity list */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[450px]">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight">Active Interactions Timeline</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Continuous corporate activity logs and linked attributes stream</p>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6 overflow-y-auto max-h-[450px] divide-y divide-slate-100">
                    {interactions.map((item) => {
                      const intNotes = visibleNotes.filter((n) => n.linkedToType === "interaction" && n.linkedToId === item.id);
                      const intDocs = visibleDocuments.filter((d) => d.linkedToType === "interaction" && d.linkedToId === item.id);
                      return (
                        <div key={item.id} className="pt-4 first:pt-0 group">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              {(() => {
                                const statusInfo = getStatusClasses(item.status);
                                return (
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border shadow-sm ${statusInfo.bg}`}>
                                    <span className={`w-1 h-1 rounded-full ${statusInfo.dot}`} />
                                    {statusInfo.text}
                                  </span>
                                );
                              })()}
                              <span
                                onClick={() => setSelectedItem({ dataType: "interaction", data: item })}
                                className="font-bold text-xs text-slate-950 hover:text-blue-600 cursor-pointer block transition"
                              >
                                {item.subject}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border bg-slate-50 border-slate-200 text-slate-500">
                                {item.type}
                              </span>
                              {item.duration !== undefined && item.duration !== null && item.duration !== "" && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border bg-indigo-50 border-indigo-200 text-indigo-605 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> {item.duration} mins
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                          </div>

                          <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.summary}</p>

                          {/* Contact roles inside this interaction */}
                          {item.contactRoles && Object.keys(item.contactRoles).length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mb-3 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100">
                              <span className="text-[9px] font-extrabold uppercase tracking-wide font-mono text-slate-400">Interaction Stakeholders:</span>
                              {Object.entries(item.contactRoles).map(([contactId, roleName]) => {
                                const contactObj = contacts.find((c) => c.id === contactId);
                                if (!contactObj) return null;
                                return (
                                  <span key={contactId} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-[9px] text-slate-600 font-semibold shadow-sm">
                                    <span className="font-bold text-slate-800">{contactObj.name}</span>
                                    <span className="text-slate-400 font-mono text-[8px] uppercase tracking-wider">({roleName})</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-1">
                              {item.tagIds?.map((tId) => {
                                const activeTag = tags.find((t) => t.id === tId);
                                if (!activeTag) return null;
                                return (
                                  <span key={tId} className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${getColorClasses(activeTag.color)}`}>
                                    #{activeTag.name}
                                  </span>
                                );
                              })}
                              {item.tagIds?.length === 0 && <span className="text-[9px] text-slate-400 italic">No connected tags</span>}
                            </div>

                            <div className="flex gap-4 text-[10px] text-slate-400 font-semibold font-mono">
                              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {intNotes.length} notes</span>
                              <span className="flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" /> {intDocs.length} docs</span>
                              <span className="text-slate-500 font-sans font-bold">Assignee: {item.assignee}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right widgets: Tags index & Quick document links */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Next Follow Up Tracker / Planner Widget */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-600" /> Follow-up Planner Board
                      </h3>
                      <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase animate-pulse">PLANNER</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-4 font-semibold">Urgent scheduled next alignments and follow-up triggers</p>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {interactions.filter(i => i.followUpDate).length > 0 ? (
                        interactions
                          .filter(i => i.followUpDate)
                          .sort((a,b) => (a.followUpDate || "").localeCompare(b.followUpDate || ""))
                          .map((item) => {
                            const isCompleted = !!item.followUpCompleted;
                            return (
                              <div 
                                key={item.id} 
                                className={`p-3 rounded-lg border transition-all text-xs flex flex-col gap-1.5 ${
                                  isCompleted 
                                    ? "bg-slate-50/50 border-slate-100 text-slate-400" 
                                    : "bg-white border-slate-200 hover:border-indigo-200 text-slate-750 shadow-xs"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <input 
                                      type="checkbox"
                                      id={`dash-chk-${item.id}`}
                                      checked={isCompleted}
                                      onChange={() => {
                                        const updated = {
                                          ...item,
                                          followUpCompleted: !isCompleted
                                        };
                                        setInteractions(prev => prev.map(i => i.id === item.id ? updated : i));
                                        syncToServer(`/api/interactions/${item.id}`, "PUT", updated);
                                        showToast(
                                          isCompleted 
                                            ? `Follow-up reverted: ${item.subject}` 
                                            : `Follow-up completed: ${item.subject}`, 
                                          "success"
                                        );
                                      }}
                                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mt-0.5 cursor-pointer shrink-0"
                                    />
                                    <div>
                                      <span 
                                        onClick={() => setSelectedItem({ dataType: "interaction", data: item })}
                                        className={`font-semibold cursor-pointer hover:text-indigo-650 hover:underline ${isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}
                                      >
                                        {item.subject}
                                      </span>
                                      <p className="text-[9.5px] text-slate-400 mt-0.5 font-medium">Account: <span className="font-bold">{item.client}</span></p>
                                    </div>
                                  </div>
                                  <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded leading-none shrink-0 border uppercase ${
                                    isCompleted 
                                      ? "bg-slate-100 border-slate-200 text-slate-400" 
                                      : "bg-indigo-50 border-indigo-150 text-indigo-700"
                                  }`}>
                                    {item.followUpDate}
                                  </span>
                                </div>
                                {item.followUpNotes && (
                                  <div className={`p-2 rounded bg-slate-50/60 border border-slate-100 text-[10.5px] leading-relaxed italic ${isCompleted ? "text-slate-405" : "text-slate-600"}`}>
                                    "{item.followUpNotes}"
                                  </div>
                                )}
                                <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium">
                                  <span>Operator: <strong className="font-bold text-slate-650">{item.assignee}</strong></span>
                                  {isCompleted && <span className="text-emerald-600 font-bold flex items-center gap-0.5">✓ Resolved</span>}
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <p className="text-[11px] text-slate-400 italic text-center py-6 border border-dashed border-slate-200 rounded-lg">No future follow-up objectives listed</p>
                      )}
                    </div>
                  </div>

                  {/* Attachment Vault Tracker */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-1">Central Document Vault</h3>
                    <p className="text-[10px] text-slate-400 mb-4">Centralized secure link records index</p>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto modal-scroll pr-1">
                      {visibleDocuments.map((doc) => (
                        <div key={doc.id} className="p-3 bg-slate-50 border border-slate-100 hover:bg-slate-100 transition rounded-lg text-xs flex justify-between items-center">
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-slate-800 truncate" title={doc.title}>{doc.title}</p>
                              <span className="text-[9px] text-slate-400 font-mono">{doc.fileType} • {doc.fileSize}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => showToast(`Simulated download trigger: ${doc.title}`, "success")}
                            className="text-blue-600 hover:underline text-[10px] font-bold shrink-0"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: RICH KANBAN INTERACTIONS WORKSPACE */}
          {activeTab === "interactions" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Impending / Due Soon Alerts Notification Banner */}
              {impendingInteractions.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-sm text-xs leading-relaxed animate-in slide-in-from-top-4 duration-300">
                  <span className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold font-mono">⏰</span>
                    </span>
                  </span>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-bold text-amber-850 font-mono text-[11px] uppercase tracking-wider">CRITICAL WORKSPACE ALERT: TOUCHPOINT DEADLINES WITHIN 24 HOURS</h4>
                    <p className="text-slate-600 text-[11px]">
                      The system watchdog has detected scheduled or blocked Touchpoint interactions currently due within 24 hours. Click any ticket block below to update state:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono">
                      {impendingInteractions.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem({ dataType: "interaction", data: item })}
                          className="bg-white hover:bg-slate-50 border border-amber-200/80 px-2 py-1 rounded-md text-[10px] text-slate-700 font-semibold cursor-pointer shadow-xs transition hover:scale-102 flex items-center gap-1.5"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                          <span className="font-bold text-[9px] uppercase text-slate-400">{item.status}</span>
                          <span className="text-slate-800 font-sans">{item.subject}</span>
                          <span className="text-[9px] text-amber-700 font-bold">({item.date})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" /> Touchpoints & Deal Workspace
                  </h2>
                  <p className="text-xs text-slate-400">Process logs, meeting outcomes, and milestone schedules</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Master subview selector */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold gap-1 select-none border border-slate-200">
                    <button
                      onClick={() => setInteractionsSubView("list")}
                      className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                        interactionsSubView === "list"
                          ? "bg-white text-slate-905 shadow-xs border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      📋 Touchpoint Board
                    </button>
                    <button
                      onClick={() => setInteractionsSubView("gantt")}
                      className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                        interactionsSubView === "gantt"
                          ? "bg-white text-slate-905 shadow-xs border border-slate-200/50"
                          : "text-slate-550 hover:text-slate-955"
                      }`}
                    >
                      ⏳ Interdependency Gantt
                    </button>
                    <button
                      onClick={() => setInteractionsSubView("dashboard")}
                      className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                        interactionsSubView === "dashboard"
                          ? "bg-white text-slate-905 shadow-xs border border-slate-200/50"
                          : "text-slate-550 hover:text-slate-955"
                      }`}
                    >
                      📊 Operational Analytics
                    </button>
                  </div>

                  {/* Existing view toggle switch of Kanban vs Calendar */}
                  {interactionsSubView === "list" && (
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-sm">
                      <button
                        onClick={() => setInteractionsViewMode("kanban")}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          interactionsViewMode === "kanban"
                            ? "bg-white text-blue-600 shadow-xs border border-slate-200/40"
                            : "text-slate-500 hover:text-slate-905"
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Board
                      </button>
                      <button
                        onClick={() => setInteractionsViewMode("calendar")}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          interactionsViewMode === "calendar"
                            ? "bg-white text-blue-600 shadow-xs border border-slate-200/40"
                            : "text-slate-500 hover:text-slate-905"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Calendar list
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {interactionsSubView === "list" ? (
                <div className="space-y-6">

              {/* INTERACTION FILTER SYSTEM PANEL */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <Filter className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-mono">Workspace Query Filters</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Refine alignment tasks by designated agents and temporal sequences</p>
                    </div>
                  </div>
                  
                  {(interactionAssigneeFilter !== "ALL" || interactionTimeRangeFilter !== "ALL" || interactionStartDateFilter || interactionEndDateFilter) && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-extrabold rounded-md font-mono">
                        Matches: {filteredInteractions.length}
                      </span>
                      <button
                        onClick={() => {
                          setInteractionAssigneeFilter("ALL");
                          setInteractionTimeRangeFilter("ALL");
                          setInteractionStartDateFilter("");
                          setInteractionEndDateFilter("");
                        }}
                        className="px-2.5 py-1 text-[10px] font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Filter 1: Assignee */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider font-mono block">Designated Assignee</label>
                    <div className="relative">
                      <select
                        value={interactionAssigneeFilter}
                        onChange={(e) => setInteractionAssigneeFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer appearance-none"
                      >
                        <option value="ALL">All Assignees (Reset)</option>
                        {allAvailableAssignees.map((assignee) => (
                           <option key={assignee} value={assignee}>
                             👤 {assignee}
                           </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Filter 2: Time Range Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider font-mono block">Sequence Time Range</label>
                    <div className="relative">
                      <select
                        value={interactionTimeRangeFilter}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInteractionTimeRangeFilter(val);
                          if (val !== "CUSTOM") {
                            // Automatically clear specific custom dates if selecting quick presets
                            setInteractionStartDateFilter("");
                            setInteractionEndDateFilter("");
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer appearance-none"
                      >
                        <option value="ALL">All Logged Actions</option>
                        <option value="TODAY">📅 Today's Agenda</option>
                        <option value="WEEK">⏱️ Within 7 Days (±)</option>
                        <option value="MONTH">🗓️ Within 30 Days (±)</option>
                        <option value="FUTURE">🚀 Scheduled Future Tasks</option>
                        <option value="CUSTOM">🛠️ Custom Temporal Span...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Filter 3: Premium Date Range Picker Component */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider font-mono block">Custom Date Span</label>
                    <DateRangePicker
                      startDate={interactionStartDateFilter}
                      endDate={interactionEndDateFilter}
                      onChange={(start, end) => {
                        setInteractionStartDateFilter(start);
                        setInteractionEndDateFilter(end);
                        setInteractionTimeRangeFilter("CUSTOM");
                      }}
                      onClear={() => {
                        setInteractionStartDateFilter("");
                        setInteractionEndDateFilter("");
                        setInteractionTimeRangeFilter("ALL");
                      }}
                    />
                  </div>
                </div>

                {/* Filter 4: Interactive Status Filters */}
                <div className="border-t border-slate-100 pt-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider font-mono block">
                        Toggle Touchpoint Status Include/Exclude
                      </label>
                      <p className="text-[9.5px] text-slate-400 font-semibold leading-none mt-0.5">Click badges below to show/hide specific statuses in board and list views</p>
                    </div>
                    <div className="flex gap-2 text-[10px] h-5">
                      <button
                        type="button"
                        onClick={() => setInteractionStatusFilters(["IN PROGRESS", "SCHEDULED", "COMPLETED", "BLOCKED", "CANCELED"])}
                        className="font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-200">|</span>
                      <button
                        type="button"
                        onClick={() => setInteractionStatusFilters([])}
                        className="font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {(["IN PROGRESS", "SCHEDULED", "COMPLETED", "BLOCKED", "CANCELED"] as const).map((status) => {
                      const isSelected = interactionStatusFilters.includes(status);
                      const classMap = {
                        "IN PROGRESS": { active: "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100/70", dot: "bg-amber-500", label: "In Progress" },
                        "SCHEDULED": { active: "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100/70", dot: "bg-blue-500", label: "Scheduled" },
                        "COMPLETED": { active: "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100/70", dot: "bg-emerald-500", label: "Completed" },
                        "BLOCKED": { active: "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100/70", dot: "bg-rose-500", label: "Blocked" },
                        "CANCELED": { active: "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200/70", dot: "bg-slate-400", label: "Canceled" }
                      }[status];

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            setInteractionStatusFilters(prev =>
                              prev.includes(status)
                                ? prev.filter(s => s !== status)
                                : [...prev, status]
                            );
                          }}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 cursor-pointer shadow-3xs ${
                            isSelected
                              ? `${classMap.active} ring-1 ring-slate-100`
                              : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ring-2 ring-white ${isSelected ? classMap.dot : "bg-slate-300"}`} />
                          {classMap.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Batch Action Helper Header Control */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center h-5">
                    <input
                      id="select-all-interactions"
                      type="checkbox"
                      checked={filteredInteractions.length > 0 && selectedInteractionIds.length === filteredInteractions.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInteractionIds(filteredInteractions.map((i) => i.id));
                        } else {
                          setSelectedInteractionIds([]);
                        }
                      }}
                      className="w-4 h-4 cursor-pointer rounded border-slate-300 text-blue-605 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="select-all-interactions" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                      Select All Workspace Interactions
                    </label>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {selectedInteractionIds.length} of {filteredInteractions.length} alignment cards currently selected
                    </p>
                  </div>
                </div>

                {selectedInteractionIds.length > 0 && (
                  <button
                    onClick={() => setSelectedInteractionIds([])}
                    className="px-3 py-1 text-[11px] font-extrabold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-100 transition"
                  >
                    Clear Slate Selection ({selectedInteractionIds.length})
                  </button>
                )}
              </div>

              {interactionsViewMode === "kanban" ? (
                <div 
                  className="grid gap-6 animate-in fade-in duration-300"
                  style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`
                  }}
                >
                  
                  {/* Column Generator */}
                  {interactionStatusFilters.map((status) => {
                    const items = filteredInteractions.filter((i) => i.status === status);
                    const statusColors = {
                      "IN PROGRESS": { border: "border-amber-200", bg: "bg-amber-500", text: "text-amber-700" },
                      "SCHEDULED": { border: "border-blue-200", bg: "bg-blue-600", text: "text-blue-700" },
                      "COMPLETED": { border: "border-emerald-200", bg: "bg-emerald-600", text: "text-emerald-700" },
                      "BLOCKED": { border: "border-rose-200", bg: "bg-rose-500", text: "text-rose-700" },
                      "CANCELED": { border: "border-slate-200", bg: "bg-slate-400", text: "text-slate-650" }
                    }[status];

                    return (
                      <div key={status} className="bg-slate-100/60 border border-slate-200 p-4 rounded-xl flex flex-col space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusColors.text}`}>
                            <span className={`w-2 h-2 rounded-full ${statusColors.bg} animate-pulse`} />
                            {status} ({items.length})
                          </span>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                          {items.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic text-center py-6 border border-dashed border-slate-200 rounded-lg">No logged items</p>
                          ) : (
                            items.map((item) => {
                              const intNotes = visibleNotes.filter((n) => n.linkedToType === "interaction" && n.linkedToId === item.id);
                              const intDocs = visibleDocuments.filter((d) => d.linkedToType === "interaction" && d.linkedToId === item.id);
                              const cardStatus = getStatusClasses(item.status);
                              const isSelected = selectedInteractionIds.includes(item.id);
                              const isImpending = impendingInteractions.some((imp) => imp.id === item.id);
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => setSelectedItem({ dataType: "interaction", data: item })}
                                  className={`p-3.5 border rounded-lg cursor-pointer shadow-sm transition-all duration-250 ${
                                    isSelected 
                                      ? "bg-blue-50/50 border-blue-400 ring-2 ring-blue-100/50 scale-[0.99] shadow-inner" 
                                      : isImpending
                                        ? "bg-amber-50/30 border-amber-300 ring-1 ring-amber-100/40 hover:border-amber-400"
                                        : `bg-white hover:border-slate-400 ${cardStatus.border}`
                                  }`}
                                >
                                  <div className="flex justify-between items-center text-[9px] text-slate-400 mb-1.5 font-mono">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          setSelectedInteractionIds((prev) =>
                                            e.target.checked
                                              ? [...prev, item.id]
                                              : prev.filter((id) => id !== item.id)
                                          );
                                        }}
                                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                      />
                                      <span className="font-bold text-slate-500 uppercase">{item.type}</span>
                                      <span className={`inline-flex items-center gap-1 px-1 py-0.2 rounded text-[7px] font-extrabold border uppercase shadow-sm ${cardStatus.bg}`}>
                                        <span className={`w-1 h-1 rounded-full ${cardStatus.dot}`} />
                                        {cardStatus.text}
                                      </span>
                                      {isImpending && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-amber-100 text-amber-850 rounded text-[7.5px] font-extrabold border border-amber-300 uppercase tracking-wider animate-pulse">
                                          ⏰ Due soon
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-mono text-slate-400">{item.date}</span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-xs mb-1 hover:text-blue-600 transition leading-snug">{item.subject}</h4>
                                  <div className="flex justify-between items-center pb-1">
                                    <p className="text-[10px] text-slate-500 font-semibold">{item.client}</p>
                                    {item.duration !== undefined && item.duration !== null && item.duration !== "" && (
                                      <span className="text-[8.5px] text-indigo-650 font-bold bg-indigo-50 border border-indigo-100 px-1 py-0.2 rounded font-mono flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5 shrink-0" /> {item.duration}m
                                      </span>
                                    )}
                                  </div>

                                  {/* Parent Engagement linkage on Kanban Card */}
                                  {(() => {
                                    const matchingEngs = engagements.filter(eng => {
                                      if (item.engagementId) {
                                        return eng.id === item.engagementId;
                                      }
                                      return eng.client === item.client && eng.startDate <= item.date && eng.endDate >= item.date;
                                    });
                                    if (matchingEngs.length === 0) return null;
                                    return (
                                      <div className="mt-1 pb-1.5 flex flex-wrap gap-1">
                                        {matchingEngs.map((eng) => (
                                          <button
                                            key={eng.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveTab("engagements");
                                              setSelectedItem({ dataType: "engagement", data: eng });
                                              setSelectedEngagementForView(eng);
                                            }}
                                            title={`Associated Engagement: ${eng.title}. Click to view details.`}
                                            className="w-full text-left inline-flex items-center gap-1 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-750 border border-indigo-150/60 hover:border-indigo-250 px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition max-w-full truncate"
                                          >
                                            <Briefcase className="w-2.5 h-2.5 text-indigo-500/80 shrink-0" />
                                            <span className="truncate flex-1">Part of: {eng.title}</span>
                                          </button>
                                        ))}
                                      </div>
                                    );
                                  })()}

                                  <div className="flex flex-wrap gap-1 mt-2 mb-3">
                                    {item.tagIds?.map((tId) => {
                                      const activeTag = tags.find((t) => t.id === tId);
                                      if (!activeTag) return null;
                                      return (
                                        <span key={tId} className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider border ${getColorClasses(activeTag.color)}`}>
                                          {activeTag.name}
                                        </span>
                                      );
                                    })}
                                  </div>

                                  {item.contactRoles && Object.keys(item.contactRoles).length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1 mb-2">
                                      {Object.entries(item.contactRoles).map(([contactId, roleName]) => {
                                        const contactObj = contacts.find((c) => c.id === contactId);
                                        if (!contactObj) return null;
                                        return (
                                          <span key={contactId} className="inline-flex items-center gap-0.5 bg-slate-50 border border-slate-150 px-1 py-0.2 rounded text-[8px] text-slate-500 font-medium">
                                            <span className="font-semibold text-slate-750">{contactObj.name}</span>: {roleName}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}

                                  <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400 font-bold">
                                    <span>{item.assignee}</span>
                                    <span className="inline-flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150">
                                      📝{intNotes.length} 📎{intDocs.length}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* REAL CALENDAR MONTH CONTROLLER & HEADER PANEL */}
                  {(() => {
                    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
                    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();

                    const prevMonthOffsetDays = [];
                    for (let i = firstDayIndex - 1; i >= 0; i--) {
                      prevMonthOffsetDays.push({
                        dayNum: prevMonthDays - i,
                        monthType: "prev",
                        year: calendarMonth === 0 ? calendarYear - 1 : calendarYear,
                        month: calendarMonth === 0 ? 11 : calendarMonth - 1,
                      });
                    }

                    const activeMonthDays = [];
                    for (let d = 1; d <= daysInMonth; d++) {
                      activeMonthDays.push({
                        dayNum: d,
                        monthType: "current",
                        year: calendarYear,
                        month: calendarMonth,
                      });
                    }

                    const totalCellsSoFar = prevMonthOffsetDays.length + activeMonthDays.length;
                    const remainingCellsCount = (totalCellsSoFar % 7 === 0) ? 0 : 7 - (totalCellsSoFar % 7);
                    const nextMonthOffsetDays = [];
                    for (let d = 1; d <= remainingCellsCount; d++) {
                      nextMonthOffsetDays.push({
                        dayNum: d,
                        monthType: "next",
                        year: calendarMonth === 11 ? calendarYear + 1 : calendarYear,
                        month: calendarMonth === 11 ? 0 : calendarMonth + 1,
                      });
                    }

                    const allCalendarDays = [...prevMonthOffsetDays, ...activeMonthDays, ...nextMonthOffsetDays];
                    const MONTH_NAMES = [
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ];

                    const handlePrevMonth = () => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(prev => prev - 1);
                      } else {
                        setCalendarMonth(prev => prev - 1);
                      }
                    };

                    const handleNextMonth = () => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(prev => prev + 1);
                      } else {
                        setCalendarMonth(prev => prev + 1);
                      }
                    };

                    // Compute month active stats
                    const monthStartDateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-01`;
                    const monthEndDateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
                    const monthActiveInteractions = filteredInteractions.filter(item => {
                      return item.status !== "CANCELED" && item.date >= monthStartDateStr && item.date <= monthEndDateStr;
                    });
                    const completedInMonth = monthActiveInteractions.filter(i => i.status === "COMPLETED").length;
                    const pendingInMonth = monthActiveInteractions.filter(i => i.status === "IN PROGRESS" || i.status === "SCHEDULED").length;

                    return (
                      <div className="space-y-4">
                        {/* CALENDAR CONTROLS BAR */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <Calendar className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                                <span className="font-mono text-xs text-blue-650 font-black">CHRONO-FLOW</span>
                                <span className="text-slate-300">•</span>
                                <span>{MONTH_NAMES[calendarMonth]} {calendarYear}</span>
                              </h3>
                              <p className="text-[10px] text-slate-400 font-semibold leading-none mt-1">
                                Monthly sequence analysis • <strong className="text-blue-600">{monthActiveInteractions.length} aligned tasks</strong> in this range
                              </p>
                            </div>
                          </div>

                          {/* Navigation Buttons */}
                          <div className="flex flex-wrap items-center gap-1.5 self-center">
                            <button
                              onClick={() => setCalendarYear(prev => prev - 1)}
                              title="Previous Year"
                              className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-950 transition"
                            >
                              <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handlePrevMonth}
                              title="Previous Month"
                              className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-955 transition flex items-center gap-1"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => {
                                const now = new Date();
                                setCalendarYear(now.getFullYear());
                                setCalendarMonth(now.getMonth());
                              }}
                              className="px-3 py-1.5 text-xs font-extrabold font-sans bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-100 rounded-lg transition"
                            >
                              Go to Today
                            </button>

                            <button
                              onClick={handleNextMonth}
                              title="Next Month"
                              className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-955 transition flex items-center gap-1"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCalendarYear(prev => prev + 1)}
                              title="Next Year"
                              className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-950 transition"
                            >
                              <ChevronsRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Mini statistics info */}
                          <div className="hidden lg:flex items-center gap-4 text-[10.5px] border-l border-slate-150 pl-4 shrink-0">
                            <div className="space-y-0.5">
                              <span className="text-slate-400 block font-semibold uppercase text-[8px] font-mono leading-none">Completed</span>
                              <strong className="text-emerald-600 font-extrabold">{completedInMonth} actions</strong>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-slate-400 block font-semibold uppercase text-[8px] font-mono leading-none">Active Pending</span>
                              <strong className="text-amber-600 font-extrabold">{pendingInMonth} tasks</strong>
                            </div>
                          </div>
                        </div>

                        {/* CALENDAR WEEKDAY HEADER */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible p-4">
                          <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-100 pb-2 mb-1.5">
                            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((dayName) => (
                              <div key={dayName} className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase font-mono py-1">
                                <span className="hidden sm:inline">{dayName}</span>
                                <span className="inline sm:hidden">{dayName.slice(0, 3)}</span>
                              </div>
                            ))}
                          </div>

                          {/* MONTH GRID CELLS SECTION */}
                          <div ref={calendarGridRef} className="grid grid-cols-7 gap-1 bg-slate-100/50 rounded-xl overflow-visible p-1">
                            {allCalendarDays.map((day, cellIndex) => {
                              const isCurrentMonth = day.monthType === "current";
                              const now = new Date();
                              const isToday = day.dayNum === now.getDate() && day.month === now.getMonth() && day.year === now.getFullYear();
                              
                              // Format date as YYYY-MM-DD
                              const dateStr = `${day.year}-${String(day.month + 1).padStart(2, "0")}-${String(day.dayNum).padStart(2, "0")}`;
                              const dayInteractions = filteredInteractions.filter(i => i.date === dateStr && i.status !== "CANCELED");

                              return (
                                <div
                                  key={`${day.year}-${day.month}-${day.dayNum}-${cellIndex}`}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                  }}
                                  onDragEnter={(e) => {
                                    e.preventDefault();
                                    setDragOverDate(dateStr);
                                  }}
                                  onDragLeave={() => {
                                    if (dragOverDate === dateStr) {
                                      setDragOverDate(null);
                                    }
                                  }}
                                  onDrop={async (e) => {
                                    e.preventDefault();
                                    setDragOverDate(null);
                                    const interactionId = e.dataTransfer.getData("text/plain");
                                    if (!interactionId) return;
                                    const itemToUpdate = interactions.find((i) => i.id === interactionId);
                                    if (!itemToUpdate) return;
                                    if (itemToUpdate.date === dateStr) return;
                                    const updatedPayload = { ...itemToUpdate, date: dateStr };
                                    await handleUpdateItem("interaction", updatedPayload);
                                  }}
                                  className={`min-h-[115px] p-2 rounded-lg border transition-all flex flex-col justify-between overflow-visible relative ${
                                    dragOverDate === dateStr
                                      ? "bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200 shadow-md"
                                      : isCurrentMonth 
                                        ? isToday 
                                          ? "bg-blue-50/50 border-blue-400 ring-2 ring-blue-100/40 shadow-inner"
                                          : "bg-white border-slate-200/70 hover:bg-slate-50/60"
                                        : "bg-slate-50/70 text-slate-350 border-slate-200/40 opacity-55"
                                  }`}
                                >
                                  {/* Cell Date Header and indicator */}
                                  <div className="flex items-center justify-between mb-1.5 select-none overflow-visible">
                                    <span className={`text-[10.5px] font-black font-mono leading-none w-5 h-5 flex items-center justify-center rounded-full ${
                                      isToday 
                                        ? "bg-blue-600 text-white font-black" 
                                        : isCurrentMonth
                                          ? "text-slate-800"
                                          : "text-slate-400 font-semibold"
                                    }`}>
                                      {day.dayNum}
                                    </span>

                                    {isToday && (
                                      <span className="text-[7.5px] font-black uppercase tracking-widest text-blue-600 bg-blue-100/70 px-1 rounded border border-blue-200/50">
                                        Today
                                      </span>
                                    )}

                                    {dayInteractions.length > 0 && !isToday && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                    )}
                                  </div>

                                  {/* List of day interactions inside cell */}
                                  <div className="flex-1 space-y-1 overflow-visible">
                                    {dayInteractions.map((item) => {
                                      const isSelected = selectedInteractionIds.includes(item.id);
                                      const cardStatus = getStatusClasses(item.status);
                                      const isInProgress = item.status === "IN PROGRESS";
                                      const intNotes = visibleNotes.filter((n) => n.linkedToType === "interaction" && n.linkedToId === item.id);
                                      const intDocs = visibleDocuments.filter((d) => d.linkedToType === "interaction" && d.linkedToId === item.id);

                                      // Optimize flyout alignment to prevent offscreen clipping at grid edges
                                      const colIdx = cellIndex % 7;
                                      let alignClass = "left-1/2 -translate-x-1/2";
                                      if (colIdx <= 1) {
                                        alignClass = "left-0";
                                      } else if (colIdx >= 5) {
                                        alignClass = "right-0";
                                      }

                                      return (
                                        <div
                                          key={item.id}
                                          className="relative group/intpill cursor-grab active:cursor-grabbing"
                                          draggable={true}
                                          onDragStart={(e) => {
                                            e.dataTransfer.setData("text/plain", item.id);
                                            e.dataTransfer.effectAllowed = "move";
                                            isDraggingInteractionRef.current = true;
                                          }}
                                          onDragEnd={() => {
                                            isDraggingInteractionRef.current = false;
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedItem({ dataType: "interaction", data: item });
                                          }}
                                        >
                                          {/* Item Pill */}
                                          <div className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold cursor-pointer border flex items-center justify-between gap-1 transition-all hover:scale-[1.02] shadow-[0_1px_2px_rgba(0,0,0,0.03)] select-none ${
                                            isSelected 
                                              ? "bg-blue-100 border-blue-400 text-blue-800 border-solid" 
                                              : `${cardStatus.bg} ${cardStatus.border} hover:border-slate-450 ${
                                                  isInProgress ? "border-solid opacity-100" : "border-dotted border-slate-300 opacity-70"
                                                }`
                                          }`}>
                                            <span className="truncate flex-1 leading-snug flex items-center gap-1.5">
                                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cardStatus.dot}`} />
                                              <span className="truncate">{item.subject}</span>
                                            </span>
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                setSelectedInteractionIds((prev) =>
                                                  e.target.checked
                                                    ? [...prev, item.id]
                                                    : prev.filter((id) => id !== item.id)
                                                );
                                              }}
                                              className="w-2.5 h-2.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                            />
                                          </div>

                                          {/* OVERLAY INTERACTIVE POPUP FLYOUT FOR PRECISE DETAILS */}
                                          <div className={`absolute bottom-full mb-2 w-72 p-4 bg-slate-950 text-slate-100 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl invisible opacity-0 scale-95 origin-bottom transition-all duration-200 group-hover/intpill:visible group-hover/intpill:opacity-100 group-hover/intpill:scale-100 z-[95] pointer-events-none ${alignClass}`}>
                                            <div className="space-y-3.5 text-left">
                                              <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                                                <span className="text-[8px] font-black font-mono text-sky-400 uppercase tracking-widest">{item.type}</span>
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[7.5px] font-extrabold border uppercase shadow-sm ${cardStatus.bg}`}>
                                                  <span className={`w-1 h-1 rounded-full ${cardStatus.dot}`} />
                                                  {cardStatus.text}
                                                </span>
                                              </div>

                                              <h4 className="text-white font-extrabold text-xs tracking-tight whitespace-normal leading-normal">{item.subject}</h4>

                                              <div className="space-y-1 text-[10px]">
                                                <p className="text-slate-400 font-semibold">Client • <span className="font-extrabold text-white">{item.client}</span></p>
                                                <p className="text-slate-400 font-semibold">Assignee • <span className="font-extrabold text-slate-300">{item.assignee}</span></p>
                                                <p className="text-slate-400 font-semibold">Scheduled Date • <span className="font-bold text-sky-405 font-mono">{item.date}</span></p>
                                                {item.duration !== undefined && item.duration !== null && item.duration !== "" && (
                                                  <p className="text-slate-400 font-semibold">Duration • <span className="font-bold text-indigo-400 font-mono">{item.duration} mins</span></p>
                                                )}
                                              </div>

                                              {item.summary && (
                                                <div className="pt-2 border-t border-slate-850/80 text-[10.5px] space-y-1">
                                                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Summary & Outcomes</span>
                                                  <p className="text-slate-200 leading-relaxed italic whitespace-normal font-medium">
                                                    "{item.summary}"
                                                  </p>
                                                </div>
                                              )}

                                              {/* Project Tag Labels */}
                                              {item.tagIds && item.tagIds.length > 0 && (
                                                <div className="pt-2.5 border-t border-slate-850/80 flex flex-wrap gap-1">
                                                  {item.tagIds.map((tId) => {
                                                    const activeTag = tags.find((t) => t.id === tId);
                                                    if (!activeTag) return null;
                                                    return (
                                                      <span key={tId} className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border ${getColorClasses(activeTag.color)}`}>
                                                        {activeTag.name}
                                                      </span>
                                                    );
                                                  })}
                                                </div>
                                              )}

                                              {/* Associated dynamic records stats */}
                                              {(intNotes.length > 0 || intDocs.length > 0) && (
                                                <div className="pt-2 border-t border-slate-850/80 grid grid-cols-2 gap-2 text-[9px]">
                                                  <div className="bg-slate-900 border border-slate-850 p-2 rounded">
                                                    <span className="text-slate-500 font-bold uppercase text-[7px] block font-mono">Linked Notes</span>
                                                    <span className="text-white font-extrabold font-mono">📝 {intNotes.length} logs</span>
                                                  </div>
                                                  <div className="bg-slate-900 border border-slate-850 p-2 rounded">
                                                    <span className="text-slate-500 font-bold uppercase text-[7px] block font-mono">Files Attached</span>
                                                    <span className="text-white font-extrabold font-mono">📎 {intDocs.length} files</span>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {/* Active matching Engagements on this day */}
                                    {(() => {
                                      const dayEngagements = engagements.filter(eng => {
                                        const isWithinTime = eng.startDate <= dateStr && eng.endDate >= dateStr;
                                        if (!isWithinTime) return false;
                                        return dayInteractions.some(i => i.engagementId ? i.engagementId === eng.id : i.client === eng.client);
                                      });
                                      if (dayEngagements.length === 0) return null;
                                      return (
                                        <div className="pt-1 mt-1 border-t border-slate-100 flex flex-col gap-1">
                                          {dayEngagements.map((eng) => (
                                            <button
                                              key={eng.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveTab("engagements");
                                                setSelectedItem({ dataType: "engagement", data: eng });
                                                setSelectedEngagementForView(eng);
                                              }}
                                              title={`Associated Engagement: ${eng.title}. Click to view details.`}
                                              className="w-full text-left bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-150/50 hover:border-indigo-250 rounded px-1.5 py-0.5 text-[8px] font-bold text-indigo-700 truncate flex items-center gap-1 transition duration-150 cursor-pointer pointer-events-auto shrink-0 animate-in fade-in duration-200"
                                            >
                                              <Briefcase className="w-2.5 h-2.5 text-indigo-500/70 shrink-0 select-none" />
                                              <span className="truncate flex-1">Eng: {eng.title}</span>
                                            </button>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Quick add prompt helper inside cell */}
                                  <button
                                    onClick={() => {
                                      setIntForm((prev) => ({ ...prev, date: dateStr }));
                                      // Focus search or scroll down to Add block
                                      const createToggle = document.getElementById("log-interaction-heading") || document.getElementById("select-all-interactions");
                                      if (createToggle) {
                                        createToggle.scrollIntoView({ behavior: "smooth" });
                                      }
                                    }}
                                    className="text-[8px] font-mono hover:text-blue-600 text-slate-300 transition mt-1 block w-full text-right self-end"
                                    title="Add alignment interaction for this day"
                                  >
                                    + Log
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : interactionsSubView === "gantt" ? (
            <InterdependencyGantt
              interactions={interactions}
              filteredInteractions={filteredInteractions}
              tags={tags}
              onSelectInteraction={(item) => setSelectedItem({ dataType: "interaction", data: item })}
              calendarMonth={calendarMonth}
              calendarYear={calendarYear}
              setCalendarMonth={setCalendarMonth}
              setCalendarYear={setCalendarYear}
            />
          ) : (
            <InteractionsDashboard
              interactions={interactions}
              onAddInteraction={() => { setNewType("interaction"); setIsNewModalOpen(true); }}
              onFilterStatus={(status) => {
                setInteractionsSubView("list");
              }}
              onSwitchToListView={() => setInteractionsSubView("list")}
              showToast={showToast}
            />
          )}
        </div>
      )}

          {/* TAB 3: CONTACTS DIRECTORY RASTER */}
          {activeTab === "contacts" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" /> Active Contacts Directory
                  </h2>
                  <p className="text-xs text-slate-400">Enterprise stakeholder profiles, dynamic records, and communications links</p>
                </div>
                
                {/* View Switcher */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold gap-1 self-stretch sm:self-auto shrink-0 select-none border border-slate-200">
                  <button
                    onClick={() => setContactsViewMode("list")}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      contactsViewMode === "list"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    📋 Stakeholder Roster
                  </button>
                  <button
                    onClick={() => setContactsViewMode("dashboard")}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      contactsViewMode === "dashboard"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                        : "text-slate-550 hover:text-slate-950"
                    }`}
                  >
                    📊 Roster Dashboard
                  </button>
                </div>
              </div>

              {contactsViewMode === "list" ? (
                <div className="space-y-6">

              {/* Batch Action Helper Header Control */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center h-5">
                    <input
                      id="select-all-contacts"
                      type="checkbox"
                      checked={contacts.length > 0 && selectedContactIds.length === contacts.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContactIds(contacts.map((c) => c.id));
                        } else {
                          setSelectedContactIds([]);
                        }
                      }}
                      className="w-4 h-4 cursor-pointer rounded border-slate-300 text-emerald-601 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="select-all-contacts" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                      Select All Active Contacts
                    </label>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {selectedContactIds.length} of {contacts.length} stakeholder profiles currently selected
                    </p>
                  </div>
                </div>

                {selectedContactIds.length > 0 && (
                  <button
                    onClick={() => setSelectedContactIds([])}
                    className="px-3 py-1 text-[11px] font-extrabold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-100 transition"
                  >
                    Clear Slate Selection ({selectedContactIds.length})
                  </button>
                )}
              </div>

              {/* Table Filters & Control Stripe */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in">
                {/* Search query input */}
                <div className="w-full md:w-1/3 relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, role, email, phone..."
                    value={conSearch}
                    onChange={(e) => setConSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-lg text-xs outline-none focus:bg-white text-slate-800"
                  />
                </div>

                {/* Filter and Sort options inline styling */}
                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
                  {/* Filter by Rating */}
                  <div className="w-full sm:w-auto flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter Rating:</span>
                    <select
                      value={conRatingFilter}
                      onChange={(e) => setConRatingFilter(e.target.value)}
                      className="w-full sm:w-auto border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-705 bg-slate-50 cursor-pointer"
                    >
                      <option value="ALL">All Ratings (0-4)</option>
                      <option value="0">0 (Red)</option>
                      <option value="1">1 (Orange)</option>
                      <option value="2">2 (Yellow)</option>
                      <option value="3">3 (Blue)</option>
                      <option value="4">4 (Green)</option>
                      <option value="NONE">Unrated Only</option>
                    </select>
                  </div>

                  {/* Sort by Rating */}
                  <div className="w-full sm:w-auto flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Sort Rating:</span>
                    <select
                      value={conSortDir}
                      onChange={(e) => setConSortDir(e.target.value as any)}
                      className="w-full sm:w-auto border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-705 bg-slate-50 cursor-pointer"
                    >
                      <option value="none">Default Order</option>
                      <option value="desc">Rating: High to Low</option>
                      <option value="asc">Rating: Low to High</option>
                    </select>
                  </div>

                  {/* Quick Sort */}
                  <div className="w-full sm:w-auto flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Quick Sort:</span>
                    <select
                      value={conQuickSort}
                      onChange={(e) => setConQuickSort(e.target.value as any)}
                      className="w-full sm:w-auto border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-705 bg-slate-50 cursor-pointer"
                    >
                      <option value="none">Default Order</option>
                      <option value="name-asc">Name: A to Z</option>
                      <option value="name-desc">Name: Z to A</option>
                      <option value="modified-desc">Most Recently Modified</option>
                    </select>
                  </div>

                  {(conSearch || conRatingFilter !== "ALL" || conSortDir !== "none" || conQuickSort !== "none") && (
                    <button
                      onClick={() => {
                        setConSearch("");
                        setConRatingFilter("ALL");
                        setConSortDir("none");
                        setConQuickSort("none");
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline shrink-0 cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {displayedContacts.map((con) => {
                  const initialName = con.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  const conNotes = visibleNotes.filter((n) => n.linkedToType === "contact" && n.linkedToId === con.id);
                  const conDocs = visibleDocuments.filter((d) => d.linkedToType === "contact" && d.linkedToId === con.id);
                  const linkedEntity = entities.find((ent) => 
                    ent.name.toLowerCase() === con.company.toLowerCase() ||
                    ent.name.toLowerCase().includes(con.company.toLowerCase()) ||
                    con.company.toLowerCase().includes(ent.name.toLowerCase())
                  );
                  const isSelected = selectedContactIds.includes(con.id);
                  const conRating = con.Ratting !== undefined ? con.Ratting : con.Rating;

                  return (
                    <div
                      key={con.id}
                      onClick={() => setSelectedItem({ dataType: "contact", data: con })}
                      className={`border rounded-xl p-5 cursor-pointer shadow-sm transition-all duration-250 flex flex-col justify-between ${
                        isSelected 
                          ? "bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-100/50 scale-[0.99] shadow-inner" 
                          : "bg-white border-slate-200 hover:border-emerald-400"
                      }`}
                    >
                      <div>
                        <div className="flex items-start gap-3">
                          {/* Checked indicator toggle */}
                          <div className="flex items-center h-10 shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                setSelectedContactIds((prev) =>
                                  e.target.checked
                                    ? [...prev, con.id]
                                    : prev.filter((id) => id !== con.id)
                                );
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </div>

                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm border border-slate-200 uppercase select-none shrink-0">
                            {initialName || "C"}
                          </div>
                          <div className="min-w-0 flex-1 relative">
                            <div className="group/name relative inline-block max-w-full">
                              <h3 className="font-bold text-slate-900 text-sm hover:text-blue-600 transition truncate cursor-help flex items-center gap-1">
                                {con.name}
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                              </h3>

                              {/* STAKEHOLDER FLOATING HOVER CARD */}
                              <div className="absolute invisible opacity-0 scale-95 origin-top-left translate-y-1.5 group-hover/name:visible group-hover/name:opacity-100 group-hover/name:scale-100 group-hover/name:translate-y-0 transition-all duration-200 z-[70] left-0 top-full mt-2 w-80 p-5 bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl rounded-2xl cursor-default pointer-events-none text-xs space-y-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Stakeholder Record Brief</span>
                                    <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 rounded text-[8px] font-bold uppercase tracking-wider">
                                      Active Sync
                                    </span>
                                  </div>
                                  <h4 className="text-white font-extrabold text-sm tracking-tight leading-snug">{con.name}</h4>
                                  <p className="text-slate-310 font-semibold">{con.role} • <span className="font-extrabold text-white">{con.company}</span></p>
                                </div>

                                {linkedEntity ? (
                                  <div className="pt-3 border-t border-slate-800 space-y-2">
                                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest font-mono block">Associated Organization Details</span>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-200">
                                      <div className="flex flex-col bg-slate-900 p-1.5 rounded border border-slate-850">
                                        <span className="text-slate-500 font-bold uppercase text-[7px] tracking-wider">HQ Location</span>
                                        <span className="font-semibold text-slate-100 truncate">{linkedEntity.location}</span>
                                      </div>
                                      <div className="flex flex-col bg-slate-900 p-1.5 rounded border border-slate-850">
                                        <span className="text-slate-500 font-bold uppercase text-[7px] tracking-wider">Account Tier</span>
                                        <span className="font-semibold text-slate-100 truncate">{linkedEntity.tier} Account</span>
                                      </div>
                                      <div className="flex flex-col col-span-2 bg-slate-900 p-1.5 rounded border border-slate-850">
                                        <span className="text-slate-500 font-bold uppercase text-[7px] tracking-wider">Sector Industry</span>
                                        <span className="font-semibold text-slate-100 truncate">{linkedEntity.industry}</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-3 border-t border-slate-800 space-y-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Primary Organization</span>
                                    <div className="bg-slate-900/50 p-2 rounded border border-slate-850/50">
                                      <p className="text-[10px] text-slate-300 italic truncate">{con.company}</p>
                                      <span className="text-[8px] text-slate-500 block mt-0.5">Note: This organization has no separate corporate profile registered yet.</span>
                                    </div>
                                  </div>
                                )}

                                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                  <span>📝 {conNotes.length} Linked Notes</span>
                                  <span>📎 {conDocs.length} Linked Docs</span>
                                </div>

                                {conNotes.length > 0 ? (
                                  <div className="pt-3 border-t border-slate-800 space-y-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                                    <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 uppercase tracking-wide">
                                      <span>Latest Note Log</span>
                                      <span className="font-mono">{conNotes[0].date}</span>
                                    </div>
                                    <p className="italic text-slate-200 leading-relaxed text-[11px] line-clamp-3">"{conNotes[0].content}"</p>
                                    <span className="block text-[8px] text-slate-500 text-right font-mono">— {conNotes[0].author}</span>
                                  </div>
                                ) : (
                                  <div className="pt-3 border-t border-slate-800">
                                    <p className="text-[10px] text-slate-500 italic">No notes or historical logs recorded for this stakeholder.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{con.role} • <span className="font-semibold text-slate-700">{con.company}</span></p>
                            {/* Color-coded rating badge element */}
                            {conRating !== undefined && conRating !== null && (
                              <div className="mt-1.5 flex flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                  conRating === 0 ? "bg-rose-50 text-rose-700 border-rose-200" :
                                  conRating === 1 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                  conRating === 2 ? "bg-amber-50 text-amber-800 border-amber-250" :
                                  conRating === 3 ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  conRating === 4 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  "bg-slate-50 text-slate-750 border-slate-205"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    conRating === 0 ? "bg-rose-500" :
                                    conRating === 1 ? "bg-orange-500" :
                                    conRating === 2 ? "bg-amber-500" :
                                    conRating === 3 ? "bg-blue-500" :
                                    conRating === 4 ? "bg-emerald-500" :
                                    "bg-slate-500"
                                  }`} />
                                  Rating: {conRating}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                          <button
                            onClick={(e) => { e.stopPropagation(); showToast(`Filing outreach email to ${con.email}`, "info"); }}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition text-left w-full overflow-hidden"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{con.email}</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); showToast(`Triggering desk voice system dials to ${con.phone}`, "info"); }}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition text-left w-full"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{con.phone || "+1 (555) 000-0000"}</span>
                          </button>
                        </div>

                        {con.tagIds && con.tagIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {con.tagIds.map((tId) => {
                              const activeTag = tags.find((t) => t.id === tId);
                              if (!activeTag) return null;
                              return (
                                <span key={tId} className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${getColorClasses(activeTag.color)}`}>
                                  #{activeTag.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                        <span className="flex items-center gap-2">
                          📝 {conNotes.length} notes | 📎 {conDocs.length} attachments
                        </span>
                        <span className="text-blue-600 hover:underline">Link Attributes →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
              <ContactsDashboard
                contacts={contacts}
                entities={entities}
                onAddContact={() => { setNewType("contact"); setIsNewModalOpen(true); }}
                onFilterRating={(val) => setConRatingFilter(val)}
                onSearchQuery={(q) => setConSearch(q)}
                onSwitchToListView={() => setContactsViewMode("list")}
                showToast={showToast}
              />
            )}
          </div>
        )}

          {/* TAB 4: COMPANIES METRICS */}
          {activeTab === "entities" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-500" /> Companies Directory
                  </h2>
                  <p className="text-xs text-slate-400">Classified client registry, tier allocations, and workspace linked diagnostics</p>
                </div>

                {/* View Switcher */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold gap-1 self-stretch sm:self-auto shrink-0 select-none border border-slate-200">
                  <button
                    onClick={() => setEntitiesViewMode("list")}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      entitiesViewMode === "list"
                        ? "bg-white text-slate-905 shadow-xs border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    📋 Stakeholder Roster
                  </button>
                  <button
                    onClick={() => setEntitiesViewMode("map")}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      entitiesViewMode === "map"
                        ? "bg-white text-slate-905 shadow-xs border border-slate-200/50"
                        : "text-slate-550 hover:text-slate-950"
                    }`}
                  >
                    🗺️ Coverage Map
                  </button>
                  <button
                    onClick={() => setEntitiesViewMode("dashboard")}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      entitiesViewMode === "dashboard"
                        ? "bg-white text-slate-905 shadow-xs border border-slate-200/50"
                        : "text-slate-550 hover:text-slate-950"
                    }`}
                  >
                    📊 Operational Analytics
                  </button>
                </div>
              </div>

              {entitiesViewMode === "list" ? (
                <div className="space-y-6">

              {/* Companies Table Filters & Control Stripe */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in">
                {/* Search query input */}
                <div className="w-full md:w-1/3 relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, location, city, website, industry..."
                    value={entSearch}
                    onChange={(e) => setEntSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-lg text-xs outline-none focus:bg-white text-slate-800"
                  />
                </div>

                {/* Filter and Sort options inline styling */}
                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
                  {/* Filter by Rating */}
                  <div className="w-full sm:w-auto flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter Rating:</span>
                    <select
                      value={entRatingFilter}
                      onChange={(e) => setEntRatingFilter(e.target.value)}
                      className="w-full sm:w-auto border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-705 bg-slate-50 cursor-pointer"
                    >
                      <option value="ALL">All Ratings (0-4)</option>
                      <option value="0">0 (Red)</option>
                      <option value="1">1 (Orange)</option>
                      <option value="2">2 (Yellow)</option>
                      <option value="3">3 (Blue)</option>
                      <option value="4">4 (Green)</option>
                      <option value="NONE">Unrated Only</option>
                    </select>
                  </div>

                  {/* Sort by Rating */}
                  <div className="w-full sm:w-auto flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Sort Rating:</span>
                    <select
                      value={entSortDir}
                      onChange={(e) => setEntSortDir(e.target.value as any)}
                      className="w-full sm:w-auto border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-705 bg-slate-50 cursor-pointer"
                    >
                      <option value="none">Default Order</option>
                      <option value="desc">Rating: High to Low</option>
                      <option value="asc">Rating: Low to High</option>
                    </select>
                  </div>

                  {(entSearch || entRatingFilter !== "ALL" || entSortDir !== "none") && (
                    <button
                      onClick={() => {
                        setEntSearch("");
                        setEntRatingFilter("ALL");
                        setEntSortDir("none");
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline shrink-0 cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedEntities.map((ent) => {
                  const linkedInt = interactions.filter((i) => i.client === ent.name);
                  const entNotes = visibleNotes.filter((n) => n.linkedToType === "entity" && n.linkedToId === ent.id);
                  const entDocs = visibleDocuments.filter((d) => d.linkedToType === "entity" && d.linkedToId === ent.id);

                  return (
                    <div
                      key={ent.id}
                      onClick={() => setSelectedItem({ dataType: "entity", data: ent })}
                      className="bg-white border border-slate-200 rounded-xl p-5 hover:border-purple-300 cursor-pointer shadow-sm transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{ent.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{ent.industry}</span>
                              {ent.Rating !== undefined && ent.Rating !== null && (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                  ent.Rating === 0 ? "bg-rose-50 text-rose-700 border-rose-200" :
                                  ent.Rating === 1 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                  ent.Rating === 2 ? "bg-amber-50 text-amber-800 border-amber-250" :
                                  ent.Rating === 3 ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  ent.Rating === 4 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  "bg-slate-50 text-slate-700 border-slate-205"
                                }`}>
                                  <span className={`w-1 h-1 rounded-full ${
                                    ent.Rating === 0 ? "bg-rose-500" :
                                    ent.Rating === 1 ? "bg-orange-500" :
                                    ent.Rating === 2 ? "bg-amber-500" :
                                    ent.Rating === 3 ? "bg-blue-500" :
                                    ent.Rating === 4 ? "bg-emerald-500" :
                                    "bg-slate-500"
                                  }`} />
                                  Rating: {ent.Rating}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[9px] font-bold uppercase tracking-wide">
                            {ent.tier} Account
                          </span>
                        </div>

                        <div className="pt-2 flex items-center gap-1 text-xs text-slate-500 font-semibold">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>HQ Headquarters: <span className="font-medium text-slate-800">{ent.location}</span></span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-xs font-semibold">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-400 text-[10px] font-bold">Interactions Registry</span>
                            <span className="text-slate-700 font-mono">{linkedInt.length} Touchpoint Logs</span>
                          </div>
                          <div className="flex flex-col gap-0.5 text-right">
                            <span className="text-slate-400 text-[10px] font-bold font-sans">Active Link Vault</span>
                            <span className="text-slate-900 font-bold font-mono">📝 {entNotes.length} | 📎 {entDocs.length} Docs</span>
                          </div>
                        </div>

                        {ent.tagIds && ent.tagIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {ent.tagIds.map((tId) => {
                              const activeTag = tags.find((t) => t.id === tId);
                              if (!activeTag) return null;
                              return (
                                <span key={tId} className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${getColorClasses(activeTag.color)}`}>
                                  #{activeTag.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                        <span>Authorized Operational Client Profile</span>
                        <span className="text-blue-600 hover:underline">Configure Connections →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : entitiesViewMode === "map" ? (
            <EntitiesMap
              entities={displayedEntities}
              onSelectEntity={(ent) => setSelectedItem({ dataType: "entity", data: ent })}
            />
          ) : (
              <EntitiesDashboard
                entities={entities}
                onAddEntity={() => { setNewType("entity"); setIsNewModalOpen(true); }}
                onFilterRating={(val) => setEntRatingFilter(val)}
                onSearchQuery={(q) => setEntSearch(q)}
                onSwitchToListView={() => setEntitiesViewMode("list")}
                showToast={showToast}
              />
            )}
          </div>
        )}

          {/* TAB 5: CORPORATE ENGAGEMENTS LISTING */}
          {activeTab === "engagements" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {selectedEngagementForView ? (
                <div className="space-y-6 animate-in fade-in duration-300" id="engagement-detail-subview">
                  {/* Title breadcrumb & header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-extrabold font-mono uppercase tracking-wider select-none">
                        <button 
                          onClick={() => setSelectedEngagementForView(null)}
                          className="hover:text-indigo-650 transition flex items-center gap-1 cursor-pointer font-bold duration-150"
                        >
                          Corporate Engagements
                        </button>
                        <ChevronRight className="w-3 h-3 text-slate-450" />
                        <span className="text-slate-800 font-extrabold">Engagement Detail</span>
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <Handshake className="w-5.5 h-5.5 text-sky-500 shrink-0" />
                        <span>{selectedEngagementForView.title}</span>
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedEngagementForView(null)}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-bold border border-slate-250 shadow-xs transition duration-150 cursor-pointer flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to SOW list
                      </button>
                      <button
                        onClick={() => setSelectedItem({ dataType: "engagement", data: selectedEngagementForView })}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-xs font-bold shadow-xs transition duration-150 cursor-pointer flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-300" /> Edit Engagement
                      </button>
                    </div>
                  </div>

                  {/* SOW Overview Dashboard summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* SOW Profile Card (Clickable to edit SOW spec in drawer) */}
                    <div 
                      onClick={() => setSelectedItem({ dataType: "engagement", data: selectedEngagementForView })}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 lg:col-span-1 cursor-pointer hover:border-slate-400 hover:shadow-md transition-all duration-250 group/spec-card relative"
                      title="Click to view/edit SOW specifications"
                    >
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Engagement Specification</h4>
                        <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100/60 px-1.5 py-0.5 rounded font-bold group-hover/spec-card:bg-indigo-600 group-hover/spec-card:text-white transition-all font-mono">
                          ✏️ Edit Spec
                        </span>
                      </div>
                      
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 font-sans">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Corporate Client</span>
                            <span className="text-xs font-bold text-slate-900">{selectedEngagementForView.client}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                            {
                              "Active": "bg-emerald-50 text-emerald-700 border-emerald-100",
                              "Under Negotiation": "bg-amber-50 text-amber-700 border-amber-100",
                              "Pending Draft": "bg-blue-50 text-blue-700 border-blue-100",
                              "Closed": "bg-slate-100 text-slate-500 border-slate-200"
                            }[selectedEngagementForView.status] || "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {selectedEngagementForView.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs leading-none">
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                            <span className="text-[8px] text-slate-400 font-bold uppercase block mb-1">Agreement Type</span>
                            <strong className="text-slate-800">{selectedEngagementForView.type}</strong>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                            <span className="text-[8px] text-slate-400 font-bold uppercase block mb-1">Total Touchpoints</span>
                            <strong className="text-slate-800 font-mono text-[13px]">{linkedInteractions.length} Logs</strong>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50 space-y-2">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">SOW Duration Range</span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <strong>{selectedEngagementForView.startDate}</strong>
                            <span className="text-slate-450 font-sans font-medium">to</span>
                            <strong>{selectedEngagementForView.endDate}</strong>
                          </div>
                          {(() => {
                            const start = new Date(selectedEngagementForView.startDate).getTime();
                            const end = new Date(selectedEngagementForView.endDate).getTime();
                            const today = new Date().getTime();
                            let percent = 0;
                            if (today > start) {
                              if (today >= end) percent = 100;
                              else percent = Math.round(((today - start) / (end - start)) * 100);
                            }
                            return (
                              <div className="space-y-1 pt-1.5">
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 font-sans">
                                  <span>Time Elapsed</span>
                                  <span>{percent}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-505 rounded-full" style={{ width: `${percent}%`, backgroundColor: "#6366f1" }} />
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block font-mono">Scope Statement</span>
                          <p className="bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 text-xs italic text-slate-700 leading-relaxed font-serif whitespace-normal">
                            "{selectedEngagementForView.description || "No description provided for SOW scope of work."}"
                          </p>
                        </div>

                        {selectedEngagementForView.tagIds && selectedEngagementForView.tagIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {selectedEngagementForView.tagIds.map((tId) => {
                              const activeTag = tags.find((t) => t.id === tId);
                              if (!activeTag) return null;
                              return (
                                <span key={tId} className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider border ${getColorClasses(activeTag.color)}`}>
                                  #{activeTag.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Linked Interactions Main Table and Filter controls */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-sky-500" />
                            <span>Linked Interactions Registry</span>
                          </h3>
                          <p className="text-[10px] text-slate-400">Showing touchpoint records mapped within client SOW parameters</p>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-150 shadow-inner">
                          <span>📊 Matches:</span>
                          <strong className="text-slate-900">{filteredSubViewInteractions.length} of {linkedInteractions.length}</strong>
                        </div>
                      </div>

                      {/* Filters and Sorting Toolbar */}
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-inner">
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                          {/* Search Bar */}
                          <div className="relative flex-1 min-w-[160px] md:max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 font-semibold" />
                            <input
                              type="text"
                              placeholder="Search linked logs..."
                              value={subViewSearchQuery}
                              onChange={(e) => setSubViewSearchQuery(e.target.value)}
                              className="w-full bg-white border border-slate-250 rounded-lg pl-8 pr-3 py-1 text-xs outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 shadow-3xs text-slate-755 font-semibold placeholder:text-slate-400"
                            />
                            {subViewSearchQuery && (
                              <button
                                onClick={() => setSubViewSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-605 text-[10px] font-bold cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {/* Type filter */}
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-3xs shrink-0 select-none">
                            <span className="text-[8px] font-bold font-mono text-slate-400 px-1.5">TYPE:</span>
                            <select
                              value={subViewTypeFilter}
                              onChange={(e) => setSubViewTypeFilter(e.target.value)}
                              className="bg-transparent border-0 py-0.5 px-1.5 text-[10.5px] font-bold text-slate-750 outline-none cursor-pointer"
                            >
                              <option value="ALL">ALL INTERACTION TYPES</option>
                              <option value="EMAIL">EMAIL</option>
                              <option value="MEETING">MEETING</option>
                              <option value="CALL">CALL</option>
                              <option value="OTHER">OTHER</option>
                            </select>
                          </div>

                          {/* Status filter */}
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-3xs shrink-0 select-none">
                            <span className="text-[8px] font-bold font-mono text-slate-400 px-1.5">STATUS:</span>
                            <select
                              value={subViewStatusFilter}
                              onChange={(e) => setSubViewStatusFilter(e.target.value)}
                              className="bg-transparent border-0 py-0.5 px-1.5 text-[10.5px] font-bold text-slate-755 outline-none cursor-pointer"
                            >
                              <option value="ALL">ALL STATUSES</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="IN PROGRESS">IN PROGRESS</option>
                              <option value="SCHEDULED">SCHEDULED</option>
                              <option value="BLOCKED">BLOCKED</option>
                            </select>
                          </div>
                        </div>

                        {/* Sorting Column Selector explicitly as helper button if table columns aren't clicked */}
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-3xs shrink-0 text-xs font-semibold">
                          <span className="text-[8.5px] font-bold font-mono text-slate-400">SORT BY:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                if (subViewSortColumn === "date") {
                                  setSubViewSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                } else {
                                  setSubViewSortColumn("date");
                                  setSubViewSortDirection("desc");
                                }
                              }}
                              className={`px-2 py-0.5 rounded text-[9.5px] font-bold transition duration-150 cursor-pointer ${
                                subViewSortColumn === "date"
                                  ? "bg-slate-900 text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Touchpoint Date {subViewSortColumn === "date" && (subViewSortDirection === "asc" ? "↑" : "↓")}
                            </button>
                            <button
                              onClick={() => {
                                if (subViewSortColumn === "followUpDate") {
                                  setSubViewSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                } else {
                                  setSubViewSortColumn("followUpDate");
                                  setSubViewSortDirection("desc");
                                }
                              }}
                              className={`px-2 py-0.5 rounded text-[9.5px] font-bold transition duration-150 cursor-pointer ${
                                subViewSortColumn === "followUpDate"
                                  ? "bg-slate-900 text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Follow-up Date {subViewSortColumn === "followUpDate" && (subViewSortDirection === "asc" ? "↑" : "↓")}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Table / Cards of interactions */}
                      <div className="overflow-x-auto min-w-0 border border-slate-200 rounded-xl shadow-3xs bg-white">
                        <table className="min-w-full divide-y divide-slate-150">
                          <thead className="bg-slate-50 font-mono text-[9px] font-bold text-slate-450 uppercase tracking-widest select-none">
                            <tr>
                              {/* Sortable Header Date */}
                              <th 
                                scope="col" 
                                onClick={() => {
                                  if (subViewSortColumn === "date") {
                                    setSubViewSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                  } else {
                                    setSubViewSortColumn("date");
                                    setSubViewSortDirection("desc");
                                  }
                                }}
                                className="px-5 py-3 text-left font-black cursor-pointer hover:bg-slate-100 hover:text-indigo-650 transition duration-155 group"
                              >
                                <div className="flex items-center gap-1">
                                  <span>Interaction Date</span>
                                  <ArrowUpDown className={`w-3 h-3 group-hover:opacity-100 ${
                                    subViewSortColumn === "date" ? "text-indigo-650 opacity-100" : "text-slate-400 opacity-60"
                                  }`} />
                                </div>
                              </th>
                              <th scope="col" className="px-5 py-3 text-left">Subject / Highlights</th>
                              <th scope="col" className="px-5 py-3 text-left">Manner/Type</th>
                              <th scope="col" className="px-5 py-3 text-left">Lifecycle status</th>
                              <th scope="col" className="px-5 py-3 text-left">Owner / Assignee</th>
                              {/* Sortable Header Follow-up Date */}
                              <th 
                                scope="col" 
                                onClick={() => {
                                  if (subViewSortColumn === "followUpDate") {
                                    setSubViewSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                  } else {
                                    setSubViewSortColumn("followUpDate");
                                    setSubViewSortDirection("desc");
                                  }
                                }}
                                className="px-5 py-3 text-left font-black cursor-pointer hover:bg-slate-100 hover:text-indigo-650 transition duration-155 group"
                              >
                                <div className="flex items-center gap-1">
                                  <span>Follow-up Plan</span>
                                  <ArrowUpDown className={`w-3 h-3 group-hover:opacity-100 ${
                                    subViewSortColumn === "followUpDate" ? "text-indigo-650 opacity-100" : "text-slate-400 opacity-60"
                                  }`} />
                                </div>
                              </th>
                              <th scope="col" className="px-5 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-slate-800 text-xs font-semibold">
                            {filteredSubViewInteractions.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="text-center py-10 text-slate-400 italic bg-slate-50/50">
                                  {linkedInteractions.length === 0 
                                    ? "No interactions matched this SOW's client company, or they lie outside the agreement range."
                                    : "No linked interactions found matching your current filters."
                                  }
                                </td>
                              </tr>
                            ) : (
                              filteredSubViewInteractions.map((item) => {
                                const statusMap = {
                                  "IN PROGRESS": "bg-blue-50 text-blue-700 border-blue-200",
                                  "COMPLETED": "bg-emerald-50 text-emerald-700 border-emerald-250",
                                  "SCHEDULED": "bg-slate-100 text-slate-700 border-slate-350",
                                  "BLOCKED": "bg-rose-50 text-rose-700 border-rose-250"
                                }[item.status] || "bg-slate-50 text-slate-650";

                                const statusColors = {
                                  "IN PROGRESS": {
                                    rowBg: "hover:bg-indigo-50/10 bg-indigo-50/5",
                                    borderL: "border-l-4 border-l-indigo-600"
                                  },
                                  "COMPLETED": {
                                    rowBg: "hover:bg-emerald-50/25 bg-emerald-50/10",
                                    borderL: "border-l-4 border-l-emerald-500"
                                  },
                                  "SCHEDULED": {
                                    rowBg: "hover:bg-slate-50 bg-white",
                                    borderL: "border-l-4 border-l-slate-400"
                                  },
                                  "BLOCKED": {
                                    rowBg: "hover:bg-rose-50/20 bg-rose-50/5",
                                    borderL: "border-l-4 border-l-rose-500"
                                  }
                                }[item.status] || {
                                  rowBg: "hover:bg-slate-50 bg-white",
                                  borderL: ""
                                };

                                return (
                                  <tr 
                                    key={item.id}
                                    onClick={() => setSelectedItem({ dataType: "interaction", data: item })}
                                    className={`${statusColors.rowBg} cursor-pointer transition duration-150 group/row`}
                                  >
                                    <td className={`px-5 py-4 whitespace-nowrap font-mono text-slate-550 text-[11px] group-hover/row:text-slate-900 transition ${statusColors.borderL}`}>
                                      {item.date || "Pending Predecessor"}
                                    </td>
                                    <td className="px-5 py-4 max-w-xs">
                                      <span className="font-extrabold text-slate-900 block truncate group-hover/row:text-indigo-650 transition">{item.subject}</span>
                                      <span className="text-[10px] text-slate-450 block truncate mt-0.5 italic">"{item.summary || 'No overview loaded.'}"</span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-extrabold uppercase font-mono tracking-wider">
                                        {item.type}
                                      </span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase ${statusMap}`}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                                      👤 {item.assignee}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap font-medium">
                                      {item.followUpDate ? (
                                        <div className="space-y-0.5">
                                          <span className="font-mono text-indigo-650 font-bold text-[10.5px] block">📅 {item.followUpDate}</span>
                                          {item.followUpNotes && <span className="text-[9.5px] text-slate-400 truncate block max-w-[120px]" title={item.followUpNotes}>{item.followUpNotes}</span>}
                                        </div>
                                      ) : (
                                        <span className="text-slate-350 italic text-[10.5px]">None mapped</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-4 text-right whitespace-nowrap">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedItem({ dataType: "interaction", data: item });
                                        }}
                                        className="text-sky-600 hover:text-sky-850 font-bold hover:underline py-1 px-2.5 rounded-lg border border-transparent hover:border-sky-150 hover:bg-sky-50 transition duration-150"
                                      >
                                        Inspect →
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-sky-500" /> Corporate Engagements
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">High-level strategic agreements, marketing campaigns, SOWs, and contract initiatives</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* View Switcher */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold gap-1 select-none border border-slate-200">
                    <button
                      onClick={() => setEngagementsViewMode("list")}
                      className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                        engagementsViewMode === "list"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      📋 SOW Timeline Listing
                    </button>
                    <button
                      onClick={() => setEngagementsViewMode("dashboard")}
                      className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                        engagementsViewMode === "dashboard"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                          : "text-slate-550 hover:text-slate-950"
                      }`}
                    >
                      📊 Operational Analytics
                    </button>
                  </div>

                  <button
                    onClick={() => { setNewType("engagement"); setIsNewModalOpen(true); }}
                    className="p-2 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition duration-205 cursor-pointer border border-transparent outline-none"
                  >
                    <Plus className="w-4 h-4" /> Log Engagement
                  </button>
                </div>
              </div>

              {engagementsViewMode === "list" ? (
                <div className="space-y-6">

              {/* ENGAGEMENT LIFECYCLE TIMELINE COMPONENT */}
              {(() => {
                const todayObj = new Date();
                const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;
                const todayDate = new Date(todayStr);

                // Filter based on selected timeline filter: Active-only vs All non-closed
                const itemsToMap = engagements.filter((e) => {
                  if (timelineFilterMode === "Active") {
                    return e.status === "Active";
                  }
                  return e.status !== "Closed"; // Show Active, Under Negotiation, and Pending Draft
                });

                // Compute bounding timeline dates based on selected Zoom mode
                const oneDay = 24 * 60 * 60 * 1000;
                let minTime = todayDate.getTime() - 45 * oneDay;
                let maxTime = todayDate.getTime() + 180 * oneDay;

                if (timelineZoom === "Monthly") {
                  minTime = todayDate.getTime() - 20 * oneDay; // 20 days back
                  maxTime = todayDate.getTime() + 40 * oneDay; // 40 days out
                } else if (timelineZoom === "Quarterly") {
                  minTime = todayDate.getTime() - 60 * oneDay; // 60 days back
                  maxTime = todayDate.getTime() + 120 * oneDay; // 120 days out
                } else if (timelineZoom === "Annual") {
                  minTime = todayDate.getTime() - 150 * oneDay; // 150 days back
                  maxTime = todayDate.getTime() + 300 * oneDay; // 300 days out
                }

                // Apply timeline horizontal scroll offset
                minTime += timelineOffsetDays * oneDay;
                maxTime += timelineOffsetDays * oneDay;

                const totalSpan = maxTime - minTime;
                const todayPercent = ((todayDate.getTime() - minTime) / totalSpan) * 100;
                const refDateObj = new Date(timelineRefDateStr);
                const refPercent = ((refDateObj.getTime() - minTime) / totalSpan) * 100;

                // Month tick calculations (Month start and mid-month)
                const startYearMonth = new Date(minTime);
                const monthMarkers: { label: string; percent: number; isMain: boolean }[] = [];
                let currDate = new Date(startYearMonth.getFullYear(), startYearMonth.getMonth(), 1);

                while (currDate.getTime() <= maxTime + 31 * oneDay) {
                  // Standard month start marker
                  if (currDate.getTime() >= minTime && currDate.getTime() <= maxTime) {
                    const markerPercent = ((currDate.getTime() - minTime) / totalSpan) * 100;
                    monthMarkers.push({
                      label: currDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }).toUpperCase(),
                      percent: markerPercent,
                      isMain: true
                    });
                  }
                  
                  // Mid-month marker for higher detail in Monthly zoom level
                  if (timelineZoom === "Monthly") {
                    const midDate = new Date(currDate.getFullYear(), currDate.getMonth(), 15);
                    if (midDate.getTime() >= minTime && midDate.getTime() <= maxTime) {
                      const midPercent = ((midDate.getTime() - minTime) / totalSpan) * 100;
                      monthMarkers.push({
                        label: "15TH",
                        percent: midPercent,
                        isMain: false
                      });
                    }
                  }

                  currDate.setMonth(currDate.getMonth() + 1);
                }

                // Sort tickers to keep them sorted in DOM
                monthMarkers.sort((a, b) => a.percent - b.percent);

                return (
                  <div className="bg-slate-50 text-slate-900 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 animate-in fade-in duration-300">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-450 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                          </span>
                          <h3 className="text-sm font-extrabold tracking-wider uppercase font-mono text-sky-600">Active Project Lifecycles</h3>
                        </div>
                        <p className="text-[10.5px] text-slate-500 font-semibold leading-none mt-1">
                          Visual start-to-end timeline relative to Today • <strong className="text-slate-900">{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>
                        </p>
                      </div>

                      {/* Controls container containing both filter options and zoom factors */}
                      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto overflow-x-auto lg:overflow-visible py-1 lg:py-0">
                        {/* Scope Filter */}
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 shadow-inner shrink-0">
                          <span className="text-[9px] text-slate-500 font-bold uppercase font-mono tracking-wider">Scope:</span>
                          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm">
                            <button
                              onClick={() => setTimelineFilterMode("Active")}
                              className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition-all duration-200 ${
                                timelineFilterMode === "Active"
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-900 cursor-pointer"
                              }`}
                            >
                              Active Only
                            </button>
                            <button
                              onClick={() => setTimelineFilterMode("All")}
                              className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition-all duration-200 ${
                                timelineFilterMode === "All"
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-900 cursor-pointer"
                              }`}
                            >
                              All Prospects
                            </button>
                          </div>
                        </div>

                        {/* Focus/Reference Date Selector */}
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 shadow-inner shrink-0">
                          <span className="text-[9px] text-slate-500 font-bold uppercase font-mono tracking-wider flex items-center gap-1 select-none">
                            <Calendar className="w-3 h-3 text-sky-500" /> Focus Date:
                          </span>
                          <input
                            type="date"
                            value={timelineRefDateStr}
                            onChange={(e) => {
                              if (e.target.value) {
                                setTimelineRefDateStr(e.target.value);
                                // Center timeline view on the newly selected focus date using the helper function
                                centerTimelineOnDate(e.target.value);
                              }
                            }}
                            className="bg-white px-2 py-0.5 text-[10.5px] font-mono font-bold rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs cursor-pointer"
                          />
                        </div>

                        {/* Zoom Scale */}
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 shadow-inner shrink-0">
                          <span className="text-[9px] text-slate-500 font-bold uppercase font-mono tracking-wider">Scale:</span>
                          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm">
                            <button
                              onClick={() => { setTimelineZoom("Monthly"); setTimelineOffsetDays(0); }}
                              className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition-all duration-200 ${
                                timelineZoom === "Monthly"
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-900 cursor-pointer"
                              }`}
                            >
                              Monthly
                            </button>
                            <button
                              onClick={() => { setTimelineZoom("Quarterly"); setTimelineOffsetDays(0); }}
                              className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition-all duration-200 ${
                                timelineZoom === "Quarterly"
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-900 cursor-pointer"
                              }`}
                            >
                              Quarterly
                            </button>
                            <button
                              onClick={() => { setTimelineZoom("Annual"); setTimelineOffsetDays(0); }}
                              className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition-all duration-200 ${
                                timelineZoom === "Annual"
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-900 cursor-pointer"
                              }`}
                            >
                              Annual
                            </button>
                          </div>
                        </div>

                        {/* Scroll Timeline */}
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 shadow-inner shrink-0">
                          <span className="text-[9px] text-slate-500 font-bold uppercase font-mono tracking-wider">Scroll:</span>
                          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm gap-0.5">
                            <button
                              onClick={() => {
                                const step = timelineZoom === "Monthly" ? 15 : timelineZoom === "Quarterly" ? 30 : 90;
                                setTimelineOffsetDays((prev) => prev - step);
                              }}
                              title="Scroll Backwards"
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer transition flex items-center justify-center border border-transparent hover:border-slate-200"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setTimelineOffsetDays(0);
                                const tObj = new Date();
                                const tStr = `${tObj.getFullYear()}-${String(tObj.getMonth() + 1).padStart(2, "0")}-${String(tObj.getDate()).padStart(2, "0")}`;
                                setTimelineRefDateStr(tStr);
                              }}
                              disabled={timelineOffsetDays === 0 && timelineRefDateStr === todayStr}
                              title="Reset Focus and Scroll to Present (Today)"
                              className={`px-2 py-1 rounded text-[9.5px] font-bold transition uppercase font-mono border border-transparent ${
                                (timelineOffsetDays === 0 && timelineRefDateStr === todayStr)
                                  ? "text-slate-300 cursor-not-allowed"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer hover:border-slate-200"
                                }`}
                            >
                              Today
                            </button>
                            <button
                              onClick={() => {
                                const step = timelineZoom === "Monthly" ? 15 : timelineZoom === "Quarterly" ? 30 : 90;
                                setTimelineOffsetDays((prev) => prev + step);
                              }}
                              title="Scroll Forwards"
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer transition flex items-center justify-center border border-transparent hover:border-slate-200"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline visualization canvas container */}
                    <div className="relative border border-slate-200 bg-white rounded-xl p-4 overflow-x-auto min-w-0 shadow-inner">
                      {/* Grid representation */}
                      <div 
                        ref={timelineGridRef}
                        onClick={(e) => {
                          // Allow setting the focus date by clicking any empty space on the timeline canvas
                          const isRow = (e.target as HTMLElement).closest('.group\\/timeline-row');
                          const isPin = (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.pointer-events-auto');
                          if (!isRow && !isPin && timelineGridRef.current) {
                            const rect = timelineGridRef.current.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const computedPercent = (clickX / rect.width) * 100;
                            if (computedPercent >= 0 && computedPercent <= 100) {
                              const clickedTime = minTime + (computedPercent / 100) * totalSpan;
                              const cDate = new Date(clickedTime);
                              const clickedDateStr = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, "0")}-${String(cDate.getDate()).padStart(2, "0")}`;
                              setTimelineRefDateStr(clickedDateStr);
                              centerTimelineOnDate(clickedDateStr);
                            }
                          }
                        }}
                        className="relative min-w-[700px] select-none py-1.5 overflow-visible cursor-crosshair"
                      >
                        
                        {/* Month Vertical Grid Indicators & Labels */}
                        <div className="h-5 relative mb-4 border-b border-slate-100 overflow-visible text-slate-400 text-[9px] font-bold font-mono">
                          {monthMarkers.map((marker, idx) => (
                            <div 
                              key={idx} 
                              className={`absolute -translate-x-1/2 flex flex-col items-center ${
                                marker.isMain ? "text-slate-600" : "text-slate-400 font-medium"
                              }`}
                              style={{ left: `${marker.percent}%` }}
                            >
                              <span>{marker.label}</span>
                              <div className={`w-px h-2 mt-1 bg-slate-200`} />
                            </div>
                          ))}
                        </div>

                        {/* Background Grid Vertical Lines */}
                        <div className="absolute inset-x-0 bottom-0 top-10 pointer-events-none overflow-visible z-0">
                          {monthMarkers.map((marker, idx) => (
                            <div 
                              key={`line-${idx}`} 
                              className={`absolute w-px ${
                                marker.isMain 
                                  ? "border-l border-dashed border-slate-205" 
                                  : "border-l border-dotted border-slate-100"
                              }`}
                              style={{ left: `${marker.percent}%`, top: 0, bottom: 0 }}
                            />
                          ))}
                        </div>

                        {/* SUBTLE TODAY'S ACTUAL DATE REFERENCE INDICATOR */}
                        {todayPercent >= 0 && todayPercent <= 100 && (
                          <div 
                            className="absolute bottom-0 top-6 w-px pointer-events-none z-20 transition-all duration-350 overflow-visible"
                            style={{ left: `${todayPercent}%` }}
                          >
                            <div className="absolute top-1 -translate-x-1/2 bg-slate-100/90 border border-slate-200 text-slate-500 font-semibold text-[7px] px-1.5 py-0.2 rounded font-sans shadow-2xs">
                              Today ({todayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                            </div>
                            <div className="h-full w-px border-l border-dashed border-slate-300" />
                          </div>
                        )}

                        {/* TARGET / SELECTED FOCUS DATE VERTICAL INDICATOR LINE (THE RED PIN) */}
                        {refPercent >= 0 && refPercent <= 100 ? (
                          <div 
                            className="absolute bottom-0 top-6 w-0.5 pointer-events-none z-30 transition-all duration-350 overflow-visible"
                            style={{ left: `${refPercent}%` }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                centerTimelineOnDate(timelineRefDateStr);
                              }}
                              title="Focus date indicator. Click to center of timeline span."
                              className="absolute -top-6 -translate-x-1/2 bg-red-650 hover:bg-red-750 text-white font-black text-[7.5px] px-2 py-0.5 rounded shadow pointer-events-auto flex items-center gap-1 transition duration-150 cursor-pointer uppercase tracking-wider border-0 focus:outline-none"
                            >
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping shrink-0" />
                              Focus: <span className="font-mono text-red-100 font-bold">{refDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            </button>
                            <div className="h-full w-[2px] bg-red-650 shadow-xs" />
                          </div>
                        ) : refPercent < 0 ? (
                          <div 
                            className="absolute bottom-0 top-6 w-px z-30 transition-all duration-350 overflow-visible"
                            style={{ left: `0%` }}
                          >
                            <button
                              onClick={() => centerTimelineOnDate(timelineRefDateStr)}
                              title={`Focus Date is left of research range. Click to center view on ${refDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`}
                              className="absolute -top-6 left-0 bg-red-650 hover:bg-red-750 text-white font-black text-[7.5px] px-1.5 py-0.5 rounded uppercase tracking-wider shadow whitespace-nowrap flex items-center gap-1 transition duration-155 cursor-pointer pointer-events-auto hover:scale-105 active:scale-95 border-0 focus:outline-none"
                            >
                              <ChevronLeft className="w-2.5 h-2.5 animate-pulse shrink-0 font-bold text-red-100" />
                              Focus: <span className="font-mono text-red-100 font-bold">{refDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            </button>
                            <div className="h-full w-px border-l border-dashed border-red-500" />
                          </div>
                        ) : (
                          <div 
                            className="absolute bottom-0 top-6 w-px z-30 transition-all duration-350 overflow-visible"
                            style={{ left: `100%` }}
                          >
                            <button
                              onClick={() => centerTimelineOnDate(timelineRefDateStr)}
                              title={`Focus Date is right of research range. Click to center view on ${refDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`}
                              className="absolute -top-6 right-0 translate-x-1/3 bg-red-650 hover:bg-red-750 text-white font-black text-[7.5px] px-1.5 py-0.5 rounded uppercase tracking-wider shadow whitespace-nowrap flex items-center gap-1 transition duration-155 cursor-pointer pointer-events-auto hover:scale-105 active:scale-95 border-0 focus:outline-none"
                            >
                              Focus: <span className="font-mono text-red-100 font-bold">{refDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              <ChevronRight className="w-2.5 h-2.5 animate-pulse shrink-0 font-bold text-red-100" />
                            </button>
                            <div className="h-full w-px border-r border-dashed border-red-500" />
                          </div>
                        )}

                        {/* BAR rows of engagements */}
                        <div className="space-y-3.5 relative z-10 py-1.5 min-h-[40px] overflow-visible">
                          {itemsToMap.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 italic text-[11px] border border-dashed border-slate-200 rounded-lg bg-slate-50">
                              No engagements currently matching this criteria to display on the lifecycle chart.
                            </div>
                          ) : (
                            (() => {
                              const renderedRows = itemsToMap.map((eng) => {
                                const start = new Date(eng.startDate).getTime();
                                const end = new Date(eng.endDate).getTime();
                                const totalDuration = end - start;

                                // Check if completely outside our selected zoom window range
                                const isOutLeft = end < minTime;
                                const isOutRight = start > maxTime;

                                if (isOutLeft || isOutRight) {
                                  return null;
                                }

                                const startClamped = Math.max(minTime, start);
                                const endClamped = Math.min(maxTime, end);

                                const leftPercent = ((startClamped - minTime) / totalSpan) * 100;
                                const rightPercent = ((endClamped - minTime) / totalSpan) * 100;
                                const widthPercent = Math.max(4, rightPercent - leftPercent);

                                const isClippedLeft = start < minTime;
                                const isClippedRight = end > maxTime;

                                // Calculate age progress percentage relative to today
                                let elapsedPercent = 0;
                                if (todayDate.getTime() > start) {
                                  if (todayDate.getTime() >= end) {
                                    elapsedPercent = 100;
                                  } else {
                                    elapsedPercent = Math.round(((todayDate.getTime() - start) / totalDuration) * 100);
                                  }
                                }

                                const totalDays = Math.round(totalDuration / (1000 * 24 * 60 * 60));
                                const elapsedDays = todayDate.getTime() > start
                                  ? Math.min(totalDays, Math.round((todayDate.getTime() - start) / (1000 * 24 * 60 * 60)))
                                  : 0;
                                const daysRemaining = Math.max(0, totalDays - elapsedDays);

                                // Status-specific visuals
                                const styleMap = {
                                  "Active": { barBg: "from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-800", pinColor: "bg-emerald-500" },
                                  "Under Negotiation": { barBg: "from-amber-50 to-amber-100/50 border-amber-200 text-amber-800", pinColor: "bg-amber-500" },
                                  "Pending Draft": { barBg: "from-sky-50 to-sky-100/50 border-sky-200 text-sky-800", pinColor: "bg-sky-500" },
                                  "Closed": { barBg: "from-slate-50 to-slate-100 border-slate-200 text-slate-500", pinColor: "bg-slate-400" }
                                }[eng.status] || { barBg: "from-sky-50 to-sky-100/50 border-sky-200 text-sky-800", pinColor: "bg-sky-500" };

                                return (
                                  <div 
                                    key={eng.id}
                                    className="relative group/timeline-row"
                                    onClick={() => {
                                      setSelectedEngagementForView(eng);
                                    }}
                                  >
                                    {/* Visual Bar Track */}
                                    <div 
                                      className="relative h-10 flex items-center bg-gradient-to-r shadow-inner group-hover/timeline-row:brightness-105 cursor-pointer transition-all duration-200"
                                      style={{ 
                                        left: `${leftPercent}%`, 
                                        width: `${widthPercent}%`,
                                      }}
                                    >
                                      <div className={`p-1.5 h-full w-full border ${
                                        isClippedLeft ? "rounded-l-none border-l-dashed border-l-2" : "rounded-l-xl"
                                      } ${
                                        isClippedRight ? "rounded-r-none border-r-dashed border-r-2" : "rounded-r-xl"
                                      } ${styleMap.barBg} relative overflow-hidden flex flex-col justify-center`}>
                                        
                                        {/* Shaded elapsed indicator background inside the bar */}
                                        {elapsedPercent > 0 && (
                                          <div 
                                            className="absolute left-0 top-0 bottom-0 bg-black/[0.03] transition-all duration-305"
                                            style={{ width: `${elapsedPercent}%` }}
                                          />
                                        )}

                                        {/* Project name text and client inside bar */}
                                        <div className="relative z-10 px-1 truncate select-none leading-none flex items-center gap-1.5">
                                          {isClippedLeft && <span className="text-[10px] text-slate-400 font-extrabold select-none animate-pulse">«</span>}
                                          <span className={`w-1.5 h-1.5 rounded-full ${styleMap.pinColor} shrink-0`} />
                                          <span className="font-extrabold text-[10.5px] tracking-tight">{eng.title}</span>
                                          <span className="text-slate-500 font-medium text-[9px] truncate">• {eng.client}</span>
                                          {isClippedRight && <span className="text-[10px] text-slate-400 font-extrabold select-none animate-pulse">»</span>}
                                        </div>

                                        {/* Dates inline sub-row */}
                                        <div className="relative z-10 px-1 mt-1 font-mono text-[8.5px] font-bold text-slate-500 leading-none truncate select-none">
                                          {eng.startDate} to {eng.endDate} • <span className="text-slate-400">{totalDays} days</span>
                                        </div>
                                      </div>

                                      {/* INTERACTIVE FLYOUT OVERLAY CARD ON ROW HOVER */}
                                      <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 w-80 p-5 bg-white text-slate-900 border border-slate-200 shadow-xl rounded-2xl invisible opacity-0 scale-95 group-hover/timeline-row:visible group-hover/timeline-row:opacity-100 group-hover/timeline-row:scale-100 transition-all duration-250 z-[95] pointer-events-none text-xs space-y-3.5">
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-extrabold font-mono text-sky-600 tracking-wider">PROJECT TIMELINE</span>
                                            <span className={`px-2 py-0.2 border rounded text-[7px] font-black uppercase ${
                                              eng.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                                            }`}>
                                              {eng.status}
                                            </span>
                                          </div>
                                          <h4 className="text-slate-900 font-extrabold text-sm tracking-tight leading-snug whitespace-normal">{eng.title}</h4>
                                          <p className="text-slate-500 font-semibold text-[10.5px]">Client • <span className="font-extrabold text-slate-800">{eng.client}</span></p>
                                        </div>

                                        {/* Graphical Range details */}
                                        <div className="pt-2.5 border-t border-slate-150 text-[10.5px] space-y-2">
                                          <div className="flex justify-between font-mono text-[9.5px]">
                                            <div>
                                              <span className="text-slate-400 font-bold uppercase text-[7.5px] block font-sans">Start Term</span>
                                              <strong className={isClippedLeft ? "text-amber-600" : "text-sky-600"}>
                                                {eng.startDate} {isClippedLeft && "(Beyond Visual range)"}
                                              </strong>
                                            </div>
                                            <div className="text-right">
                                              <span className="text-slate-400 font-bold uppercase text-[7.5px] block font-sans">End Term</span>
                                              <strong className={isClippedRight ? "text-amber-600" : "text-emerald-600"}>
                                                {eng.endDate} {isClippedRight && "(Beyond Visual range)"}
                                              </strong>
                                            </div>
                                          </div>

                                          {/* Inline graphic progress bar bar */}
                                          <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                                              <span>Timeline progress</span>
                                              <span className="text-slate-950 font-bold">{elapsedPercent}% Elapsed</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                              <div 
                                                className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full" 
                                                style={{ width: `${elapsedPercent}%` }}
                                              />
                                            </div>
                                          </div>

                                          <p className="text-[9.5px] font-mono text-slate-500 leading-none pt-1">
                                            ⏱️ <strong>{elapsedDays} days</strong> processed • <strong>{daysRemaining} days</strong> remaining active.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }).filter(Boolean);

                              if (renderedRows.length === 0) {
                                return (
                                  <div className="text-center py-8 text-slate-400 italic text-[11px] border border-dashed border-slate-200 rounded-lg bg-slate-50">
                                    No active engagements span across the selected zoom scale list ({timelineZoom}). Try altering the Scale/Scope.
                                  </div>
                                );
                              }

                              return renderedRows;
                            })()
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {engagements.map((eng) => {
                  const engNotes = visibleNotes.filter((n) => n.linkedToType === "engagement" && n.linkedToId === eng.id);
                  const engDocs = visibleDocuments.filter((d) => d.linkedToType === "engagement" && d.linkedToId === eng.id);
                  
                  const statusColors = {
                    "Active": "bg-emerald-50 text-emerald-700 border-emerald-100",
                    "Under Negotiation": "bg-amber-50 text-amber-700 border-amber-100",
                    "Pending Draft": "bg-blue-50 text-blue-700 border-blue-100",
                    "Closed": "bg-slate-100 text-slate-500 border-slate-200"
                  }[eng.status] || "bg-slate-50 text-slate-600 border-slate-200";

                  const cardBorderLeftColor = {
                    "Active": "border-l-emerald-500",
                    "Under Negotiation": "border-l-amber-500",
                    "Pending Draft": "border-l-blue-500",
                    "Closed": "border-l-slate-400"
                  }[eng.status] || "border-l-slate-300";

                  return (
                    <div
                      key={eng.id}
                      onClick={() => {
                        setSelectedEngagementForView(eng);
                      }}
                      className={`bg-white border border-slate-200 border-l-4 ${cardBorderLeftColor} rounded-xl p-5 hover:border-sky-450 cursor-pointer shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between`}
                    >
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-start gap-2">
                          <div className="relative min-w-0 flex-1">
                            {/* Engagement Title Hover Wrapper */}
                            <div className="relative group/engtitle inline-block max-w-full">
                              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight truncate hover:text-sky-600 transition flex items-center gap-1 cursor-help" title={eng.title}>
                                {eng.title}
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 animate-pulse" />
                              </h3>

                              {/* FLOATING PREVIEW CARD ON HOVER */}
                              <div className="absolute invisible opacity-0 scale-95 origin-top-left translate-y-2 group-hover/engtitle:visible group-hover/engtitle:opacity-100 group-hover/engtitle:scale-100 group-hover/engtitle:translate-y-0 transition-all duration-300 z-[90] left-0 top-full mt-2 w-80 p-5 bg-slate-955 text-slate-100 border border-slate-805 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] rounded-2xl cursor-default pointer-events-none text-xs space-y-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest font-mono">Engagement Summary</span>
                                    <span className={`px-2 py-0.5 border rounded text-[8px] font-bold uppercase tracking-wider ${
                                      eng.status === 'Active' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'bg-slate-900/40 text-slate-300 border-slate-805/40'
                                    }`}>
                                      {eng.status}
                                    </span>
                                  </div>
                                  <h4 className="text-white font-extrabold text-sm tracking-tight leading-snug whitespace-normal">{eng.title}</h4>
                                  <p className="text-slate-400 font-semibold text-[10.5px]">Client • <span className="font-extrabold text-white">{eng.client}</span></p>
                                </div>

                                {/* SOW Description */}
                                <div className="pt-3 border-t border-slate-800/80 space-y-1">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono block">SOW Scope of Work</span>
                                  <p className="text-slate-200 leading-relaxed text-[11px] font-medium italic whitespace-normal">
                                    "{eng.description || 'No detailed scope of work specified.'}"
                                  </p>
                                </div>

                                {/* Start Date */}
                                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px]">
                                  <div className="flex flex-col bg-slate-900 p-2 rounded border border-slate-850">
                                    <span className="text-slate-500 font-bold uppercase text-[7px] tracking-wider">Start Date</span>
                                    <span className="font-bold text-sky-455 mt-0.5 font-mono">{eng.startDate}</span>
                                  </div>
                                  <div className="flex flex-col bg-slate-900 p-2 rounded border border-slate-850">
                                    <span className="text-slate-500 font-bold uppercase text-[7px] tracking-wider">Agreement Type</span>
                                    <span className="font-semibold text-slate-200 truncate mt-0.5">{eng.type}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSearchQuery(eng.client); }}
                              className="text-[11px] font-bold text-slate-500 hover:text-sky-600 truncate block mt-0.5"
                            >
                              🏢 {eng.client}
                            </button>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 border ${statusColors}`}>
                            {eng.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-relaxed font-normal min-h-[48px] line-clamp-3">
                          {eng.description}
                        </p>

                        <div className="space-y-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[10px] text-slate-500">
                          <div className="flex justify-between items-center">
                            <span className="block text-[8px] font-sans font-bold text-slate-400 uppercase">Agreement Type</span>
                            <span className="font-bold text-slate-700 text-[11px]">{eng.type}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-100/80 flex justify-between font-sans text-slate-400">
                            <span>SOW Term:</span>
                            <strong className="text-slate-800 font-mono text-[9px]">{eng.startDate} to {eng.endDate}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold font-sans">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          📝 {engNotes.length} notes • 📎 {engDocs.length} attachments
                        </span>
                        <span className="text-sky-600 hover:underline">Manage Engagement →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
              <EngagementsDashboard
                engagements={engagements}
                onAddEngagement={() => { setNewType("engagement"); setIsNewModalOpen(true); }}
                onFilterStatus={(status) => {}}
                onSwitchToListView={() => setEngagementsViewMode("list")}
                showToast={showToast}
              />
            )}
                </>
              )}
          </div>
        )}

          {/* TAB 6: CENTRAL NOTES LEDGER LINK VIEW */}
          {activeTab === "notes" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Notebook className="w-5 h-5 text-indigo-500" /> Active Notes Ledger
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Centralized operational notes mapped to contracts, clients, partners, and touchpoints</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search note files..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    onClick={() => {
                      const subject = prompt("Enter General Note Subject:");
                      if (!subject) return;
                      const content = prompt("Enter General Note Content:");
                      if (content) {
                        const newNoteObj: Note = {
                          id: `note-${Date.now()}`,
                          content,
                          createdAt: new Date().toISOString(),
                          author: session?.name || "System Operator",
                          linkedToType: "document",
                          linkedToId: "general",
                          pinned: 0,
                          Subject: subject,
                          visibility: "Public"
                        };
                        setNotes([newNoteObj, ...notes]);
                        showToast("General note logged to Workspace Vault.", "success");
                        syncToServer("/api/notes", "POST", newNoteObj);
                      }
                    }}
                    className="p-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Note
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredAndSortedNotes.map((note) => {
                  let linkLabel = "General Workspace Note";
                  let linkBadgeColor = "bg-slate-100 text-slate-600";
                  if (note.linkedToType === "interaction") {
                    const found = interactions.find((i) => i.id === note.linkedToId);
                    linkLabel = found ? `Meeting: ${found.subject}` : "Linked Interaction";
                    linkBadgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                  } else if (note.linkedToType === "contact") {
                    const found = contacts.find((c) => c.id === note.linkedToId);
                    linkLabel = found ? `Contact: ${found.name}` : "Linked Contact";
                    linkBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  } else if (note.linkedToType === "entity") {
                    const found = entities.find((e) => e.id === note.linkedToId);
                    linkLabel = found ? `Entity: ${found.name}` : "Linked Corporate Entity";
                    linkBadgeColor = "bg-purple-50 text-purple-700 border-purple-100";
                  } else if (note.linkedToType === "engagement") {
                    const found = engagements.find((g) => g.id === note.linkedToId);
                    linkLabel = found ? `Engagement: ${found.title}` : "Linked Engagement";
                    linkBadgeColor = "bg-sky-50 text-sky-700 border-sky-100";
                  }

                  return (
                    <div
                      key={note.id}
                      className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow transition duration-200 flex flex-col justify-between space-y-4 ${
                        note.pinned
                          ? "border-indigo-300 ring-2 ring-indigo-50/50"
                          : "border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <button
                              onClick={() => handleTogglePinNote(note.id)}
                              className={`p-1 rounded transition cursor-pointer shrink-0 ${
                                note.pinned
                                  ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                                  : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                              }`}
                              title={note.pinned ? "Unpin Note" : "Pin Note"}
                            >
                              {note.pinned ? (
                                <Pin className="w-3.5 h-3.5 fill-indigo-600" />
                              ) : (
                                <Pin className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border truncate max-w-[170px] ${linkLabel.startsWith("General") ? "bg-slate-50 border-slate-200 text-slate-550" : "border-" + linkBadgeColor}`}>
                              {linkLabel}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              showConfirm(
                                "Discard Note",
                                "Are you sure you want to discard this ledger note?",
                                async () => {
                                  setNotes((prev) => prev.filter((n) => n.id !== note.id));
                                  showToast("Note discarded from Workspace ledger.", "info");
                                  await syncToServer(`/api/notes/${note.id}`, "DELETE");
                                  await loadSQLiteState();
                                }
                              );
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition cursor-pointer"
                            title="Discard note file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-700 font-normal leading-relaxed whitespace-pre-wrap font-sans">
                          {note.content}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono font-bold">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span>By: {note.author}</span>
                          <span className="text-slate-300">•</span>
                          <select
                            value={note.visibility || "Public"}
                            disabled={!isOwner(note) && session?.role !== "Senior Analyst"}
                            onChange={(e) => handleChangeNoteVisibility(note.id, e.target.value as any)}
                            className={`bg-transparent border-0 p-0 text-[10px] font-bold text-slate-500 cursor-pointer focus:ring-0 focus:text-indigo-600 outline-none ${(!isOwner(note) && session?.role !== "Senior Analyst") ? "opacity-75 cursor-not-allowed font-medium text-slate-400" : ""}`}
                            title="Edit Note Visibility"
                          >
                            <option value="Public">🌍 Public</option>
                            <option value="Team">👥 Team</option>
                            {(isOwner(note) || (note.visibility === "Private")) && (
                              <option value="Private">🔒 Private</option>
                            )}
                          </select>
                        </div>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: CENTRAL DOCUMENT VAULT LIST VIEW */}
          {activeTab === "documents" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-violet-500" /> Executive Document Vault
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Secure centralized repository for attached briefing packs, pitch decks, PDFs, and legal contracts</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const title = prompt("Enter Document Title:");
                      if (title) {
                        const newDocObj: Document = {
                          id: `doc-${Date.now()}`,
                          title,
                          fileType: "PDF",
                          fileSize: "2.4 MB",
                          uploadedAt: new Date().toISOString().split("T")[0],
                          linkedToType: "interaction",
                          linkedToId: "general",
                          author: session?.name || "System Operator",
                          visibility: "Public"
                        };
                        setDocuments([newDocObj, ...documents]);
                        showToast(`Document '${title}' indexed in vault.`, "success");
                      }
                    }}
                    className="p-2 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Index Document Link
                  </button>
                </div>
              </div>

              {/* Drag and Drop simulate widget */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  showToast("Securing file packets... File parsed successfully!", "success");
                  const newDocObj: Document = {
                    id: `doc-${Date.now()}`,
                    title: "Dragged_Briefing_Package.pdf",
                    fileType: "Briefing",
                    fileSize: "1.8 MB",
                    uploadedAt: new Date().toISOString().split("T")[0],
                    linkedToType: "interaction",
                    linkedToId: "general",
                    author: session?.name || "System Operator",
                    visibility: "Public"
                  };
                  setDocuments([newDocObj, ...documents]);
                }}
                className="border-2 border-dashed border-slate-200 hover:border-violet-300 bg-white hover:bg-slate-50/50 p-6 rounded-2xl transition duration-200 text-center space-y-2 cursor-pointer"
              >
                <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Drag & drop files here to upload to the secure vault</p>
                  <p className="text-[10px] text-slate-400">PDFs, Spreadsheets, Presentations, Contracts, or Briefings up to 50MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {visibleDocuments.map((doc) => {
                  let nodeLabel = "General Vault Document";
                  let linkColor = "bg-slate-100 text-slate-600";
                  if (doc.linkedToType === "interaction") {
                    const found = interactions.find((i) => i.id === doc.linkedToId);
                    nodeLabel = found ? `Meeting: ${found.subject}` : "Interaction Context";
                    linkColor = "bg-amber-50 text-amber-700 border-amber-100";
                  } else if (doc.linkedToType === "contact") {
                    const found = contacts.find((c) => c.id === doc.linkedToId);
                    nodeLabel = found ? `Contact: ${found.name}` : "Stakeholder Context";
                    linkColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  } else if (doc.linkedToType === "entity") {
                    const found = entities.find((e) => e.id === doc.linkedToId);
                    nodeLabel = found ? `Entity: ${found.name}` : "Entity Corporate Context";
                    linkColor = "bg-purple-50 text-purple-700 border-purple-100";
                  } else if (doc.linkedToType === "engagement") {
                    const found = engagements.find((e) => e.id === doc.linkedToId);
                    nodeLabel = found ? `Engagement: ${found.title}` : "Engagement Contract Context";
                    linkColor = "bg-sky-50 text-sky-700 border-sky-100";
                  }

                  return (
                    <div
                      key={doc.id}
                      className="bg-white border border-slate-200 hover:border-violet-300 rounded-xl p-4.5 shadow-sm hover:shadow transition duration-200 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="px-1.5 py-0.5 bg-violet-50 text-violet-700 font-extrabold font-mono text-[8px] rounded border border-violet-100 uppercase tracking-widest leading-none">
                            {doc.fileType}
                          </span>
                          <button
                            onClick={() => {
                              showConfirm(
                                "Discard Document",
                                `Do you wish to discard document registration for ${doc.title}?`,
                                async () => {
                                  setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                                  showToast("Document index entries purged from vault.", "info");
                                  await syncToServer(`/api/documents/${doc.id}`, "DELETE");
                                  await loadSQLiteState();
                                }
                              );
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition cursor-pointer"
                            title="Discard document entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="overflow-hidden">
                          <h4 className="font-bold text-slate-900 text-xs truncate leading-snug" title={doc.title}>{doc.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{doc.fileSize} • Indexed {doc.uploadedAt}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono font-bold pt-1.5 border-t border-slate-50">
                          <span>By: {doc.author || "System"}</span>
                          <div className="flex items-center gap-1 font-semibold">
                            <select
                              value={doc.visibility || "Public"}
                              disabled={!isOwner(doc) && session?.role !== "Senior Analyst"}
                              onChange={(e) => handleChangeDocVisibility(doc.id, e.target.value as any)}
                              className={`bg-transparent border-0 p-0 text-[10px] font-bold text-slate-500 cursor-pointer focus:ring-0 focus:text-indigo-600 outline-none ${(!isOwner(doc) && session?.role !== "Senior Analyst") ? "opacity-75 cursor-not-allowed font-medium text-slate-400" : ""}`}
                              title="Edit Document Visibility"
                            >
                              <option value="Public">🌍 Public</option>
                              <option value="Team">👥 Team</option>
                              {(isOwner(doc) || (doc.visibility === "Private")) && (
                                <option value="Private">🔒 Private</option>
                              )}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border truncate text-center block ${nodeLabel.startsWith("General") ? "bg-slate-50 border-slate-200 text-slate-550" : "border-" + linkColor}`}>
                          {nodeLabel}
                        </span>
                        <button
                          onClick={() => showToast(`Successfully retrieved contract packets representing ${doc.title}`, "success")}
                          className="w-full text-center py-1.5 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 text-slate-800 hover:text-violet-700 rounded-lg text-[10px] font-bold tracking-wide transition duration-150 cursor-pointer"
                        >
                          Retrieve / Download Original
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: OPERATING AUDITOR LEVEL SEATS */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-pink-500" /> Operators & Seating Control Console
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Verify logged workspace operators, register new administrative seats, and audit credentials</p>
                </div>
                <button
                  onClick={() => { setNewType("user"); setIsNewModalOpen(true); }}
                  className="p-2 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Register Auditor Seat
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {systemUsers.map((usr) => (
                  <div
                    key={usr.email}
                    className="bg-white border border-slate-200 hover:border-pink-300 rounded-xl p-5 shadow-sm hover:shadow transition duration-200 flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-extrabold text-xs uppercase select-none border border-pink-100 pb-0.5">
                          {usr.name ? usr.name.split(" ").map((n: string) => n[0]).join("") : "OP"}
                        </div>
                        <div className="overflow-hidden leading-none space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-xs truncate leading-normal">{usr.name}</h4>
                          <span className="text-[10px] font-bold text-pink-600 bg-pink-50/50 px-1.5 py-0.5 rounded uppercase tracking-wider">{usr.role}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-2 font-mono text-[10px] text-slate-500">
                        <div className="flex justify-between">
                          <span>Operator Email:</span>
                          <strong className="text-slate-800 font-sans">{usr.email}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Passphrase State:</span>
                          <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                            Securely Hashed
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${usr.suspended ? "bg-rose-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`}></span>
                        <span className={`text-[10px] font-bold font-mono ${usr.suspended ? "text-rose-500" : "text-emerald-600"}`}>
                          {usr.suspended ? "Suspended" : "Active Seat"}
                        </span>
                      </div>
                      {usr.email.toLowerCase() === session?.email?.toLowerCase() ? (
                        <span className="text-[10px] text-indigo-500 bg-indigo-50/50 font-bold px-2 py-0.5 rounded border border-indigo-100/50">
                          Your Active Session
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {usr.suspended ? (
                            <button
                              onClick={() => handleRestoreUser(usr.email)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 rounded-lg border border-emerald-100 hover:border-emerald-600 transition cursor-pointer"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                showConfirm(
                                  "Suspend User Seat",
                                  `Are you sure you want to suspend access seat privileges (soft-delete) for ${usr.name}?`,
                                  () => {
                                    handleDeleteItem("user", usr.email);
                                  }
                                );
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-600 rounded-lg border border-slate-200 hover:border-slate-600 transition cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                          
                          {session?.role === "Senior Analyst" && (
                            <button
                              onClick={() => handlePermanentDeleteUser(usr.email, usr.name || usr.email)}
                              className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg border border-rose-100 hover:border-rose-600 transition cursor-pointer"
                              title="Permanently remove this operator account from the database"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ADMINISTRATIVE TAG GROUPS */}
          {activeTab === "tags" && session?.role === "Senior Analyst" && (
            <AdminTagGroupsManager
              tags={tags}
              syncToServer={syncToServer}
              loadSQLiteState={loadSQLiteState}
              showToast={showToast}
            />
          )}

          {/* TAB 9: SYSTEM AUDIT LEDGER */}
          {activeTab === "audit" && (
            <div className="space-y-6 animate-in fade-in duration-300" id="audit-ledger-container">
              {/* Header block */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500" /> Security Audit Trail & System Lineage
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Continuous monitoring of workspace operations, credential validations, bulk deletes, and corporate entity mutations.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => loadAuditLogs()}
                    className="p-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer"
                    title="Reload ledger from SQLite securely"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reload Ledger
                  </button>
                  <button
                    onClick={() => purgeAuditLogs()}
                    className="p-2 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition border border-red-200 hover:border-red-600 cursor-pointer shadow-sm"
                    title="Permanently empty all historical security lines"
                  >
                    <Trash2 className="w-4 h-4" /> Purge System Trails
                  </button>
                </div>
              </div>

              {/* Bento statistical metrics grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-white rounded-lg">
                    <History className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Total Logs</span>
                    <strong className="text-xl font-extrabold text-slate-900 leading-none block mt-1">{auditLogs.length}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Record Matches</span>
                    <strong className="text-xl font-extrabold text-slate-900 leading-none block mt-1">
                      {auditLogs.filter((log) => {
                        if (auditTargetFilter !== "ALL" && log.targetType !== auditTargetFilter) return false;
                        if (auditActionFilter !== "ALL") {
                          if (auditActionFilter === "BATCH" && !log.actionType.startsWith("BATCH")) return false;
                          if (auditActionFilter !== "BATCH" && log.actionType !== auditActionFilter) return false;
                        }
                        if (auditTextSearch.trim()) {
                          const q = auditTextSearch.toLowerCase();
                          return (log.userEmail?.toLowerCase().includes(q) || log.userName?.toLowerCase().includes(q) || log.details?.toLowerCase().includes(q) || log.targetName?.toLowerCase().includes(q) || log.targetId?.toLowerCase().includes(q) || log.userRole?.toLowerCase().includes(q));
                        }
                        return true;
                      }).length}
                    </strong>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-red-100 text-red-800 rounded-lg">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Purges & Deletes</span>
                    <strong className="text-xl font-extrabold text-slate-900 leading-none block mt-1">
                      {auditLogs.filter(l => l.actionType && l.actionType.includes("DELETE")).length}
                    </strong>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-800 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Active Operators</span>
                    <strong className="text-xl font-extrabold text-slate-900 leading-none block mt-1">
                      {new Set(auditLogs.map(l => l.userEmail)).size}
                    </strong>
                  </div>
                </div>
              </div>

              {/* LEDGER INSIGHTS & ANALYTICAL SUMMARY REPORT */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-500" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight">Ledger Velocity & Security Analytics Statement</h3>
                      <p className="text-[10px] text-slate-400">Automated metrics highlighting operational activity, system peaks, and modified corporate elements.</p>
                    </div>
                  </div>
                  <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-bold gap-1 self-stretch sm:self-auto shrink-0 select-none">
                    <button
                      onClick={() => setAuditInsightRange("30")}
                      className={`px-3 py-1 rounded transition-all cursor-pointer ${
                        auditInsightRange === "30" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Past 30 Days (Active)
                    </button>
                    <button
                      onClick={() => setAuditInsightRange("all")}
                      className={`px-3 py-1 rounded transition-all cursor-pointer ${
                        auditInsightRange === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      All-Time Complete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left Column: Most Active Users */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Most Active Operators</span>
                    </div>
                    {auditActiveOperators.length > 0 ? (
                      <div className="space-y-2">
                        {auditActiveOperators.map((operator) => {
                          const maxCount = auditActiveOperators[0]?.count || 1;
                          const barWidth = Math.max(10, Math.round((operator.count / maxCount) * 100));
                          return (
                            <div key={operator.email} className="bg-white border border-slate-200/60 rounded-xl p-3 hover:border-slate-300 transition-all flex flex-col gap-2 shadow-none">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                                    {operator.name.split(" ").map(n => n[0]).join("").toUpperCase() || "OP"}
                                  </div>
                                  <div className="overflow-hidden leading-tight">
                                    <div className="font-bold text-[11px] text-slate-900 truncate">{operator.name}</div>
                                    <div className="text-[9px] text-slate-400 font-mono truncate">{operator.email}</div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-extrabold text-slate-800">{operator.count} edits</span>
                                  <span className="text-[8px] text-slate-400 block font-bold uppercase">{operator.role}</span>
                                </div>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white border border-dashed border-slate-200 rounded-xl text-center py-8 text-xs text-slate-400">
                        No active users logged in selection range.
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Most Modified Entities */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Most Modified Elements</span>
                    </div>
                    {auditModifiedEntities.length > 0 ? (
                      <div className="space-y-2 font-sans">
                        {auditModifiedEntities.map((entity) => {
                          let targetColorClass = "bg-slate-100 text-slate-605";
                          if (entity.type === "Entity") targetColorClass = "bg-purple-50 text-purple-600 border border-purple-100";
                          else if (entity.type === "Contact") targetColorClass = "bg-green-50 text-green-600 border border-green-100";
                          else if (entity.type === "Interaction") targetColorClass = "bg-amber-50 text-amber-600 border border-amber-100";
                          else if (entity.type === "Engagement") targetColorClass = "bg-sky-50 text-sky-600 border border-sky-100";
                          else if (entity.type === "Document") targetColorClass = "bg-violet-50 text-violet-600 border border-violet-100";
                          else if (entity.type === "User") targetColorClass = "bg-pink-50 text-pink-600 border border-pink-100";

                          return (
                            <div key={entity.key} className="bg-white border border-slate-200/60 rounded-xl p-3 hover:border-slate-300 transition-all flex justify-between items-center gap-3">
                              <div className="overflow-hidden leading-tight">
                                <div className="font-bold text-[11px] text-slate-800 truncate" title={entity.name}>{entity.name}</div>
                                <div className="mt-1 flex items-center gap-1">
                                  <span className={`text-[8px] font-bold px-1 rounded ${targetColorClass}`}>
                                    {entity.type}
                                  </span>
                                  <span className="text-[8px] font-mono text-slate-400">#{entity.id.substring(0, 6)}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-extrabold text-slate-800">{entity.count} edits</span>
                                <div className="text-[8px] text-slate-400 flex gap-1 justify-end font-mono">
                                  {entity.creates > 0 && <span className="text-emerald-500 font-bold">C:{entity.creates}</span>}
                                  {entity.updates > 0 && <span className="text-blue-500 font-bold">U:{entity.updates}</span>}
                                  {entity.deletes > 0 && <span className="text-rose-500 font-bold">D:{entity.deletes}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white border border-dashed border-slate-200 rounded-xl text-center py-8 text-xs text-slate-400">
                        No modified records logged in selection range.
                      </div>
                    )}
                  </div>

                  {/* Right Column: Security Indicators & Briefing */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Security intelligence briefing</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 gap-3.5 flex flex-col justify-between h-[calc(100%-25px)] min-h-[170px]">
                      <div className="space-y-2 text-[11px] font-medium text-slate-600">
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-400">Peak Security Activity Hr:</span>
                          <strong className="text-slate-800 font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{auditSystemMetrics.peakHour}</strong>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-400">System Delete Ratio:</span>
                          <strong className="text-rose-600 font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{auditSystemMetrics.deletePercent}</strong>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-400">Senior Analyst Actions Role:</span>
                          <strong className="text-blue-600 font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{auditSystemMetrics.adminActionPercent}</strong>
                        </div>
                      </div>
                      <div className="bg-amber-50/50 border border-amber-100/70 p-2 rounded-lg text-[9.5px] text-amber-800 font-semibold leading-relaxed">
                        ⚠️ <span className="font-bold underline">SECURITY SYSTEM INSIGHTS</span>: All logs listed above are pulled securely from SQLite persistence server to trace actions and verify operator session compliance.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtering Controls Row */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3.5">
                <div className="w-full md:w-1/3 relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by operator, detail message, target ID..."
                    value={auditTextSearch}
                    onChange={(e) => setAuditTextSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>

                <div className="w-full md:w-1/4 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Target:</span>
                  <select
                    value={auditTargetFilter}
                    onChange={(e) => setAuditTargetFilter(e.target.value)}
                    className="w-full border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 cursor-pointer"
                  >
                    <option value="ALL">All Vault Classes</option>
                    <option value="Entity">Companies</option>
                    <option value="Contact">Contacts</option>
                    <option value="Interaction">Interactions</option>
                    <option value="Engagement">Engagements</option>
                    <option value="Note">Notes Ledger</option>
                    <option value="Document">Documents Vault</option>
                    <option value="User">Operator Seats</option>
                    <option value="Tag">Categorization Tags</option>
                  </select>
                </div>

                <div className="w-full md:w-1/4 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Action:</span>
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="w-full border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 cursor-pointer"
                  >
                    <option value="ALL">All Operations</option>
                    <option value="CREATE">CREATE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                    <option value="BATCH">BULK / BATCH ACTIONS</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleExportAuditLogsToCSV}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm md:ml-auto"
                  title="Export currently filtered audit logs to a CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to CSV</span>
                </button>

                {(auditTextSearch || auditTargetFilter !== "ALL" || auditActionFilter !== "ALL") && (
                  <button
                    onClick={() => {
                      setAuditTextSearch("");
                      setAuditTargetFilter("ALL");
                      setAuditActionFilter("ALL");
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline shrink-0 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Data Table / Timeline Ledger */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                  <table className="w-full text-left" id="audit-logs-table">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10">
                        <th className="p-4 py-3 bg-slate-50">Timestamp (UTC)</th>
                        <th className="p-4 py-3 bg-slate-50">Operator</th>
                        <th className="p-4 py-3 bg-slate-50">Action Type</th>
                        <th className="p-4 py-3 bg-slate-50">Target Subsystem</th>
                        <th className="p-4 py-3 bg-slate-50">Identified Target</th>
                        <th className="p-4 py-3 bg-slate-50">Transaction details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredAuditLogs.length > 0 ? (
                        filteredAuditLogs.map((log) => {
                          let actionColorClass = "bg-blue-50 text-blue-800 border-blue-200";
                          if (log.actionType === "CREATE") {
                            actionColorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
                          } else if (log.actionType && log.actionType.includes("DELETE")) {
                            actionColorClass = "bg-rose-50 text-rose-800 border-rose-200";
                          } else if (log.actionType && log.actionType.includes("BATCH")) {
                            actionColorClass = "bg-purple-50 text-purple-800 border-purple-200";
                          }

                          let targetColorClass = "bg-slate-100 text-slate-800";
                          if (log.targetType === "Entity") targetColorClass = "bg-purple-100 text-purple-800";
                          else if (log.targetType === "Contact") targetColorClass = "bg-green-100 text-green-800";
                          else if (log.targetType === "Interaction") targetColorClass = "bg-amber-100 text-amber-800";
                          else if (log.targetType === "Engagement") targetColorClass = "bg-sky-100 text-sky-800";
                          else if (log.targetType === "Document") targetColorClass = "bg-violet-100 text-violet-800";
                          else if (log.targetType === "User") targetColorClass = "bg-pink-100 text-pink-800";

                          return (
                            <tr
                              key={log.id}
                              className="hover:bg-slate-50/50 transition cursor-default font-semibold animate-in fade-in duration-100"
                            >
                              {/* Timestamp */}
                              <td className="p-4 font-mono text-[11px] text-slate-500 shrink-0 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString("sv-SE", { timeZone: "UTC" }).split(" ")[0]}&nbsp;
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {new Date(log.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC" })}
                                </span>
                              </td>

                              {/* Operator details */}
                              <td className="p-4 leading-normal">
                                <div className="font-extrabold text-slate-900 leading-tight block">{log.userName}</div>
                                <span className="text-[10px] text-slate-400 font-mono">{log.userEmail}</span>
                                <span className="inline-block text-[8px] font-extrabold text-slate-400 bg-slate-50 border border-slate-200 px-1 py-0.2 ml-1.5 uppercase rounded">
                                  {log.userRole}
                                </span>
                              </td>

                              {/* Action Type badge */}
                              <td className="p-4">
                                <span className={`inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${actionColorClass}`}>
                                  {log.actionType}
                                </span>
                              </td>

                              {/* Target Subsystem badge */}
                              <td className="p-4">
                                <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded ${targetColorClass}`}>
                                  {log.targetType}
                                </span>
                              </td>

                              {/* Identified Target */}
                              <td className="p-4 max-w-[150px] truncate leading-tight">
                                <span className="font-mono text-[10px] text-slate-400 block mb-0.5">#{log.targetId ? log.targetId.substr(0, 8) : "N/A"}</span>
                                <span className="font-bold text-slate-800" title={log.targetName}>{log.targetName || "N/A"}</span>
                              </td>

                              {/* Transaction Details message */}
                              <td className="p-4 leading-relaxed max-w-[280px]">
                                <p className="text-slate-600 font-medium font-mono text-[11px] break-words">{log.details}</p>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No logs found matching selected constraints. Add some interactions, update entities, or change contacts to generate logs!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: SETTINGS & PREFERENCES CONSOLE */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-300" id="settings-console-container">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-205 pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Settings className="w-5 h-5 text-teal-500" /> Settings & Preferences Console
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage active operator credentials, administrative security keys, notification routing, and dynamic visual layouts
                  </p>
                </div>
              </div>

              {/* Grid of panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Panel 1: Profile & Coordinates */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <User className="w-4 h-4 text-indigo-500" />
                    <div>
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-705">Operator Profile Coordinates</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Verify or modify active analyst identifier details</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">Email / Operator UID</label>
                      <input
                        type="text"
                        disabled
                        value={session?.email || "N/A"}
                        className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-mono font-bold text-slate-500 cursor-not-allowed select-all"
                      />
                      <span className="text-[9px] text-slate-405 italic block mt-1">Unique operator primary key cannot be mutated. Contact administrative auditor for seat reallocation.</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">Display Name / Operator Name</label>
                      <input
                        type="text"
                        value={userProfileName}
                        onChange={(e) => setUserProfileName(e.target.value)}
                        placeholder="Operator Display Name"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-505 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">Assigned Security Role</label>
                      <input
                        type="text"
                        disabled
                        value={session?.role || "N/A"}
                        className="w-full bg-slate-50 border border-slate-202 p-2.5 rounded-lg text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!userProfileName.trim()) {
                        showToast("Operator display name cannot be blank.", "error");
                        return;
                      }
                      
                      // Update session
                      const savedSession = localStorage.getItem("crm_active_session");
                      if (savedSession && session) {
                        const parsed = JSON.parse(savedSession);
                        parsed.name = userProfileName;
                        localStorage.setItem("crm_active_session", JSON.stringify(parsed));
                        setSession(parsed);
                      }

                      // Find full user in cached users list to preserve hash
                      const users = JSON.parse(localStorage.getItem("crm_users") || "[]");
                      const userIdx = users.findIndex((u: any) => u.email.toLowerCase() === session?.email?.toLowerCase());
                      if (userIdx !== -1) {
                        users[userIdx].name = userProfileName;
                        localStorage.setItem("crm_users", JSON.stringify(users));
                        setSystemUsers(users);
                        // Sync to DB
                        syncToServer("/api/users", "PUT", users[userIdx]);
                        showToast("Active operator profile metadata successfully synchronized with ledger.", "success");
                      } else {
                        showToast("Error locating operator profile cache.", "error");
                      }
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Save Profile Coordinates
                  </button>
                </div>

                {/* Panel 2: Password Security Adjuster */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <KeyRound className="w-4 h-4 text-rose-500" />
                    <div>
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-705">Security Credentials & Keys</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Update operator private access passphrase</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">Current Passphrase</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={settingsCurrentPassword}
                        onChange={(e) => setSettingsCurrentPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs focus:bg-white focus:border-rose-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">New Passphrase</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={settingsNewPassword}
                        onChange={(e) => setSettingsNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs focus:bg-white focus:border-rose-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">Confirm New Passphrase</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={settingsConfirmPassword}
                        onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs focus:bg-white focus:border-rose-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!settingsCurrentPassword || !settingsNewPassword || !settingsConfirmPassword) {
                        showToast("All security fields are requested to alter seat credentials.", "error");
                        return;
                      }

                      if (settingsNewPassword !== settingsConfirmPassword) {
                        showToast("Verification coordinate mismatch. New passphrases must match.", "error");
                        return;
                      }

                      if (settingsNewPassword.length < 5) {
                        showToast("Private key security standard mismatch. Must be at least 5 characters.", "error");
                        return;
                      }

                      // Find user to verify current password
                      const users = JSON.parse(localStorage.getItem("crm_users") || "[]");
                      const operatorIdx = users.findIndex((u: any) => u.email.toLowerCase() === session?.email?.toLowerCase());

                      if (operatorIdx === -1) {
                        showToast("Access token error: unable to locate active logged user.", "error");
                        return;
                      }

                      const userObj = users[operatorIdx];
                      const hashedCurrent = await hashPassword(settingsCurrentPassword, session?.email || "");

                      if (userObj.passwordHash !== hashedCurrent) {
                        showToast("Authentication Check Failed: Current passphrase coordinates invalid.", "error");
                        return;
                      }

                      // Hash and update new password
                      const hashedNew = await hashPassword(settingsNewPassword, session?.email || "");
                      userObj.passwordHash = hashedNew;
                      users[operatorIdx] = userObj;

                      localStorage.setItem("crm_users", JSON.stringify(users));
                      setSystemUsers(users);

                      // Sync to DB
                      syncToServer("/api/users", "PUT", userObj);

                      // Reset inputs
                      setSettingsCurrentPassword("");
                      setSettingsNewPassword("");
                      setSettingsConfirmPassword("");

                      showToast("Analyst passphrase securely updated in enterprise key directory.", "success");
                    }}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Alter Seat Credentials
                  </button>
                </div>

                {/* Panel 3: Notification Preferences Routing */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Bell className="w-4 h-4 text-blue-500" />
                    <div>
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-705">Notification Preferences & Routing</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Configure automatic watchdog reminders and strategic activity summaries</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <label className="text-xs font-semibold text-slate-700">Email Alert Notifications</label>
                        <p className="text-[10px] text-slate-400">Receive critical touchpoint alerts and assigned alignment reminders directly in email inbox</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailAlerts}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailAlerts: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-1 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <label className="text-xs font-semibold text-slate-700">System Watchdog Reminders</label>
                        <p className="text-[10px] text-slate-400">Display warning headers and pulsing alarms for interactions scheduled within expiration boundary</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.watchdogReminders}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, watchdogReminders: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-1 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <label className="text-xs font-semibold text-slate-700">Weekly Strategic Alignment Digest</label>
                        <p className="text-[10px] text-slate-400">Provide an active summary briefing of pending contracts and new Touchpoints every Monday morning</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.weeklyDigest}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, weeklyDigest: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-1 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <label className="text-xs font-semibold text-slate-700">In-App Banner Warnings</label>
                        <p className="text-[10px] text-slate-400">Register real-time feedback and toaster notifications inside user portal interfaces</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.desktopNotifications}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, desktopNotifications: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-1 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5">Watchdog Threshold</label>
                        <select
                          value={notificationPrefs.alertThresholdHours}
                          onChange={(e) => setNotificationPrefs({ ...notificationPrefs, alertThresholdHours: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-semibold text-slate-705 focus:outline-none cursor-pointer"
                        >
                          <option value="12">12 Hours</option>
                          <option value="24">24 Hours (Default)</option>
                          <option value="48">48 Hours</option>
                          <option value="72">72 Hours</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5">Reporting Frequency</label>
                        <select
                          value={notificationPrefs.alertFrequency}
                          onChange={(e) => setNotificationPrefs({ ...notificationPrefs, alertFrequency: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-semibold text-slate-705 focus:outline-none cursor-pointer"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Bundle</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      localStorage.setItem("crm_notification_prefs", JSON.stringify(notificationPrefs));
                      showToast("Routing triggers and watchdog parameters synchronized successfully.", "success");
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Sync Routing Parameters
                  </button>
                </div>

                {/* Panel 4: UI Aesthetics, Theme and Display Density */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <SlidersHorizontal className="w-4 h-4 text-teal-500" />
                    <div>
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-705">Display Layout & Interface Themes</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Customize the aesthetic experience and line density of the workspace</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Theme Selectors */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">Workspace Theme Presets</label>
                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-755">
                        {/* Option 1: Light Slate */}
                        <div
                          onClick={() => {
                            const updated = { ...uiSettings, theme: "slate" };
                            setUiSettings(updated);
                            localStorage.setItem("crm_ui_settings", JSON.stringify(updated));
                            showToast("Applied modern Swiss Slate canvas preset.", "info");
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                            uiSettings.theme === "slate" ? "bg-indigo-50/50 border-indigo-400 shadow-xs" : "bg-white border-slate-200 hover:border-slate-350"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800">Swiss Slate</span>
                            {uiSettings.theme === "slate" && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 py-0.2 rounded font-mono font-bold leading-none">ACTIVE</span>}
                          </div>
                          <p className="text-[9.5px] text-slate-400 leading-tight">Default clean background slate with bright deep indigo accents.</p>
                        </div>

                        {/* Option 2: Charcoal Corporate */}
                        <div
                          onClick={() => {
                            const updated = { ...uiSettings, theme: "charcoal" };
                            setUiSettings(updated);
                            localStorage.setItem("crm_ui_settings", JSON.stringify(updated));
                            showToast("Applied Classic Corporate Charcoal theme.", "info");
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                            uiSettings.theme === "charcoal" ? "bg-zinc-100 border-zinc-500 shadow-xs" : "bg-white border-slate-200 hover:border-slate-350"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-zinc-800">Charcoal Corporate</span>
                            {uiSettings.theme === "charcoal" && <span className="text-[10px] bg-zinc-200 text-zinc-800 px-1 py-0.2 rounded font-mono font-bold leading-none">ACTIVE</span>}
                          </div>
                          <p className="text-[9.5px] text-zinc-500 leading-tight">Traditional neutral gray system emphasizing industrial layouts.</p>
                        </div>

                        {/* Option 3: Midnight Anthracite */}
                        <div
                          onClick={() => {
                            const updated = { ...uiSettings, theme: "pitch-dark" };
                            setUiSettings(updated);
                            localStorage.setItem("crm_ui_settings", JSON.stringify(updated));
                            showToast("Midnight low-light UI initialized.", "info");
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                            uiSettings.theme === "pitch-dark" ? "bg-slate-900 border-slate-700 text-slate-100 shadow-xs" : "bg-white border-slate-200 hover:border-slate-350"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-200">Midnight Anthracite</span>
                            {uiSettings.theme === "pitch-dark" && <span className="text-[10px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono font-bold leading-none">ACTIVE</span>}
                          </div>
                          <p className="text-[9.5px] text-slate-400 leading-tight">Dark low-light visual canvas keeping eyes comfortable at night.</p>
                        </div>

                        {/* Option 4: Vintage Sepia Ledger */}
                        <div
                          onClick={() => {
                            const updated = { ...uiSettings, theme: "amber-sepia" };
                            setUiSettings(updated);
                            localStorage.setItem("crm_ui_settings", JSON.stringify(updated));
                            showToast("Warm Sepia paper presets applied.", "info");
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                            uiSettings.theme === "amber-sepia" ? "bg-[#f5ebd1] border-[#c0b391] text-[#2c220f] shadow-xs" : "bg-white border-slate-200 hover:border-slate-350"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-amber-950">Vintage Sepia Ledger</span>
                            {uiSettings.theme === "amber-sepia" && <span className="text-[10px] bg-[#dfd0aa] text-[#4d3319] px-1 py-0.2 rounded font-mono font-bold leading-none">ACTIVE</span>}
                          </div>
                          <p className="text-[9.5px] text-[#8c663d] leading-tight">Parchment papers vintage accounting aura and warm contrast.</p>
                        </div>
                      </div>
                    </div>

                    {/* Display Density Selectors */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">Display Spacing Density</label>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold gap-1 select-none border border-slate-200">
                        <button
                          onClick={() => {
                            const updated = { ...uiSettings, density: "compact" };
                            setUiSettings(updated);
                            localStorage.setItem("crm_ui_settings", JSON.stringify(updated));
                            showToast("Assigned compact density parameters.", "success");
                          }}
                          className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer text-center text-[11px] ${
                            uiSettings.density === "compact" ? "bg-white text-slate-900 shadow-xs border border-slate-200/50" : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          📋 Compact
                        </button>
                        <button
                          onClick={() => {
                            const updated = { ...uiSettings, density: "cozy" };
                            setUiSettings(updated);
                            localStorage.setItem("crm_ui_settings", JSON.stringify(updated));
                            showToast("Assigned standard cozy density parameters.", "success");
                          }}
                          className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer text-center text-[11px] ${
                            uiSettings.density === "cozy" ? "bg-white text-slate-900 shadow-xs border border-slate-200/50" : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          📊 Cozy
                        </button>
                        <button
                          onClick={() => {
                            const updated = { ...uiSettings, density: "spacious" };
                            setUiSettings(updated);
                            localStorage.setItem("crm_ui_settings", JSON.stringify(updated));
                            showToast("Assigned luxurious spacious density parameters.", "success");
                          }}
                          className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer text-center text-[11px] ${
                            uiSettings.density === "spacious" ? "bg-white text-slate-900 shadow-xs border border-slate-200/50" : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          🌟 Spacious
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500 leading-relaxed font-mono">
                    <p className="font-bold flex items-center gap-1"><span className="text-emerald-500">✓</span> DIRECT PREVIEW ENGINE</p>
                    <p>Changing these variables immediately restyles DOM coordinates across tables, list cells, and modal layers using modular atomic utilities.</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === "admin-visibility" && session?.role === "Senior Analyst" && (
            <div className="space-y-6 animate-in fade-in duration-300" id="admin-visibility-panel">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Lock className="w-5 h-5 text-rose-500" /> Administrative Visibility Override
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    See restricted system notes and document classifications. Alter visibility values in bulk to resolve organization-level access gaps. Note contents remain fully masked for high security.
                  </p>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search title, author, ID..."
                      value={adminVisibilitySearch}
                      onChange={(e) => setAdminVisibilitySearch(e.target.value)}
                      className="bg-slate-50 border border-slate-250 rounded-lg px-3 py-1 text-xs outline-none focus:border-rose-500 transition w-full font-sans font-semibold"
                    />
                  </div>

                  {/* Filter Type */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Class:</span>
                    <select
                      value={adminVisibilityTypeFilter}
                      onChange={(e) => setAdminVisibilityTypeFilter(e.target.value as any)}
                      className="bg-slate-50 border border-slate-250 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-755 outline-none focus:border-rose-500 transition"
                    >
                      <option value="ALL">All Core Classes</option>
                      <option value="note">Notes Ledger List</option>
                      <option value="doc">Document Vault List</option>
                    </select>
                  </div>

                  {/* Filter Visibility */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Sphere:</span>
                    <select
                      value={adminVisibilityLevelFilter}
                      onChange={(e) => setAdminVisibilityLevelFilter(e.target.value as any)}
                      className="bg-slate-50 border border-slate-250 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-755 outline-none focus:border-rose-500 transition"
                    >
                      <option value="ALL">All Visibility Levels</option>
                      <option value="Private">🔒 Private (Restricted)</option>
                      <option value="Team">👥 Team (Classified)</option>
                      <option value="Public">🌍 Public</option>
                    </select>
                  </div>
                </div>

                {/* Bulk Actions Button Block */}
                {selectedAdminItemIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3.5 py-1.5 rounded-lg animate-in zoom-in-95 duration-150">
                    <span className="text-[11px] font-bold text-rose-700 font-mono">
                      {selectedAdminItemIds.length} Selected:
                    </span>
                    <button
                      onClick={() => handleBulkChangeVisibility("Public")}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      Make 🌍 Public
                    </button>
                    <button
                      onClick={() => handleBulkChangeVisibility("Team")}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      Make 👥 Team
                    </button>
                    <button
                      onClick={() => setSelectedAdminItemIds([])}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold ml-1 underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Items List Table container */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        <th className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={adminOverrideItems.length > 0 && selectedAdminItemIds.length === adminOverrideItems.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAdminItemIds(adminOverrideItems.map(item => item.id));
                              } else {
                                setSelectedAdminItemIds([]);
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Subject / Title</th>
                        <th className="p-4">Omitted Contents / Type Details</th>
                        <th className="p-4">Author / Owner</th>
                        <th className="p-4">Visibility Override Option</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-sans">
                      {adminOverrideItems.length > 0 ? (
                        adminOverrideItems.map((item) => {
                          const isSelected = selectedAdminItemIds.includes(item.id);
                          const owner = isOwner(item);
                          const isRestricted = !owner && (item.visibility === "Private" || item.visibility === "Team");

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-50/30 transition-colors font-semibold ${isSelected ? "bg-rose-50/10" : ""}`}
                            >
                              {/* Checkbox selector */}
                              <td className="p-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAdminItemIds(prev => [...prev, item.id]);
                                    } else {
                                      setSelectedAdminItemIds(prev => prev.filter(id => id !== item.id));
                                    }
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </td>

                              {/* Media Class Badge */}
                              <td className="p-4">
                                {item.itemType === "note" ? (
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold uppercase text-[9px] rounded-full border border-indigo-100">
                                    Notes Ledger
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-violet-50 text-violet-700 font-bold uppercase text-[9px] rounded-full border border-violet-100">
                                    Doc Vault
                                  </span>
                                )}
                              </td>

                              {/* Subject */}
                              <td className="p-4">
                                <div className="font-extrabold text-slate-900 leading-tight block">{item.titleOrSubject}</div>
                                <span className="text-[9.5px] text-slate-400 font-mono">ID: {item.id}</span>
                              </td>

                              {/* Display Contents / Details */}
                              <td className="p-4 leading-relaxed font-mono text-[11px] max-w-[280px]">
                                {isRestricted ? (
                                  <span className="text-rose-500 font-semibold italic bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded text-[10px]">
                                    •••••••• [Masked Operational Privacy Block]
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-xs font-sans font-medium line-clamp-2">
                                    {item.displayContent}
                                  </span>
                                )}
                              </td>

                              {/* Author / Date of Upload */}
                              <td className="p-4">
                                <div className="font-extrabold text-slate-950">{item.author}</div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(item.uploadedOrCreated).toLocaleDateString()}
                                </span>
                              </td>

                              {/* Visibility Change action */}
                              <td className="p-4">
                                <div className="flex items-center gap-1 font-semibold">
                                  <select
                                    value={item.visibility}
                                    onChange={(e) => {
                                      if (item.itemType === "note") {
                                        handleChangeNoteVisibility(item.id, e.target.value as any);
                                      } else {
                                        handleChangeDocVisibility(item.id, e.target.value as any);
                                      }
                                    }}
                                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:ring-rose-500 outline-none"
                                    title="Administrative Override"
                                  >
                                    <option value="Public">🌍 Public</option>
                                    <option value="Team">👥 Team</option>
                                    {owner && <option value="Private">🔒 Private</option>}
                                    {!owner && item.visibility === "Private" && (
                                      <option value="Private" disabled>🔒 Private (Non-Owner Locked)</option>
                                    )}
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No notes or documents matching standard administrative lookup filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DYNAMIC GLOBAL SEARCH RESULTS MODAL */}
      {isSearchActive && (
        <div id="search-results-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-12">
          <div className="fixed inset-0" onClick={() => { setIsSearchActive(false); setSearchQuery(""); }} />
          
          <div className="bg-white w-[600px] max-h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 z-[60] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                <Search className="w-4 h-4" /> Global Database Results for &quot;{searchQuery}&quot;
              </span>
              <button onClick={() => { setIsSearchActive(false); setSearchQuery(""); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Interactions ({searchResults.interactions.length})</h4>
                {searchResults.interactions.length === 0 ? <p className="text-xs text-slate-400 italic">No matches</p> : (
                  <div className="space-y-1">
                    {searchResults.interactions.map((i) => (
                      <div key={i.id} onClick={() => { setSelectedItem({ dataType: "interaction", data: i }); setIsSearchActive(false); setSearchQuery(""); }} className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg cursor-pointer">
                        <p className="font-semibold text-xs text-slate-900">{highlightText(i.subject, searchQuery)}</p>
                        <p className="text-[10px] text-slate-500">Corporate client mapping: {highlightText(i.client, searchQuery)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contacts ({searchResults.contacts.length})</h4>
                {searchResults.contacts.length === 0 ? <p className="text-xs text-slate-400 italic">No matches</p> : (
                  <div className="space-y-1">
                    {searchResults.contacts.map((c) => (
                      <div key={c.id} onClick={() => { setSelectedItem({ dataType: "contact", data: c }); setIsSearchActive(false); setSearchQuery(""); }} className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg cursor-pointer">
                        <p className="font-semibold text-xs text-slate-900">{highlightText(c.name, searchQuery)}</p>
                        <p className="text-[10px] text-slate-500">{highlightText(c.role, searchQuery)} at {highlightText(c.company, searchQuery)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Companies ({searchResults.entities.length})</h4>
                {searchResults.entities.length === 0 ? <p className="text-xs text-slate-400 italic">No matches</p> : (
                  <div className="space-y-1">
                    {searchResults.entities.map((e) => (
                      <div key={e.id} onClick={() => { setSelectedItem({ dataType: "entity", data: e }); setIsSearchActive(false); setSearchQuery(""); }} className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg cursor-pointer">
                        <p className="font-semibold text-xs text-slate-900">{highlightText(e.name, searchQuery)}</p>
                        <p className="text-[10px] text-slate-500">{highlightText(e.industry, searchQuery)} and based in {highlightText(e.location, searchQuery)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Engagements ({searchResults.engagements.length})</h4>
                {searchResults.engagements.length === 0 ? <p className="text-xs text-slate-400 italic">No matches</p> : (
                  <div className="space-y-1">
                    {searchResults.engagements.map((g) => (
                      <div key={g.id} onClick={() => { setSelectedItem({ dataType: "engagement", data: g }); setSelectedEngagementForView(g); setActiveTab("engagements"); setIsSearchActive(false); setSearchQuery(""); }} className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg cursor-pointer">
                        <p className="font-semibold text-xs text-slate-900">{highlightText(g.title, searchQuery)}</p>
                        <p className="text-[10px] text-slate-500">{highlightText(g.type, searchQuery)} &bull; {highlightText(g.client, searchQuery)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW WORKSPACE ENTRY MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[80] p-4">
          <div className="fixed inset-0" onClick={() => setIsNewModalOpen(false)} />
          
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 z-[90] animate-in zoom-in-95 duration-200 text-xs">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center font-bold text-slate-800">
              <span>Register New Workspace Coordinates</span>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

             <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-1 justify-center font-bold uppercase tracking-wider text-[10px] text-slate-500">
              <button type="button" onClick={() => setNewType("interaction")} className={`px-2.5 py-1 rounded transition ${newType === "interaction" ? "bg-slate-950 text-white" : "hover:bg-slate-200"}`}>Interaction</button>
              <button type="button" onClick={() => setNewType("contact")} className={`px-2.5 py-1 rounded transition ${newType === "contact" ? "bg-slate-950 text-white" : "hover:bg-slate-200"}`}>Contact</button>
              <button type="button" onClick={() => setNewType("entity")} className={`px-2.5 py-1 rounded transition ${newType === "entity" ? "bg-slate-950 text-white" : "hover:bg-slate-200"}`}>Company</button>
              <button type="button" onClick={() => setNewType("engagement")} className={`px-2.5 py-1 rounded transition ${newType === "engagement" ? "bg-slate-950 text-white" : "hover:bg-slate-200"}`}>Engagement</button>
              <button type="button" onClick={() => setNewType("user")} className={`px-2.5 py-1 rounded transition ${newType === "user" ? "bg-slate-950 text-white" : "hover:bg-slate-200"}`}>Operator</button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              {newType === "interaction" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Subject Briefing</label>
                    <input type="text" required value={intForm.subject} onChange={(e) => setIntForm({ ...intForm, subject: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg focus:bg-white outline-none animate-in fade-in" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Type</label>
                      <GroupedTagsInput
                        groupName="int_type"
                        value={intForm.type}
                        onChange={(val) => setIntForm({ ...intForm, type: val as any })}
                        tags={tags}
                        syncToServer={syncToServer}
                        loadSQLiteState={loadSQLiteState}
                        showToast={showToast}
                        placeholder="Select or enter types..."
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Target Date {intForm.PrevInteraction ? "(Optional - Auto-calculated)" : ""}</label>
                      <input type="date" required={!intForm.PrevInteraction} value={intForm.date} onChange={(e) => setIntForm({ ...intForm, date: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none animate-in fade-in" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Corporate Client</label>
                      <select
                        value={intForm.client}
                        onChange={(e) => {
                          const nextClient = e.target.value;
                          const nextAssignees = nextClient 
                            ? contacts.filter((c) => (c.company || "").toLowerCase() === nextClient.toLowerCase())
                            : [];
                          const isCurrentAssigneeValid = nextAssignees.some((c) => c.name === intForm.assignee);
                          const nextAssignee = isCurrentAssigneeValid 
                            ? intForm.assignee 
                            : (nextAssignees[0]?.name || "");
                          setIntForm({ ...intForm, client: nextClient, assignee: nextAssignee });
                        }}
                        className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none text-slate-705"
                      >
                        <option value="">-- Choose Corporate Client --</option>
                        {entities.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Assignee</label>
                      <select 
                        value={intForm.assignee} 
                        onChange={(e) => setIntForm({ ...intForm, assignee: e.target.value })} 
                        className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none text-slate-705 disabled:opacity-50 transition-all"
                        disabled={!intForm.client}
                      >
                        {intForm.client ? (
                          <>
                            {formAssigneeOptions.length > 0 ? (
                              <>
                                <option value="">-- Choose Assignee --</option>
                                {formAssigneeOptions.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </>
                            ) : (
                              <option value="">-- No contacts for this Client --</option>
                            )}
                          </>
                        ) : (
                          <option value="">-- Choose Corporate Client First --</option>
                        )}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Interaction Summary Brief</label>
                    <textarea rows={2} value={intForm.summary} onChange={(e) => setIntForm({ ...intForm, summary: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none animate-in fade-in" placeholder="Milestone deliverables details..." />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Operational Note</label>
                    <textarea rows={2} value={intForm.Note} onChange={(e) => setIntForm({ ...intForm, Note: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" placeholder="Initial operational details..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Touchpoint Status</label>
                      <select
                        value={intForm.status}
                        onChange={(e) => setIntForm({ ...intForm, status: e.target.value as any })}
                        className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none text-slate-705 font-semibold"
                      >
                        <option value="IN PROGRESS">IN PROGRESS</option>
                        <option value="SCHEDULED">SCHEDULED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="CANCELED">CANCELED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 45"
                        value={intForm.duration}
                        onChange={(e) => setIntForm({ ...intForm, duration: e.target.value })}
                        className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none text-slate-705 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Previous Interaction Link</label>
                    <select value={intForm.PrevInteraction || ""} onChange={(e) => setIntForm({ ...intForm, PrevInteraction: e.target.value || null })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none text-xs text-slate-705">
                        <option value="">-- No Previous Interaction --</option>
                        {interactions.map((i) => <option key={i.id} value={i.id}>{i.subject} ({i.date || "Pending Predecessor"})</option>)}
                      </select>
                    </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Linked Engagement (SOW)</label>
                    <select
                      value={intForm.engagementId || ""}
                      onChange={(e) => {
                        const engId = e.target.value || null;
                        const selectedEng = engagements.find((eg) => eg.id === engId);
                        if (selectedEng) {
                          const nextClient = selectedEng.client;
                          const nextAssignees = contacts.filter((c) => (c.company || "").toLowerCase() === nextClient.toLowerCase());
                          const isCurrentAssigneeValid = nextAssignees.some((c) => c.name === intForm.assignee);
                          const nextAssignee = isCurrentAssigneeValid ? intForm.assignee : (nextAssignees[0]?.name || "");
                          setIntForm({
                            ...intForm,
                            engagementId: engId,
                            client: nextClient,
                            assignee: nextAssignee
                          });
                        } else {
                          setIntForm({
                            ...intForm,
                            engagementId: null
                          });
                        }
                      }}
                      className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none text-slate-705 font-medium"
                    >
                      <option value="">-- No Direct Engagement Link (Optional) --</option>
                      {engagements
                        .filter((eng) => !intForm.client || eng.client === intForm.client)
                        .map((eng) => (
                          <option key={eng.id} value={eng.id}>
                            [{eng.client}] {eng.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  {/* Next Follow-up Plan */}
                  <div className="border-t border-slate-200 pt-3 space-y-3">
                    <label className="block text-slate-700 font-extrabold text-[11px] uppercase tracking-wider">Next Follow-up Planner (Optional)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 text-xs mb-1">Follow-up Date</label>
                        <input
                          type="date"
                          value={intForm.followUpDate}
                          onChange={(e) => setIntForm({ ...intForm, followUpDate: e.target.value })}
                          className="w-full bg-slate-50 border p-2 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div className="flex flex-col justify-end pb-1.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-bold">
                          <input
                            type="checkbox"
                            checked={intForm.followUpCompleted}
                            onChange={(e) => setIntForm({ ...intForm, followUpCompleted: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-350 cursor-pointer"
                          />
                          <span>Follow-up Completed</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs mb-1">Follow-up Task Objective / Parameters</label>
                      <textarea
                        rows={2}
                        value={intForm.followUpNotes}
                        onChange={(e) => setIntForm({ ...intForm, followUpNotes: e.target.value })}
                        placeholder="Detail the target checklist action for tracking..."
                        className="w-full bg-slate-50 border p-2 rounded-lg text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {newType === "contact" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">First Name *</label>
                      <input type="text" required value={contactForm.FirstName} onChange={(e) => setContactForm({ ...contactForm, FirstName: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Middle Name</label>
                      <input type="text" value={contactForm.MiddleName} onChange={(e) => setContactForm({ ...contactForm, MiddleName: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Last Name</label>
                      <input type="text" value={contactForm.Lastname} onChange={(e) => setContactForm({ ...contactForm, Lastname: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Corporate Role</label>
                      <GroupedTagsInput
                        groupName="contact_role"
                        value={contactForm.role}
                        onChange={(val) => setContactForm({ ...contactForm, role: val })}
                        tags={tags}
                        syncToServer={syncToServer}
                        loadSQLiteState={loadSQLiteState}
                        showToast={showToast}
                        placeholder="Choose or type roles..."
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Associated Company</label>
                      <select value={contactForm.company} onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none text-slate-705">
                        <option value="">-- Choose Corporate --</option>
                        {entities.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Coordinates Email (Optional)</label>
                      <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Primary Desk Phone</label>
                      <input type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" placeholder="+1 (555) 444-2211" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">LinkedIn URL</label>
                      <input type="url" value={contactForm.LinkedInURL} onChange={(e) => setContactForm({ ...contactForm, LinkedInURL: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Rating (Value 0 - 4)</label>
                      <select value={contactForm.Ratting ?? ""} onChange={(e) => setContactForm({ ...contactForm, Ratting: e.target.value ? parseInt(e.target.value) : null })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none">
                        <option value="">No Rating</option>
                        <option value="0">0 (Red)</option>
                        <option value="1">1 (Orange)</option>
                        <option value="2">2 (Yellow)</option>
                        <option value="3">3 (Blue)</option>
                        <option value="4">4 (Green)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {newType === "entity" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Company Name</label>
                    <input type="text" required value={entityForm.name} onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Industry Classification</label>
                      <GroupedTagDropdown
                        groupName="company_industry"
                        value={entityForm.industry}
                        onChange={(val) => setEntityForm({ ...entityForm, industry: val })}
                        tags={tags}
                        syncToServer={syncToServer}
                        loadSQLiteState={loadSQLiteState}
                        showToast={showToast}
                        placeholder="Choose or type industry..."
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Account Relationship Tier</label>
                      <GroupedTagDropdown
                        groupName="company_tier"
                        value={entityForm.tier}
                        onChange={(val) => setEntityForm({ ...entityForm, tier: val as any })}
                        tags={tags}
                        syncToServer={syncToServer}
                        loadSQLiteState={loadSQLiteState}
                        showToast={showToast}
                        placeholder="Choose or type tier..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Address Line 1</label>
                      <input type="text" value={entityForm.AddressLine_1} onChange={(e) => setEntityForm({ ...entityForm, AddressLine_1: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Address Line 2</label>
                      <input type="text" value={entityForm.AddressLine_2} onChange={(e) => setEntityForm({ ...entityForm, AddressLine_2: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Postal Code</label>
                      <input type="text" value={entityForm.Postalcode} onChange={(e) => setEntityForm({ ...entityForm, Postalcode: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">City</label>
                      <input type="text" value={entityForm.City} onChange={(e) => setEntityForm({ ...entityForm, City: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Location Search Geolocation</label>
                      <input type="text" required value={entityForm.location} onChange={(e) => setEntityForm({ ...entityForm, location: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" placeholder="London, UK" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Website URL</label>
                      <input type="url" value={entityForm.Website} onChange={(e) => setEntityForm({ ...entityForm, Website: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" placeholder="https://example.com" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Rating (Value 0 - 4)</label>
                      <select value={entityForm.Rating ?? ""} onChange={(e) => setEntityForm({ ...entityForm, Rating: e.target.value ? parseInt(e.target.value) : null })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-nonetext-slate-705">
                        <option value="">No Rating</option>
                        <option value="0">0 (Red)</option>
                        <option value="1">1 (Orange)</option>
                        <option value="2">2 (Yellow)</option>
                        <option value="3">3 (Blue)</option>
                        <option value="4">4 (Green)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {newType === "engagement" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Engagement Title</label>
                    <input type="text" required value={engagementForm.title} onChange={(e) => setEngagementForm({ ...engagementForm, title: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" placeholder="Strategic Expansion SOW" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Associated Corporate Client</label>
                    <select value={engagementForm.client} onChange={(e) => setEngagementForm({ ...engagementForm, client: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none text-slate-705">
                      <option value="">-- Choose Corporate --</option>
                      {entities.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Engagement Type</label>
                      <GroupedTagsInput
                        groupName="eng_type"
                        value={engagementForm.type}
                        onChange={(val) => setEngagementForm({ ...engagementForm, type: val })}
                        tags={tags}
                        syncToServer={syncToServer}
                        loadSQLiteState={loadSQLiteState}
                        showToast={showToast}
                        placeholder="Choose or create types..."
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Executive Status</label>
                      <GroupedTagDropdown
                        groupName="eng_status"
                        value={engagementForm.status}
                        onChange={(val) => setEngagementForm({ ...engagementForm, status: val as any })}
                        tags={tags}
                        syncToServer={syncToServer}
                        loadSQLiteState={loadSQLiteState}
                        showToast={showToast}
                        placeholder="Choose or create status..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Initiative Commencement</label>
                      <input type="date" required value={engagementForm.startDate} onChange={(e) => setEngagementForm({ ...engagementForm, startDate: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-505 font-bold mb-1">Term Completion</label>
                      <input 
                        type="date" 
                        required 
                        disabled={engagementForm.endDate === "2035-12-31"}
                        value={engagementForm.endDate} 
                        onChange={(e) => setEngagementForm({ ...engagementForm, endDate: e.target.value })} 
                        className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none disabled:opacity-50" 
                      />
                    </div>
                    <div className="col-span-2 pt-1 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="ongoing-engagement-checkbox"
                        checked={engagementForm.endDate === "2035-12-31"}
                        onChange={(e) => {
                          setEngagementForm({
                            ...engagementForm,
                            endDate: e.target.checked ? "2035-12-31" : new Date().toISOString().split("T")[0]
                          });
                        }}
                        className="w-4 h-4 cursor-pointer rounded border-slate-350 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="ongoing-engagement-checkbox" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                        Ongoing / Continuous Initiative (No fixed end date, uses far-away 2035-12-31)
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Engagement Objective Briefing</label>
                    <textarea rows={3} value={engagementForm.description} onChange={(e) => setEngagementForm({ ...engagementForm, description: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" placeholder="Scope statement and deliverables checklist..." />
                  </div>
                </div>
              )}

              {newType === "user" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Operator Profile Full Name</label>
                    <input type="text" required value={operatorForm.name} onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" placeholder="Operator Name" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Corporate Seat Email</label>
                      <input type="email" required value={operatorForm.email} onChange={(e) => setOperatorForm({ ...operatorForm, email: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" placeholder="username@enterprise.com" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Operator System Role</label>
                      <select value={operatorForm.role} onChange={(e) => setOperatorForm({ ...operatorForm, role: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none text-slate-705 font-semibold">
                        {session?.role === "Senior Analyst" && (
                          <option value="Senior Analyst">Senior Analyst (System Administrator)</option>
                        )}
                        <option value="Senior Operator">Senior Operator</option>
                        <option value="Auditor Seat">Auditor Seat</option>
                        <option value="Associate Coordinator">Associate Coordinator</option>
                        <option value="System Security Agent">System Security Agent</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Access passphrase</label>
                    <input type="password" required value={operatorForm.passphrase} onChange={(e) => setOperatorForm({ ...operatorForm, passphrase: e.target.value })} className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none" placeholder="••••••••" />
                    <span className="block text-[10px] text-slate-400 mt-1">This seat passphrase will be securely hashed with SHA variants in our system sandbox.</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 hover:bg-slate-100 rounded-lg text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">Register Sync</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RIGHT SLIDEOUT CONFIGURATION DRAWER */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex justify-end z-[80] animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedItem(null)} />
          
          <div className="bg-white w-[420px] h-full shadow-2xl border-l border-slate-200 z-[90] flex flex-col justify-between animate-in slide-in-from-right duration-200">
            
            <div className="overflow-y-auto flex-1 text-xs">
              
              {/* Header */}
              <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center text-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Configuration Drawer</span>
                  <h3 className="font-extrabold text-sm tracking-tight leading-none uppercase">Database Link Console</h3>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Editable Fields */}
              <div className="p-6 space-y-5">
                {selectedItem.dataType === "interaction" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Subject Briefing</label>
                      <input
                        type="text"
                        value={selectedItem.data.subject}
                        onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, subject: e.target.value } })}
                        className="w-full bg-slate-50 border p-2.5 rounded-lg focus:bg-white outline-none font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Interaction Type</label>
                      <GroupedTagsInput
                        groupName="int_type"
                        value={selectedItem.data.type || ""}
                        onChange={(val) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, type: val } })}
                        tags={tags}
                        syncToServer={syncToServer}
                        loadSQLiteState={loadSQLiteState}
                        showToast={showToast}
                        placeholder="Choose or create types..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Operator Assignee</label>
                        <select
                          value={selectedItem.data.assignee}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, assignee: e.target.value } })}
                          className="w-full bg-slate-50 border p-2.5 rounded-lg font-semibold text-slate-700"
                        >
                          <option value="">-- Choose Assignee --</option>
                          {/* Fallback for pre-existing assignees not in contacts */}
                          {selectedItem.data.assignee && !editAssigneeOptions.some((c) => c.name === selectedItem.data.assignee) && (
                            <option value={selectedItem.data.assignee}>{selectedItem.data.assignee}</option>
                          )}
                          {editAssigneeOptions.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Status Status</label>
                        <select
                          value={selectedItem.data.status}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, status: e.target.value as any } })}
                          className="w-full bg-slate-50 border p-2.5 rounded-lg font-semibold text-slate-700"
                        >
                          <option value="IN PROGRESS">IN PROGRESS</option>
                          <option value="SCHEDULED">SCHEDULED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="BLOCKED">BLOCKED</option>
                          <option value="CANCELED">CANCELED</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Operational Summary Details</label>
                      <textarea
                        rows={2}
                        value={selectedItem.data.summary || ""}
                        onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, summary: e.target.value } })}
                        className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Operational Note</label>
                      <textarea
                        rows={2}
                        value={selectedItem.data.Note || ""}
                        onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, Note: e.target.value } })}
                        className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none"
                        placeholder="Additional workspace note..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Scheduled Target Date {selectedItem.data.PrevInteraction ? "(Optional)" : ""}</label>
                        <input
                          type="date"
                          value={selectedItem.data.date || ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, date: e.target.value } })}
                          className="w-full bg-slate-50 border p-2.5 rounded-lg font-semibold text-slate-705 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Duration (minutes)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 45"
                          value={selectedItem.data.duration || ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, duration: e.target.value ? parseInt(e.target.value) : null } })}
                          className="w-full bg-slate-50 border p-2.5 rounded-lg font-semibold text-slate-705 outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Previous Linked Touchpoint / Dependency</label>
                      <select
                        value={selectedItem.data.PrevInteraction || ""}
                        onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, PrevInteraction: e.target.value ? e.target.value : null } })}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg outline-none text-xs text-slate-705"
                      >
                        <option value="">-- No Dependency (Independent Interaction) --</option>
                        {interactions
                          .filter((i) => i.id !== selectedItem.data.id)
                          .map((i) => (
                            <option key={i.id} value={i.id.replace(/\D/g, '') || i.id}>
                              {i.subject} ({i.date || "Pending Predecessor"})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Corporate Client</label>
                        <select
                          value={selectedItem.data.client || ""}
                          onChange={(e) => {
                            const nextClient = e.target.value;
                            const currentEng = engagements.find(eg => eg.id === selectedItem.data.engagementId);
                            const updatedEngagementId = currentEng && currentEng.client === nextClient 
                              ? selectedItem.data.engagementId 
                              : null;

                            setSelectedItem({
                              ...selectedItem,
                              data: {
                                ...selectedItem.data,
                                client: nextClient,
                                engagementId: updatedEngagementId
                              }
                            });
                          }}
                          className="w-full bg-slate-50 border p-2.5 rounded-lg font-semibold text-slate-700"
                        >
                          <option value="">-- Choose Corporate Client --</option>
                          {entities.map((ent) => (
                            <option key={ent.id} value={ent.name}>
                              {ent.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Associated SOW Engagement</label>
                        <select
                          value={selectedItem.data.engagementId || ""}
                          onChange={(e) => {
                            const nextEngId = e.target.value || null;
                            const targetEng = engagements.find(eg => eg.id === nextEngId);
                            setSelectedItem({
                              ...selectedItem,
                              data: {
                                ...selectedItem.data,
                                engagementId: nextEngId,
                                client: targetEng ? targetEng.client : selectedItem.data.client
                              }
                            });
                          }}
                          className="w-full bg-slate-50 border p-2.5 rounded-lg font-semibold text-slate-700"
                        >
                          <option value="">-- No Engagement Link (Optional) --</option>
                          {engagements
                            .filter(eng => !selectedItem.data.client || eng.client === selectedItem.data.client)
                            .map((eng) => (
                              <option key={eng.id} value={eng.id}>
                                [{eng.client}] {eng.title}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Next Follow Up Tracker */}
                    <div className="border-t border-slate-150 pt-4 mt-4 space-y-3">
                      <h4 className="font-extrabold text-slate-800 text-[10px] tracking-tight uppercase flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-650" /> Next Follow-up Tracker / Planner
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Follow-up Date</label>
                          <input
                            type="date"
                            value={selectedItem.data.followUpDate || ""}
                            onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, followUpDate: e.target.value } })}
                            className="w-full bg-slate-50 border p-2 rounded-lg text-xs font-mono text-slate-700"
                          />
                        </div>
                        <div className="flex flex-col justify-end pb-1.5">
                          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-705 font-bold">
                            <input
                              type="checkbox"
                              checked={!!selectedItem.data.followUpCompleted}
                              onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, followUpCompleted: e.target.checked } })}
                              className="w-4 h-4 text-emerald-605 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer"
                            />
                            <span>Follow-up Completed</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Follow-up Task / Objective Notes</label>
                        <textarea
                          rows={2}
                          value={selectedItem.data.followUpNotes || ""}
                          placeholder="Specify exact next actions, due logs, and parameters..."
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, followUpNotes: e.target.value } })}
                          className="w-full bg-slate-50 border p-2.5 rounded-lg text-xs outline-none text-slate-700 resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem.dataType === "contact" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">First Name *</label>
                        <input
                          type="text"
                          required
                          value={selectedItem.data.FirstName || ""}
                          onChange={(e) => {
                            const fn = e.target.value || "";
                            const mn = selectedItem.data.MiddleName || "";
                            const ln = selectedItem.data.Lastname || "";
                            setSelectedItem({
                              ...selectedItem,
                              data: {
                                ...selectedItem.data,
                                FirstName: fn,
                                name: `${fn} ${mn ? mn + ' ' : ''}${ln}`.trim()
                              }
                            });
                          }}
                          className="w-full bg-slate-50 border p-2 rounded-lg font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Middle Name</label>
                        <input
                          type="text"
                          value={selectedItem.data.MiddleName || ""}
                          onChange={(e) => {
                            const fn = selectedItem.data.FirstName || "";
                            const mn = e.target.value || "";
                            const ln = selectedItem.data.Lastname || "";
                            setSelectedItem({
                              ...selectedItem,
                              data: {
                                ...selectedItem.data,
                                MiddleName: mn,
                                name: `${fn} ${mn ? mn + ' ' : ''}${ln}`.trim()
                              }
                            });
                          }}
                          className="w-full bg-slate-50 border p-2 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Last Name</label>
                        <input
                          type="text"
                          value={selectedItem.data.Lastname || ""}
                          onChange={(e) => {
                            const fn = selectedItem.data.FirstName || "";
                            const mn = selectedItem.data.MiddleName || "";
                            const ln = e.target.value || "";
                            setSelectedItem({
                              ...selectedItem,
                              data: {
                                ...selectedItem.data,
                                Lastname: ln,
                                name: `${fn} ${mn ? mn + ' ' : ''}${ln}`.trim()
                              }
                            });
                          }}
                          className="w-full bg-slate-50 border p-2 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Full Compiled Name</label>
                      <input
                        type="text"
                        readOnly
                        value={selectedItem.data.name || ""}
                        className="w-full bg-slate-100 border p-2 rounded-lg font-bold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Corporate Role Title</label>
                      <GroupedTagsInput
                        groupName="contact_role"
                        value={selectedItem.data.role}
                        onChange={(val) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, role: val } })}
                        tags={tags}
                        syncToServer={syncToServer}
                        loadSQLiteState={loadSQLiteState}
                        showToast={showToast}
                        placeholder="Choose or type corporate roles..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Primary Email Contact (Optional)</label>
                      <input
                        type="email"
                        value={selectedItem.data.email || ""}
                        onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, email: e.target.value } })}
                        className="w-full bg-slate-50 border p-2.5 rounded-lg font-semibold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Desk Phone Number</label>
                      <input
                        type="tel"
                        value={selectedItem.data.phone || ""}
                        onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, phone: e.target.value } })}
                        className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">LinkedIn Profile</label>
                        <input
                          type="url"
                          value={selectedItem.data.LinkedInURL || ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, LinkedInURL: e.target.value } })}
                          className="w-full bg-slate-50 border p-2 rounded-lg text-xs"
                          placeholder="https://linkedin.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Corporate Rating Range</label>
                        <select
                          value={selectedItem.data.Ratting ?? ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, Ratting: e.target.value ? parseInt(e.target.value) : null } })}
                          className="w-full bg-slate-50 border p-2 rounded-lg text-xs text-slate-705"
                        >
                          <option value="">No Rating</option>
                          <option value="0">0 (Red)</option>
                          <option value="1">1 (Orange)</option>
                          <option value="2">2 (Yellow)</option>
                          <option value="3">3 (Blue)</option>
                          <option value="4">4 (Green)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem.dataType === "entity" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Company Name</label>
                      <input
                        type="text"
                        value={selectedItem.data.name}
                        onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, name: e.target.value } })}
                        className="w-full bg-slate-50 border p-2.5 rounded-lg font-bold outline-none text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Sector Classification</label>
                      <GroupedTagDropdown
                        groupName="company_industry"
                        value={selectedItem.data.industry}
                        onChange={(val) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, industry: val } })}
                        tags={tags}
                        syncToServer={syncToServer}
                        loadSQLiteState={loadSQLiteState}
                        showToast={showToast}
                        placeholder="Choose or type sector..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Relationship Tier</label>
                        <GroupedTagDropdown
                          groupName="company_tier"
                          value={selectedItem.data.tier}
                          onChange={(val) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, tier: val as any } })}
                          tags={tags}
                          syncToServer={syncToServer}
                          loadSQLiteState={loadSQLiteState}
                          showToast={showToast}
                          placeholder="Choose or type tier..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Headquarters Location</label>
                        <input
                          type="text"
                          value={selectedItem.data.location || ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, location: e.target.value } })}
                          className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Address Line 1</label>
                        <input
                          type="text"
                          value={selectedItem.data.AddressLine_1 || ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, AddressLine_1: e.target.value } })}
                          className="w-full bg-slate-50 border p-2 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Address Line 2</label>
                        <input
                          type="text"
                          value={selectedItem.data.AddressLine_2 || ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, AddressLine_2: e.target.value } })}
                          className="w-full bg-slate-50 border p-2 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Postal Code</label>
                        <input
                          type="text"
                          value={selectedItem.data.Postalcode || ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, Postalcode: e.target.value } })}
                          className="w-full bg-slate-50 border p-2 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">City</label>
                        <input
                          type="text"
                          value={selectedItem.data.City || ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, City: e.target.value } })}
                          className="w-full bg-slate-50 border p-2 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Official Website</label>
                        <input
                          type="url"
                          value={selectedItem.data.Website || ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, Website: e.target.value } })}
                          className="w-full bg-slate-50 border p-2 rounded-lg text-xs"
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Corporate Audit Rating</label>
                        <select
                          value={selectedItem.data.Rating ?? ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, Rating: e.target.value ? parseInt(e.target.value) : null } })}
                          className="w-full bg-slate-50 border p-2 rounded-lg text-xs font-semibold text-slate-700"
                        >
                          <option value="">No Rating</option>
                          <option value="0">0 (Red)</option>
                          <option value="1">1 (Orange)</option>
                          <option value="2">2 (Yellow)</option>
                          <option value="3">3 (Blue)</option>
                          <option value="4">4 (Green)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem.dataType === "engagement" && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Engagement Title</label>
                      <input
                        type="text"
                        value={selectedItem.data.title}
                        onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, title: e.target.value } })}
                        className="w-full bg-slate-50 border p-2.5 rounded-lg font-bold outline-none text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Agreement Type</label>
                      <GroupedTagsInput
                        groupName="eng_type"
                        value={selectedItem.data.type}
                        onChange={(val) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, type: val } })}
                        tags={tags}
                        syncToServer={syncToServer}
                        loadSQLiteState={loadSQLiteState}
                        showToast={showToast}
                        placeholder="Choose or create types..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Commencement Term</label>
                        <input
                          type="date"
                          value={selectedItem.data.startDate}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, startDate: e.target.value } })}
                          className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none text-slate-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Termination Term</label>
                        <input
                          type="date"
                          disabled={selectedItem.data.endDate === "2035-12-31"}
                          value={selectedItem.data.endDate}
                          onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, endDate: e.target.value } })}
                          className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none text-slate-700 font-mono disabled:opacity-50"
                        />
                      </div>
                      <div className="col-span-2 pt-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="edit-ongoing-engagement-checkbox"
                          checked={selectedItem.data.endDate === "2035-12-31"}
                          onChange={(e) => {
                            setSelectedItem({
                              ...selectedItem,
                              data: {
                                ...selectedItem.data,
                                endDate: e.target.checked ? "2035-12-31" : new Date().toISOString().split("T")[0]
                              }
                            });
                          }}
                          className="w-4 h-4 cursor-pointer rounded border-slate-350 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="edit-ongoing-engagement-checkbox" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                          Ongoing / Continuous Initiative (No fixed end date, uses far-away 2035-12-31)
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Executive Status</label>
                      <GroupedTagDropdown
                        groupName="eng_status"
                        value={selectedItem.data.status}
                        onChange={(val) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, status: val as any } })}
                        tags={tags}
                        syncToServer={syncToServer}
                        loadSQLiteState={loadSQLiteState}
                        showToast={showToast}
                        placeholder="Choose or create status..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Engagement Objective Briefing</label>
                      <textarea
                        rows={4}
                        value={selectedItem.data.description}
                        onChange={(e) => setSelectedItem({ ...selectedItem, data: { ...selectedItem.data, description: e.target.value } })}
                        className="w-full bg-slate-50 border p-2.5 rounded-lg outline-none leading-relaxed text-slate-700"
                      />
                    </div>
                  </div>
                )}

                {/* OPERATIONAL CHECKLIST & MILESTONE TRACKER */}
                {["contact", "entity", "engagement"].includes(selectedItem.dataType) && (
                  <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <h4 className="font-bold text-slate-900 text-[11px] tracking-tight uppercase flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-emerald-600" /> Operational SOP Checklist
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Track procedure milestones via tag compliance</p>
                      </div>
                      {(() => {
                        const checklistTags = tags.filter((t) => t.groupName === "oper_checklist");
                        if (checklistTags.length === 0) return null;
                        const currentTagIds = selectedItem.data.tagIds || [];
                        const completedCount = checklistTags.filter((t) => currentTagIds.includes(t.id)).length;
                        const percent = Math.round((completedCount / checklistTags.length) * 100);
                        return (
                          <span className="text-[10px] font-mono font-extrabold px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {percent}% Completed
                          </span>
                        );
                      })()}
                    </div>

                    {/* Progress Bar */}
                    {(() => {
                      const checklistTags = tags.filter((t) => t.groupName === "oper_checklist");
                      if (checklistTags.length === 0) return null;
                      const currentTagIds = selectedItem.data.tagIds || [];
                      const completedCount = checklistTags.filter((t) => currentTagIds.includes(t.id)).length;
                      const percent = Math.round((completedCount / checklistTags.length) * 100);
                      return (
                        <div className="space-y-1.5">
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-full rounded-full transition-all duration-300" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                            <span>{completedCount} of {checklistTags.length} checked</span>
                            <span>Target: 100% Alignment</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Checklist Interactive Items */}
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {tags
                        .filter((t) => t.groupName === "oper_checklist")
                        .map((tag) => {
                          const currentTagIds = selectedItem.data.tagIds || [];
                          const isChecked = currentTagIds.includes(tag.id);
                          return (
                            <label 
                              key={tag.id}
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                                isChecked 
                                  ? "bg-emerald-50/20 border-emerald-250 text-slate-800 font-bold" 
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const newTagIds = isChecked
                                      ? currentTagIds.filter((id: string) => id !== tag.id)
                                      : [...currentTagIds, tag.id];
                                    
                                    const updated = {
                                      ...selectedItem.data,
                                      tagIds: newTagIds
                                    };

                                    // Update States
                                    if (selectedItem.dataType === "contact") {
                                      setContacts((prev) => prev.map((c) => c.id === updated.id ? updated : c));
                                    } else if (selectedItem.dataType === "entity") {
                                      setEntities((prev) => prev.map((e) => e.id === updated.id ? updated : e));
                                    } else if (selectedItem.dataType === "engagement") {
                                      setEngagements((prev) => prev.map((eg) => eg.id === updated.id ? updated : eg));
                                    }

                                    setSelectedItem({ ...selectedItem, data: updated });
                                    showToast(
                                      isChecked 
                                        ? `Procedure unchecked: ${tag.name}` 
                                        : `Procedure approved: ${tag.name}`, 
                                      "info"
                                    );

                                    const endpointMap: Record<string, string> = {
                                      contact: "contacts",
                                      entity: "entities",
                                      engagement: "engagements"
                                    };
                                    syncToServer(`/api/${endpointMap[selectedItem.dataType]}/${updated.id}`, "PUT", updated);
                                  }}
                                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                />
                                <span className="font-medium">{tag.name}</span>
                              </div>
                              <span className={`text-[8px] uppercase font-mono px-1.5 py-0.5 rounded border ${getColorClasses(tag.color)}`}>
                                SOP Badge
                              </span>
                            </label>
                          );
                        })}
                      {tags.filter((t) => t.groupName === "oper_checklist").length === 0 && (
                        <p className="text-[10px] text-slate-400 italic text-center py-2">No operational procedure checklist items found.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* DYNAMIC ATTRIBUTES CONNECTOR / LINK MATRIX */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 text-[11px] tracking-tight uppercase mb-4 flex items-center gap-1.5">
                    <Link className="w-4 h-4 text-blue-600" /> Linked Ecosystem Matrix
                  </h4>

                  {/* Tabs toggle */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-500 uppercase mb-4">
                    <button
                      type="button"
                      onClick={() => setDrawerTab("tags")}
                      className={`flex-1 py-1 px-2 rounded-md transition ${drawerTab === "tags" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-800"}`}
                    >
                      Tags ({linkedTags.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerTab("notes")}
                      className={`flex-1 py-1 px-2 rounded-md transition ${drawerTab === "notes" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-800"}`}
                    >
                      Notes ({linkedNotes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerTab("docs")}
                      className={`flex-1 py-1 px-2 rounded-md transition ${drawerTab === "docs" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-800"}`}
                    >
                      Docs ({linkedDocs.length})
                    </button>
                    {selectedItem?.dataType === "interaction" && (
                      <button
                        type="button"
                        onClick={() => setDrawerTab("contacts")}
                        className={`flex-1 py-1 px-2 rounded-md transition ${drawerTab === "contacts" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-800"}`}
                      >
                        Contacts
                      </button>
                    )}
                  </div>

                  {/* TAB 1: TAG CONNECTIVITY */}
                  {drawerTab === "tags" && (
                    <div className="space-y-4">
                      {!["interaction", "contact", "entity", "engagement"].includes(selectedItem.dataType) ? (
                        <p className="text-[11px] text-slate-400 italic">Global search matches tag associations within interactions and corresponding files indices.</p>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                            {linkedTags.length === 0 ? <span className="text-[11px] text-slate-400 italic">No assigned tags</span> : (
                              linkedTags.map((t) => (
                                <span key={t.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getColorClasses(t.color)}`}>
                                  #{t.name}
                                  <button type="button" onClick={() => handleUnlinkTag(t.id)} className="text-[10px] text-slate-400 hover:text-slate-700 font-bold ml-1">×</button>
                                </span>
                              ))
                            )}
                          </div>

                          <div className="flex gap-1.5 pt-1">
                            <select
                              value={selectedTagToLink}
                              onChange={(e) => setSelectedTagToLink(e.target.value)}
                              className="flex-1 bg-slate-50 border p-2 rounded-lg text-xs"
                            >
                              <option value="">-- Assign Tag --</option>
                              {availableUnlinkedTags.map((t) => <option key={t.id} value={t.id}>#{t.name}</option>)}
                            </select>
                            <button type="button" onClick={handleLinkTag} className="px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold">Link</button>
                          </div>

                          {/* Create dynamic tag in place */}
                          <div className="flex gap-1.5 pt-1 border-t border-slate-100 mt-2">
                            <input type="text" placeholder="New tag name..." value={newTagName} onChange={(e) => setNewTagName(e.target.value)} className="flex-1 bg-slate-50 border p-2 rounded-lg text-xs" />
                            <select value={newTagColor} onChange={(e) => setNewTagColor(e.target.value as any)} className="bg-slate-50 border p-2 rounded-lg text-xs font-semibold text-slate-700">
                              <option value="blue">Blue</option>
                              <option value="red">Red</option>
                              <option value="emerald">Green</option>
                              <option value="amber">Yellow</option>
                              <option value="purple">Purple</option>
                            </select>
                            <button type="button" onClick={handleCreateAndLinkTag} className="px-3 bg-blue-600 text-white rounded-lg font-bold">Add</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: RICH MEMO NOTES LOGGING */}
                  {drawerTab === "notes" && (
                    <div className="space-y-4">
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {linkedNotes.length === 0 ? <p className="text-[11px] text-slate-400 italic">No notes linked</p> : (
                          linkedNotes.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 rounded-lg relative group leading-relaxed text-[11px] border transition ${
                                n.pinned
                                  ? "bg-indigo-50/40 border-indigo-200"
                                  : "bg-slate-50 border-slate-150"
                              }`}
                            >
                              <div className="absolute top-1 right-1 flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePinNote(n.id)}
                                  className={`p-0.5 rounded transition cursor-pointer ${
                                    n.pinned
                                      ? "text-indigo-600"
                                      : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600"
                                  }`}
                                  title={n.pinned ? "Unpin Note" : "Pin Note"}
                                >
                                  {n.pinned ? (
                                    <Pin className="w-3.5 h-3.5 fill-indigo-600" />
                                  ) : (
                                    <Pin className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(n.id)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {n.Subject && (
                                <div className="font-bold text-slate-900 border-b border-slate-100 pb-0.5 mb-1 font-sans text-[11px]">
                                  {n.Subject}
                                </div>
                              )}
                              <p className="text-slate-800 pr-8">{n.content}</p>
                              <div className="mt-1 flex justify-between items-center text-[9px] text-slate-400 font-mono font-semibold">
                                <div className="flex items-center gap-1">
                                  <span>{n.author}</span>
                                  <span className="text-slate-300">•</span>
                                  <select
                                    value={n.visibility || "Public"}
                                    disabled={!isOwner(n) && session?.role !== "Senior Analyst"}
                                    onChange={(e) => handleChangeNoteVisibility(n.id, e.target.value as any)}
                                    className={`bg-transparent border-0 p-0 text-[9px] font-semibold text-slate-500 cursor-pointer focus:ring-0 focus:text-indigo-600 outline-none ${(!isOwner(n) && session?.role !== "Senior Analyst") ? "opacity-75 cursor-not-allowed text-slate-400" : ""}`}
                                    title="Edit Note Visibility"
                                  >
                                    <option value="Public">🌍 Public</option>
                                    <option value="Team">👥 Team</option>
                                    {(isOwner(n) || (n.visibility === "Private")) && (
                                      <option value="Private">🔒 Private</option>
                                    )}
                                  </select>
                                </div>
                                <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="Note Subject (Required *)..."
                          value={newNoteSubject}
                          onChange={(e) => setNewNoteSubject(e.target.value)}
                          className="w-full bg-slate-50 border p-2 rounded-lg text-xs outline-none focus:bg-white font-semibold"
                        />
                        <textarea
                          placeholder="Type an operational workspace note..."
                          rows={2}
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          className="w-full bg-slate-50 border p-2 rounded-lg text-xs outline-none focus:bg-white resize-none"
                        />
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] text-slate-500 font-semibold font-mono">Visibility:</label>
                            <select
                              value={newNoteVisibility}
                              onChange={(e) => setNewNoteVisibility(e.target.value as any)}
                              className="bg-white border rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 outline-none focus:border-indigo-500"
                            >
                              <option value="Public">🌍 Public</option>
                              <option value="Team">👥 Team</option>
                              <option value="Private">🔒 Private</option>
                            </select>
                          </div>
                          <button type="button" onClick={handleAddNote} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-[11px] cursor-pointer">Save Note</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DOCUMENT UPLOAD AND ATTACHMENTS */}
                  {drawerTab === "docs" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {linkedDocs.length === 0 ? <p className="text-[11px] text-slate-400 italic">No attached documents.</p> : (
                          linkedDocs.map((d) => (
                            <div key={d.id} className="flex flex-col p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-[11px] space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="font-semibold text-slate-800 truncate" title={d.title}>{d.title}</span>
                                  <span className="text-[9px] font-mono text-slate-400">({d.fileType})</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <span className="text-[9.5px] text-slate-400 font-mono">{d.fileSize}</span>
                                  <button type="button" onClick={() => handleDeleteDocument(d.id)} className="text-slate-400 hover:text-rose-600 cursor-pointer">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="text-[9px] text-slate-400 uppercase font-mono mr-1">Classification:</span>
                                {((d.tagIds || []) as string[]).map((tid) => {
                                  const tg = tags.find((t) => t.id === tid);
                                  if (!tg) return null;
                                  return (
                                    <span key={tid} className="text-[9.5px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                                      {tg.name}
                                      <button type="button" onClick={() => {
                                        const updatedTagIds = (d.tagIds || []).filter((id) => id !== tid);
                                        const updatedDoc = { ...d, tagIds: updatedTagIds };
                                        setDocuments((prev) => prev.map((item) => item.id === d.id ? updatedDoc : item));
                                        syncToServer(`/api/documents/${d.id}`, "PUT", updatedDoc);
                                        showToast("Category tag unbound.", "info");
                                      }} className="text-indigo-400 hover:text-rose-600 font-extrabold ml-0.5">×</button>
                                    </span>
                                  );
                                })}
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (!e.target.value) return;
                                    const currentTags = d.tagIds || [];
                                    if (currentTags.includes(e.target.value)) return;
                                    const updatedTagIds = [...currentTags, e.target.value];
                                    const updatedDoc = { ...d, tagIds: updatedTagIds };
                                    setDocuments((prev) => prev.map((item) => item.id === d.id ? updatedDoc : item));
                                    syncToServer(`/api/documents/${d.id}`, "PUT", updatedDoc);
                                    showToast("Category tag added.", "success");
                                  }}
                                  className="text-[9px] bg-white border border-slate-200 rounded px-1 py-0.5 max-w-[100px] text-slate-500 outline-none"
                                >
                                  <option value="">+ Tag</option>
                                  {tags.filter((t) => t.groupName === "doc_type" && !(d.tagIds || []).includes(t.id)).map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t border-slate-100 mt-1.5 text-[9px] text-slate-400 font-mono">
                                <span>Author: {d.author || "System"}</span>
                                <div className="flex items-center gap-1">
                                  <span>Visibility:</span>
                                  <select
                                    value={d.visibility || "Public"}
                                    disabled={!isOwner(d) && session?.role !== "Senior Analyst"}
                                    onChange={(e) => handleChangeDocVisibility(d.id, e.target.value as any)}
                                    className={`bg-transparent border-0 p-0 text-[9px] font-semibold text-slate-500 cursor-pointer focus:ring-0 focus:text-indigo-600 outline-none ${(!isOwner(d) && session?.role !== "Senior Analyst") ? "opacity-75 cursor-not-allowed text-slate-400" : ""}`}
                                    title="Edit Document Visibility"
                                  >
                                    <option value="Public">🌍 Public</option>
                                    <option value="Team">👥 Team</option>
                                    {(isOwner(d) || (d.visibility === "Private")) && (
                                      <option value="Private">🔒 Private</option>
                                    )}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex gap-1.5">
                          <input type="text" placeholder="filename (e.g. alignment_NDA)" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} className="flex-1 bg-slate-50 border p-2 rounded-lg text-xs" />
                          <select
                            value={newDocType}
                            onChange={(e) => setNewDocType(e.target.value as any)}
                            className="bg-slate-50 border p-2 rounded-lg text-xs font-semibold text-slate-700"
                          >
                            <option value="PDF">PDF</option>
                            <option value="Spreadsheet">XLSX</option>
                            <option value="Contract">Contract</option>
                            <option value="Presentation">PPTX</option>
                            <option value="Briefing">Doc</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wide mb-1">Select Classification Tags</label>
                          <GroupedTagsInput
                            groupName="doc_type"
                            value={newDocTags}
                            onChange={(val) => setNewDocTags(val)}
                            tags={tags}
                            syncToServer={syncToServer}
                            loadSQLiteState={loadSQLiteState}
                            showToast={showToast}
                            placeholder="Select metadata tags..."
                          />
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <input type="text" placeholder="Size (e.g. 1.2 MB)" value={newDocSize} onChange={(e) => setNewDocSize(e.target.value)} className="w-[80px] bg-slate-50 border p-2 rounded-lg text-xs" />
                          <select
                            value={newDocVisibility}
                            onChange={(e) => setNewDocVisibility(e.target.value as any)}
                            className="bg-slate-50 border p-2 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:bg-white"
                          >
                            <option value="Public">🌍 Public</option>
                            <option value="Team">👥 Team</option>
                            <option value="Private">🔒 Private</option>
                          </select>
                          <button type="button" onClick={handleAddDocument} className="flex-1 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold font-sans text-xs text-center">Attach File</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: INTERACTION CONTACT ROLES (int_cont_role) */}
                  {drawerTab === "contacts" && selectedItem?.dataType === "interaction" && (
                    <div className="space-y-4 animate-in fade-in">
                      <p className="text-[11px] text-slate-400 italic">
                        Assign specific corporate contacts reference roles during this interaction event. Role options are managed in the Tag Groups Directory.
                      </p>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {(() => {
                          const associatedContacts = contacts.filter(
                            (c) => c.company && c.company === selectedItem.data.client
                          );
                          const otherContacts = contacts.filter(
                            (c) => !c.company || c.company !== selectedItem.data.client
                          );
                          const roleTags = tags.filter((t) => t.groupName === "int_cont_role");

                          return (
                            <div className="space-y-4">
                              {associatedContacts.length > 0 && (
                                <div>
                                  <h5 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                                    {selectedItem.data.client} Stakeholders
                                  </h5>
                                  <div className="space-y-2">
                                    {associatedContacts.map((c) => {
                                      const currentRole = selectedItem.data.contactRoles?.[c.id] || "";
                                      return (
                                        <div key={c.id} className="flex justify-between items-center bg-slate-50 border p-2 rounded-lg text-xs hover:bg-slate-100/50 transition">
                                          <div>
                                            <p className="font-bold text-slate-800">{c.name}</p>
                                            <p className="text-[10px] text-slate-400">{c.role || "No corporate role"}</p>
                                          </div>
                                          <div>
                                            <select
                                              value={currentRole}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                const updatedRoles = { ...(selectedItem.data.contactRoles || {}) };
                                                if (val) {
                                                  updatedRoles[c.id] = val;
                                                } else {
                                                  delete updatedRoles[c.id];
                                                }
                                                setSelectedItem({
                                                  ...selectedItem,
                                                  data: { ...selectedItem.data, contactRoles: updatedRoles }
                                                });
                                              }}
                                              className="bg-white border rounded p-1 text-xs font-semibold text-slate-700 max-w-[150px] outline-none"
                                            >
                                              <option value="">-- Assign Role --</option>
                                              {roleTags.map((tag) => (
                                                <option key={tag.id} value={tag.name}>
                                                  {tag.name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {otherContacts.length > 0 && (
                                <div className="pt-2 border-t border-slate-100">
                                  <h5 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                                    Other Stakeholders
                                  </h5>
                                  <div className="space-y-2">
                                    {otherContacts.map((c) => {
                                      const currentRole = selectedItem.data.contactRoles?.[c.id] || "";
                                      return (
                                        <div key={c.id} className="flex justify-between items-center bg-slate-50 border p-2 rounded-lg text-xs hover:bg-slate-50/80 transition">
                                          <div>
                                            <p className="font-bold text-slate-700">{c.name}</p>
                                            <span className="text-[9px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-semibold font-mono">{c.company || "Independent"}</span>
                                          </div>
                                          <div>
                                            <select
                                              value={currentRole}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                const updatedRoles = { ...(selectedItem.data.contactRoles || {}) };
                                                if (val) {
                                                  updatedRoles[c.id] = val;
                                                } else {
                                                  delete updatedRoles[c.id];
                                                }
                                                setSelectedItem({
                                                  ...selectedItem,
                                                  data: { ...selectedItem.data, contactRoles: updatedRoles }
                                                });
                                              }}
                                              className="bg-white border rounded p-1 text-xs font-semibold text-slate-700 max-w-[150px] outline-none"
                                            >
                                              <option value="">-- Assign Role --</option>
                                              {roleTags.map((tag) => (
                                                <option key={tag.id} value={tag.name}>
                                                  {tag.name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>

            {/* Footer with discard permanence details and final updates */}
            <div className="p-4 border-t border-slate-150 bg-slate-50 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleDeleteItem(selectedItem.dataType, selectedItem.data.id)}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg font-bold flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Permanent Discard
              </button>
              
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedItem(null)} className="px-3 py-2 hover:bg-slate-200 rounded-lg text-slate-500 font-bold">Cancel</button>
                <button type="button" onClick={() => handleUpdateItem(selectedItem.dataType, selectedItem.data)} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold shadow">Save Changes</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING BATCH ACTIONS TOOLBAR */}
      <AnimatePresence>
        {((activeTab === "interactions" && selectedInteractionIds.length > 0) ||
          (activeTab === "contacts" && selectedContactIds.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[95%] max-w-4xl p-4 bg-slate-950 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-850 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold font-mono">
                {activeTab === "interactions" ? selectedInteractionIds.length : selectedContactIds.length}
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white tracking-tight">
                  {activeTab === "interactions" ? "Batch Interaction Operations" : "Batch Contact Operations"}
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  {activeTab === "interactions"
                    ? `Specify actions to apply for ${selectedInteractionIds.length} selected sequence items`
                    : `Specify role/company adjustments or deletion for ${selectedContactIds.length} selected profiles`}
                </p>
              </div>
            </div>

            {/* Interactions Batch Panel Actions */}
            {activeTab === "interactions" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mr-1">Update Status:</span>
                {(["IN PROGRESS", "SCHEDULED", "COMPLETED", "BLOCKED", "CANCELED"] as any[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleBatchInteractionStatusUpdate(st)}
                    className="px-2 py-1 text-[10px] font-extrabold rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 hover:text-white transition"
                  >
                    {st}
                  </button>
                ))}
                
                <div className="w-px h-6 bg-slate-800 mx-1 hidden md:block" />

                <button
                  onClick={handleBatchInteractionDelete}
                  className="px-3 py-1.5 text-[10.5px] font-extrabold bg-red-950 text-red-400 hover:bg-red-900 hover:text-white rounded-lg border border-red-900/50 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}

            {/* Contacts Batch Panel Actions */}
            {activeTab === "contacts" && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Role Updater Form input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const rl = fd.get("new-role") as string;
                    if (rl) {
                      handleBatchContactRoleUpdate(rl);
                      e.currentTarget.reset();
                    }
                  }}
                  className="flex items-center bg-slate-900 border border-slate-850 rounded-lg p-1"
                >
                  <input
                    name="new-role"
                    type="text"
                    required
                    placeholder="New Role (e.g. CMO)"
                    className="bg-transparent px-2 py-0.5 text-[10.5px] outline-none text-white placeholder-slate-500 w-36 font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 text-[9.5px] font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans transition"
                  >
                    Set Role
                  </button>
                </form>

                {/* Company Updater Form input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const cmp = fd.get("new-company") as string;
                    if (cmp) {
                      handleBatchContactCompanyUpdate(cmp);
                      e.currentTarget.reset();
                    }
                  }}
                  className="flex items-center bg-slate-900 border border-slate-850 rounded-lg p-1"
                >
                  <input
                    name="new-company"
                    type="text"
                    required
                    placeholder="New Company"
                    className="bg-transparent px-2 py-0.5 text-[10.5px] outline-none text-white placeholder-slate-500 w-36 font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 text-[9.5px] font-extrabold bg-blue-600 hover:bg-blue-500 text-white rounded font-sans transition"
                  >
                    Set Org
                  </button>
                </form>

                <div className="w-px h-6 bg-slate-800 mx-1 hidden md:block" />

                <button
                  onClick={handleBatchContactDelete}
                  className="px-3 py-1.5 text-[10.5px] font-extrabold bg-red-950 text-red-400 hover:bg-red-900 hover:text-white rounded-lg border border-red-900/50 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 border-t md:border-t-0 border-slate-800 pt-2.5 md:pt-0 w-full md:w-auto justify-end shrink-0">
              <button
                onClick={() => {
                  setSelectedInteractionIds([]);
                  setSelectedContactIds([]);
                }}
                className="text-slate-400 hover:text-white text-[11px] font-semibold font-sans px-3 py-1.5"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYSTEM CONFIRM MODAL OVERLAY */}
      {confirmDialog && (
        <div id="custom-system-confirm" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4 animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                {confirmDialog.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                id="confirm-cancel"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white font-bold tracking-wide transition border border-transparent hover:border-slate-700"
              >
                Cancel
              </button>
              <button
                id="confirm-ok"
                onClick={() => {
                  try {
                    confirmDialog.onConfirm();
                  } catch (e) {
                    console.error("Error executing custom confirm callback:", e);
                  }
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold tracking-wide shadow-md transition"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
