import { CustomTag, Note, Document, Interaction, Contact, Entity, Engagement } from "./types";

export const SEED_TAGS: CustomTag[] = [
  { id: "tag-1", name: "High Priority", color: "red" },
  { id: "tag-2", name: "Follow Up", color: "amber" },
  { id: "tag-3", name: "Technical Audit", color: "blue" },
  { id: "tag-4", name: "Onboarding", color: "emerald" },
  { id: "tag-5", name: "Monthly QBR", color: "purple" },
  { id: "checklist-nda", name: "NDA Signed", color: "blue", groupName: "oper_checklist" },
  { id: "checklist-kyc", name: "KYC Verified", color: "emerald", groupName: "oper_checklist" },
  { id: "checklist-onboard", name: "Onboarding Sequence", color: "purple", groupName: "oper_checklist" },
  { id: "checklist-sec", name: "Security Audit Checked", color: "red", groupName: "oper_checklist" },
  { id: "checklist-proposal", name: "Proposal Tendered", color: "indigo", groupName: "oper_checklist" }
];

export const SEED_NOTES: Note[] = [];

export const SEED_DOCUMENTS: Document[] = [];

export const SEED_INTERACTIONS: Interaction[] = [];

export const SEED_CONTACTS: Contact[] = [];

export const SEED_ENTITIES: Entity[] = [];

export const SEED_ENGAGEMENTS: Engagement[] = [];

export const ASSIGNEES = ["Sarah K.", "Michael R.", "David J.", "Samantha L."];

export function getThemeClasses(themeKey: string) {
  switch (themeKey) {
    case "pitch-dark":
      return {
        bg: "bg-slate-950 text-slate-100",
        card: "bg-slate-900 border-slate-800 text-slate-100 shadow-md",
        cardHover: "hover:border-slate-700",
        textDefault: "text-slate-200",
        textMuted: "text-slate-400 font-mono",
        textTitle: "text-white font-semibold",
        border: "border-slate-800",
        header: "bg-slate-900 border-slate-800 text-white",
        input: "bg-slate-950 border-slate-800 text-white focus:border-indigo-500 placeholder-slate-600",
        buttonSec: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-705 cursor-pointer",
        badge: "bg-slate-850 border-slate-705 text-slate-300",
        mutedBg: "bg-slate-950/80 border border-slate-800"
      };
    case "amber-sepia":
      return {
        bg: "bg-amber-50/40 text-slate-900",
        card: "bg-[#fcfaf2] border-amber-200/90 text-slate-900 shadow-sm",
        cardHover: "hover:border-amber-300",
        textDefault: "text-slate-800",
        textMuted: "text-amber-800/80 font-mono",
        textTitle: "text-amber-950 font-bold",
        border: "border-amber-200",
        header: "bg-white border-amber-200/80 text-amber-900",
        input: "bg-[#fbf9f3] border-amber-200 text-slate-900 focus:border-amber-600 placeholder-amber-700/40",
        buttonSec: "bg-amber-100/50 hover:bg-amber-100 text-amber-900 border border-amber-200 cursor-pointer",
        badge: "bg-amber-50 border-amber-150 text-amber-800",
        mutedBg: "bg-amber-50/50 border border-amber-200/50"
      };
    case "charcoal":
      return {
        bg: "bg-zinc-100 text-zinc-900",
        card: "bg-zinc-50 border-zinc-200 text-zinc-900 shadow-sm",
        cardHover: "hover:border-zinc-350",
        textDefault: "text-zinc-800",
        textMuted: "text-zinc-500 font-mono",
        textTitle: "text-zinc-950 font-bold",
        border: "border-zinc-200",
        header: "bg-white border-zinc-200 text-zinc-900",
        input: "bg-zinc-100/60 border-zinc-200 text-zinc-900 focus:border-zinc-500 placeholder-zinc-400",
        buttonSec: "bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border border-zinc-303 cursor-pointer",
        badge: "bg-zinc-100 border-zinc-200 text-zinc-700",
        mutedBg: "bg-zinc-100/40 border border-zinc-200/60"
      };
    case "slate":
    default:
      return {
        bg: "bg-slate-50 text-slate-800",
        card: "bg-white border-slate-200 text-slate-800 shadow-sm",
        cardHover: "hover:border-slate-350",
        textDefault: "text-slate-800",
        textMuted: "text-slate-400 font-mono",
        textTitle: "text-slate-900 font-semibold",
        border: "border-slate-200",
        header: "bg-white border-slate-200 text-slate-800",
        input: "bg-slate-100 border-transparent text-slate-800 focus:bg-white focus:border-blue-500 placeholder-slate-400",
        buttonSec: "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-705 cursor-pointer",
        badge: "bg-slate-100 border-slate-200 text-slate-700",
        mutedBg: "bg-slate-50 border border-slate-200"
      };
  }
}

export function getDensityPadding(density: string, type: "card" | "input" | "table-cell" | "list-spacing") {
  if (type === "card") {
    return density === "compact" ? "p-3.5" : density === "spacious" ? "p-7" : "p-5";
  }
  if (type === "input") {
    return density === "compact" ? "py-1.5 px-2.5 text-[11px]" : density === "spacious" ? "py-3 pb-3 px-4 text-sm" : "py-2.5 px-3 text-xs";
  }
  if (type === "table-cell") {
    return density === "compact" ? "py-1.5 px-2.5 text-[10px]" : density === "spacious" ? "py-4 px-5 text-sm" : "py-2.5 px-3 text-xs";
  }
  return density === "compact" ? "space-y-2" : density === "spacious" ? "space-y-5" : "space-y-4";
}
