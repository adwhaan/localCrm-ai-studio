import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X, Check } from "lucide-react";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  onClear: () => void;
}

export function DateRangePicker({ startDate, endDate, onChange, onClear }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Navigate calendar month inside picker
  const [navDate, setNavDate] = useState(() => {
    if (startDate) return new Date(startDate);
    return new Date();
  });

  // Keep track of the month/year we are viewing
  const year = navDate.getFullYear();
  const month = navDate.getMonth(); // 0-indexed

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Utility to format Date as YYYY-MM-DD in local time
  const formatDateStr = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Build Calendar Days
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0

  const days: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Add previous month filler days
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i);
    days.push({
      dayNum: prevMonthDays - i,
      dateStr: formatDateStr(d),
      isCurrentMonth: false,
    });
  }

  // Add current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({
      dayNum: i,
      dateStr: formatDateStr(d),
      isCurrentMonth: true,
    });
  }

  // Add next month filler days
  const remaining = 42 - days.length; // standard 6 rows
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      dayNum: i,
      dateStr: formatDateStr(d),
      isCurrentMonth: false,
    });
  }

  const handleDayClick = (dateStr: string) => {
    if (!startDate || (startDate && endDate)) {
      // First click: set start date, reset end date
      onChange(dateStr, "");
    } else {
      // Second click: we have startDate but no endDate
      if (dateStr < startDate) {
        // Clicked date is before start date, treat it as new start date
        onChange(dateStr, "");
      } else {
        onChange(startDate, dateStr);
        setIsOpen(false); // Auto close on complete range selection
      }
    }
  };

  // Helper values for background highlighting
  const isSelected = (dateStr: string) => dateStr === startDate || dateStr === endDate;
  const isInRange = (dateStr: string) => {
    if (!startDate || !endDate) return false;
    return dateStr > startDate && dateStr < endDate;
  };

  // Month navigator helpers
  const prevMonth = () => {
    setNavDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setNavDate(new Date(year, month + 1, 1));
  };

  // Quick Preset Handlers
  const setPreset = (preset: "today" | "last7" | "last30" | "next30" | "thisMonth") => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = new Date(today);
    let end = new Date(today);

    if (preset === "today") {
      start = today;
      end = today;
    } else if (preset === "last7") {
      start = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      end = today;
    } else if (preset === "last30") {
      start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      end = today;
    } else if (preset === "next30") {
      start = today;
      end = new Date(today.getTime() + 29 * 24 * 60 * 60 * 1000);
    } else if (preset === "thisMonth") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    onChange(formatDateStr(start), formatDateStr(end));
    setNavDate(new Date(start));
    setIsOpen(false);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getButtonLabel = () => {
    if (startDate && endDate) {
      return `${startDate} to ${endDate}`;
    } else if (startDate) {
      return `${startDate} ... selecting end date`;
    }
    return "Pick Temporal Range...";
  };

  return (
    <div className="relative" ref={containerRef} id="interaction-date-range-picker">
      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate grow">{getButtonLabel()}</span>
        {(startDate || endDate) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition"
            title="Clear Date Filters"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-[340px] space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Header Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              type="button"
              className="p-1 hover:bg-slate-100 rounded-lg transition text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold font-mono text-slate-800 uppercase tracking-wider">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              type="button"
              className="p-1 hover:bg-slate-100 rounded-lg transition text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 pb-2 border-b border-slate-100">
            {[
              { id: "today" as const, label: "Today" },
              { id: "last7" as const, label: "Last 7 Days" },
              { id: "last30" as const, label: "Last 30 Days" },
              { id: "next30" as const, label: "Next 30 Days" },
              { id: "thisMonth" as const, label: "This Month" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition text-center"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 text-center gap-0.5">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
              <div key={dayName} className="text-[9px] font-extrabold text-slate-400 font-mono py-1 uppercase">
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, idx) => {
              const selected = isSelected(day.dateStr);
              const activeRange = isInRange(day.dateStr);
              const isTodayDate = formatDateStr(new Date()) === day.dateStr;

              return (
                <button
                  key={`${day.dateStr}-${idx}`}
                  type="button"
                  onClick={() => handleDayClick(day.dateStr)}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all relative flex flex-col items-center justify-center ${
                    !day.isCurrentMonth ? "text-slate-300 pointer-events-none opacity-40" : ""
                  } ${
                    selected
                      ? "bg-indigo-600 text-white font-extrabold shadow-sm"
                      : activeRange
                      ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="relative z-10">{day.dayNum}</span>
                  {isTodayDate && !selected && (
                    <span className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Text and Confirm Box */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold font-mono">
            <span>Range limits formatted: YYYY-MM-DD</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2 py-1 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition text-[9px] font-sans font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
