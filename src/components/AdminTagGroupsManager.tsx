import React, { useState } from "react";
import { Tag, Plus, Trash2, AlertCircle, Sparkles } from "lucide-react";

interface CustomTag {
  id: string;
  name: string;
  color: "blue" | "red" | "emerald" | "amber" | "purple" | "indigo";
  groupName?: string;
}

interface AdminTagGroupsManagerProps {
  tags: CustomTag[];
  syncToServer: (url: string, method: string, body?: any) => Promise<void>;
  loadSQLiteState: () => Promise<void>;
  showToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

const FIXED_GROUPS = [
  { id: "eng_type", label: "Engagement Types", field: "engagement.type", desc: "Agreement types for advisory contract models" },
  { id: "eng_status", label: "Engagement Statuses", field: "engagement.status", desc: "Allowed states for SOW and campaign tracks" },
  { id: "int_type", label: "Interaction Types", field: "interaction.type", desc: "Action logs and communication sync profiles" },
  { id: "contact_role", label: "Contact Roles", field: "contact.role", desc: "Corporate positions for executive contact cards" },
  { id: "company_industry", label: "Entity Industries", field: "company.industry", desc: "Primary focus sectors representing corporations" },
  { id: "company_tier", label: "Entity Tiers", field: "company.relationship", desc: "Internal tier status groupings for accounts" },
  { id: "int_cont_role", label: "Interaction Contact Roles", field: "interaction.contact_role", desc: "Roles played by contacts in a specific interaction context" },
  { id: "doc_type", label: "Document Types", field: "document.fileType", desc: "Custom tag categories for corporate assets and uploads" },
  { id: "int_status", label: "Interaction Statuses", field: "interaction.status", desc: "Single tag status mapping for advisory Touchpoints" },
  { id: "oper_checklist", label: "Operational Checklist Items", field: "tags.oper_checklist", desc: "Operational standard procedures items tracked via tag associations" }
];

export const AdminTagGroupsManager: React.FC<AdminTagGroupsManagerProps> = ({
  tags,
  syncToServer,
  loadSQLiteState,
  showToast
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("eng_type");
  const [newTagName, setNewTagName] = useState<string>("");
  const [newTagColor, setNewTagColor] = useState<CustomTag["color"]>("blue");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter tags to only show those belonging to the currently selected group name
  const filteredTags = tags.filter((t) => t.groupName === selectedGroup);

  const activeGroupInfo = FIXED_GROUPS.find((g) => g.id === selectedGroup);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    const trimmedName = newTagName.trim();
    
    // Check for duplicates within this group
    const isDup = filteredTags.some((t) => t.name.toLowerCase() === trimmedName.toLowerCase());
    if (isDup) {
      showToast(`A tag named "${trimmedName}" already exists in this group.`, "warning");
      return;
    }

    setIsSubmitting(true);
    const newTagId = `gt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTag: CustomTag = {
      id: newTagId,
      name: trimmedName,
      color: newTagColor,
      groupName: selectedGroup
    };

    try {
      await syncToServer("/api/tags", "POST", newTag);
      await loadSQLiteState();
      setNewTagName("");
      showToast(`Successfully added "${trimmedName}" as a grouped tag!`, "success");
    } catch (err) {
      showToast("Could not save the new tag.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the tag "${tagName}"?`)) {
      return;
    }

    try {
      await syncToServer(`/api/tags/${tagId}`, "DELETE");
      await loadSQLiteState();
      showToast(`Removed tag "${tagName}" successfully.`, "success");
    } catch (err) {
      showToast("Failed to delete the selected tag.", "error");
    }
  };

  const colorClasses: Record<CustomTag["color"], string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    red: "bg-red-50 border-red-200 text-red-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700"
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-sky-500" /> Administrative Tag Groups Maintainer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure system lists, maintain fixed corporate categories, and customize allowed dropdown choices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Group Selector */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
              Fixed Categorization Groups
            </h3>
            <div className="space-y-2">
              {FIXED_GROUPS.map((group) => {
                const isActive = selectedGroup === group.id;
                const count = tags.filter((t) => t.groupName === group.id).length;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroup(group.id);
                      setNewTagName("");
                    }}
                    className={`w-full text-left p-3.5 rounded-lg border text-xs transition duration-150 cursor-pointer flex flex-col gap-1.5 ${
                      isActive
                        ? "bg-slate-900 border-slate-800 text-white shadow-sm"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold">{group.label}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold ${
                          isActive ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count} tags
                      </span>
                    </div>
                    <span className={`text-[10px] leading-relaxed block ${isActive ? "text-slate-400" : "text-slate-400"}`}>
                      {group.desc}
                    </span>
                    <span className="font-mono text-[9px] text-sky-500">{group.field}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Tags list + Form */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Active Options for <span className="text-sky-600">{activeGroupInfo?.label}</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  Group ID: <span className="font-bold text-slate-600">{activeGroupInfo?.id}</span> • Linked Property: <span className="font-bold text-slate-600">{activeGroupInfo?.field}</span>
                </span>
              </div>
            </div>

            {/* List of current tags */}
            {filteredTags.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300" />
                <h4 className="font-bold text-slate-700 text-xs">No options defined</h4>
                <p className="text-[10px] text-slate-400 max-w-xs">
                  This tag group currently has zero active items. Add some below to populate dropdown selections.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-200 transition"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${tag.color === "red" ? "bg-red-500" : tag.color === "emerald" ? "bg-emerald-500" : tag.color === "amber" ? "bg-amber-500" : tag.color === "purple" ? "bg-purple-500" : tag.color === "indigo" ? "bg-indigo-500" : "bg-blue-500"}`} />
                      <span className="font-bold text-slate-800 text-xs truncate" title={tag.name}>
                        {tag.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTag(tag.id, tag.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                      title="Permanently remove option"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new option form */}
            <form onSubmit={handleAddTag} className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" /> Append New Grouped Option
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Option / Tag Label
                  </label>
                  <input
                    type="text"
                    required
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="e.g. Audit Support, Tier 4"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Visual Accent Color
                  </label>
                  <div className="flex items-center gap-2 h-9">
                    {(["blue", "red", "emerald", "amber", "purple", "indigo"] as const).map((color) => {
                      const isActive = newTagColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewTagColor(color)}
                          className={`w-6 h-6 rounded-full transition duration-150 border cursor-pointer relative flex items-center justify-center ${
                            color === "red"
                              ? "bg-red-500 border-red-600"
                              : color === "emerald"
                              ? "bg-emerald-500 border-emerald-600"
                              : color === "amber"
                              ? "bg-amber-500 border-amber-600"
                              : color === "purple"
                              ? "bg-purple-500 border-purple-600"
                              : color === "indigo"
                              ? "bg-indigo-500 border-indigo-600"
                              : "bg-blue-500 border-blue-600"
                          } ${isActive ? "ring-2 ring-offset-2 ring-slate-800 scale-110" : "opacity-80 hover:opacity-100"}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newTagName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Synchronize Option
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
