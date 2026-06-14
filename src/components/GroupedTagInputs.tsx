import React, { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Check, Plus, Tag } from "lucide-react";

interface CustomTag {
  id: string;
  name: string;
  color: "blue" | "red" | "emerald" | "amber" | "purple" | "indigo";
  groupName?: string;
}

interface GroupedTagDropdownProps {
  groupName: string;
  value: string;
  onChange: (val: string) => void;
  tags: CustomTag[];
  syncToServer: (url: string, method: string, body?: any) => Promise<void>;
  loadSQLiteState: () => Promise<void>;
  showToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const GroupedTagDropdown: React.FC<GroupedTagDropdownProps> = ({
  groupName,
  value,
  onChange,
  tags,
  syncToServer,
  loadSQLiteState,
  showToast,
  placeholder = "-- Select or type option --",
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter tags in this group
  const groupTags = tags.filter((t) => t.groupName === groupName);
  const filtered = groupTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const colors: Record<CustomTag["color"], string> = {
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-800",
    emerald: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    purple: "bg-purple-100 text-purple-800",
    indigo: "bg-indigo-100 text-indigo-800"
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (tagVal: string) => {
    onChange(tagVal);
    setIsOpen(false);
    setSearch("");
  };

  const handleCreateNew = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;

    // Check if duplicate
    const exists = groupTags.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      handleSelect(exists.name);
      return;
    }

    const availableColors: CustomTag["color"][] = ["blue", "indigo", "purple", "emerald", "amber", "red"];
    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    const newId = `gt-${Date.now()}`;
    const newTag: CustomTag = {
      id: newId,
      name: trimmed,
      color: randomColor,
      groupName
    };

    try {
      await syncToServer("/api/tags", "POST", newTag);
      await loadSQLiteState();
      onChange(trimmed);
      setIsOpen(false);
      setSearch("");
      showToast(`Added option "${trimmed}" to list!`, "success");
    } catch (err) {
      showToast("Could not register tag.", "error");
    }
  };

  const selectedTag = groupTags.find((t) => t.name === value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-2.5 rounded-lg text-xs outline-none flex justify-between items-center cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedTag ? (
            <span className={`px-2 py-0.5 rounded font-bold ${colors[selectedTag.color]}`}>
              {selectedTag.name}
            </span>
          ) : value ? (
            <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
              {value}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[999] top-full mt-1.5 left-0 right-0 max-h-60 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-xl p-2 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to filter or add option..."
            className="w-full bg-slate-50 border border-slate-100 p-2 rounded-lg text-xs outline-none focus:bg-white focus:border-slate-200"
            onClick={(e) => e.stopPropagation()}
            required={required && !value}
          />

          <div className="space-y-1">
            {filtered.map((tag) => (
              <div
                key={tag.id}
                onClick={() => handleSelect(tag.name)}
                className="flex justify-between items-center px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-50 cursor-pointer text-slate-800"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${tag.color === "red" ? "bg-red-500" : tag.color === "emerald" ? "bg-emerald-500" : tag.color === "amber" ? "bg-amber-500" : tag.color === "purple" ? "bg-purple-500" : tag.color === "indigo" ? "bg-indigo-500" : "bg-blue-500"}`} />
                  <span className="font-semibold">{tag.name}</span>
                </div>
                {value === tag.name && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </div>
            ))}

            {filtered.length === 0 && search.trim().length > 0 && (
              <div
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-lg text-xs text-indigo-600 hover:bg-indigo-50 cursor-pointer font-bold border border-dashed border-indigo-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Create option "{search.trim()}"
              </div>
            )}

            {filtered.length === 0 && !search.trim() && (
              <div className="p-3 text-slate-400 italic text-[11px] text-center">
                Type above to suggest/create new
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// MULTI TAG SELECTOR (Like toptal gitignore)
interface GroupedTagsInputProps {
  groupName: string;
  value: string; // comma-separated strings
  onChange: (val: string) => void;
  tags: CustomTag[];
  syncToServer: (url: string, method: string, body?: any) => Promise<void>;
  loadSQLiteState: () => Promise<void>;
  showToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
  placeholder?: string;
}

export const GroupedTagsInput: React.FC<GroupedTagsInputProps> = ({
  groupName,
  value,
  onChange,
  tags,
  syncToServer,
  loadSQLiteState,
  showToast,
  placeholder = "Type contract tags..."
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Current selected tag tokens
  const selectedTokens = value
    ? value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const groupTags = tags.filter((t) => t.groupName === groupName);

  // Suggestions that are NOT already selected
  const availableSuggestions = groupTags.filter(
    (tag) => !selectedTokens.some((tok) => tok.toLowerCase() === tag.name.toLowerCase())
  );

  const filteredSuggestions = availableSuggestions.filter((tag) =>
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerAddToken = async (tokenName: string) => {
    const trimmed = tokenName.trim();
    if (!trimmed) return;

    // Check if already selected
    if (selectedTokens.some((tok) => tok.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue("");
      return;
    }

    // See if tag exists in Sqlite
    const tagExistsInDB = groupTags.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (!tagExistsInDB) {
      // Create new tag in SQLite
      const availableColors: CustomTag["color"][] = ["blue", "indigo", "purple", "emerald", "amber", "red"];
      const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
      const newId = `gt-${Date.now()}`;
      const newTag: CustomTag = {
        id: newId,
        name: trimmed,
        color: randomColor,
        groupName
      };

      try {
        await syncToServer("/api/tags", "POST", newTag);
        await loadSQLiteState();
        showToast(`Created tag "${trimmed}" under group "${groupName}"`, "success");
      } catch (err) {
        showToast("Error creating grouped tag", "error");
      }
    }

    const updated = [...selectedTokens, trimmed].join(", ");
    onChange(updated);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      triggerAddToken(inputValue);
    } else if (e.key === "Backspace" && !inputValue && selectedTokens.length > 0) {
      // Remove last token
      const updated = selectedTokens.slice(0, -1).join(", ");
      onChange(updated);
    }
  };

  const handleRemoveToken = (tokenToRemove: string) => {
    const updated = selectedTokens
      .filter((tok) => tok.toLowerCase() !== tokenToRemove.toLowerCase())
      .join(", ");
    onChange(updated);
  };

  const colors: Record<CustomTag["color"], string> = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    red: "bg-red-100 text-red-800 border-red-200",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-200"
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box */}
      <div
        className={`w-full bg-slate-50 border rounded-lg p-2 flex flex-wrap gap-1.5 items-center transition min-h-11 ${
          isFocused ? "border-slate-400 bg-white shadow-sm ring-1 ring-slate-400" : "border-slate-200"
        }`}
        onClick={() => setIsFocused(true)}
      >
        {selectedTokens.map((token) => {
          // Find matching tag color if any
          const matchingTag = groupTags.find(
            (t) => t.name.toLowerCase() === token.toLowerCase()
          );
          const badgeClass = matchingTag ? colors[matchingTag.color] : "bg-slate-100 text-slate-800 border-slate-200";

          return (
            <span
              key={token}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold border ${badgeClass}`}
            >
              <Tag className="w-3 h-3 opacity-60" />
              {token}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveToken(token);
                }}
                className="hover:bg-black/10 rounded p-0.5 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          );
        })}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          placeholder={selectedTokens.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-xs outline-none py-1 text-slate-800"
        />
      </div>

      {/* Suggestion Dropdown popup */}
      {isFocused && (inputValue.trim() || filteredSuggestions.length > 0) && (
        <div className="absolute z-[999] top-full mt-1.5 left-0 right-0 max-h-48 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-xl p-1.5">
          <div className="space-y-0.5">
            {filteredSuggestions.map((tag) => (
              <div
                key={tag.id}
                onClick={() => triggerAddToken(tag.name)}
                className="flex items-center gap-2 px-2.5 py-2.5 rounded-lg text-xs hover:bg-slate-50 cursor-pointer font-semibold text-slate-700"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${tag.color === "red" ? "bg-red-500" : tag.color === "emerald" ? "bg-emerald-500" : tag.color === "amber" ? "bg-amber-500" : tag.color === "purple" ? "bg-purple-500" : tag.color === "indigo" ? "bg-indigo-500" : "bg-blue-500"}`} />
                <span>{tag.name}</span>
              </div>
            ))}

            {inputValue.trim() &&
              !groupTags.some((t) => t.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
                <div
                  onClick={() => triggerAddToken(inputValue)}
                  className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-lg text-xs text-indigo-600 hover:bg-indigo-50 cursor-pointer font-bold border border-dashed border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" /> Use "{inputValue.trim()}" (Adds to database)
                </div>
              )}

            {filteredSuggestions.length === 0 && !inputValue.trim() && (
              <div className="p-3 text-slate-400 italic text-[10px] text-center">
                Type above to suggest tags
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
