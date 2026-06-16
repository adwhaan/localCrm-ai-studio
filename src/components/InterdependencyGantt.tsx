import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { 
  ArrowRight, 
  Calendar, 
  Info, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  GitCommit, 
  HelpCircle,
  Eye,
  Briefcase
} from "lucide-react";
import { Interaction } from "../types";

interface CustomTag {
  id: string;
  name: string;
  color: string;
}

interface InterdependencyGanttProps {
  interactions: Interaction[];
  filteredInteractions: Interaction[];
  tags: CustomTag[];
  onSelectInteraction: (item: Interaction) => void;
  calendarMonth: number;
  calendarYear: number;
  setCalendarMonth: (m: number) => void;
  setCalendarYear: (y: number) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const InterdependencyGantt: React.FC<InterdependencyGanttProps> = ({
  interactions,
  filteredInteractions,
  tags,
  onSelectInteraction,
  calendarMonth,
  calendarYear,
  setCalendarMonth,
  setCalendarYear,
}) => {
  const [showOnlyDependencies, setShowOnlyDependencies] = useState<boolean>(false);
  const [hoveredInteractionId, setHoveredInteractionId] = useState<string | null>(null);

  // 1. Calculate dates for current month view
  const daysInMonth = useMemo(() => {
    const numDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days: string[] = [];
    for (let d = 1; d <= numDays; d++) {
      days.push(`${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return days;
  }, [calendarMonth, calendarYear]);

  const startDateStr = daysInMonth[0];
  const endDateStr = daysInMonth[daysInMonth.length - 1];

  // 2. Select interactions to display on the Gantt chart
  const ganttInteractions = useMemo(() => {
    // Include all active & waiting interactions that are not CANCELED
    const activeAndWaiting = filteredInteractions.filter(item => item.status !== "CANCELED");

    // Map each to a resolved/projected date for Gantt mapping if it doesn't have an explicit date
    const mapped = activeAndWaiting.map(item => {
      let resolvedDate = item.date || "";
      const isWaiting = !item.date;

      if (!resolvedDate && item.PrevInteraction) {
        const dependencyIdStr = String(item.PrevInteraction);
        const predecessor = interactions.find(other => {
          return String(other.id) === dependencyIdStr || 
                 String(other.id.replace(/\D/g, '') || other.id) === dependencyIdStr;
        });
        if (predecessor) {
          // Project to predecessor's followUpDate or predecessor's scheduled date
          resolvedDate = predecessor.followUpDate || predecessor.date || "";
        }
      }

      // If no date could be resolved or projected, default to current date
      if (!resolvedDate) {
        resolvedDate = new Date().toISOString().split("T")[0];
      }

      return {
        ...item,
        ganttDate: resolvedDate,
        isWaiting
      };
    });

    // Now filter items that fall within the current month view
    let list = mapped.filter(item => {
      return item.ganttDate >= startDateStr && item.ganttDate <= endDateStr;
    });

    // If requested, only show items with relationships (has PrevInteraction, or is PrevInteraction of someone else)
    if (showOnlyDependencies) {
      list = list.filter(item => {
        const hasPredecessor = !!item.PrevInteraction;
        const isPredecessorOfOthers = interactions.some(other => {
          if (!other.PrevInteraction) return false;
          return String(other.PrevInteraction) === String(item.id) && other.status !== "CANCELED";
        });
        return hasPredecessor || isPredecessorOfOthers;
      });
    }

    // Sort chronologically using resolved ganttDate
    return list.sort((a, b) => {
      const dateDiff = a.ganttDate.localeCompare(b.ganttDate);
      if (dateDiff !== 0) return dateDiff;
      return a.subject.localeCompare(b.subject);
    });
  }, [filteredInteractions, interactions, startDateStr, endDateStr, showOnlyDependencies]);

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // Status mapping colors & details
  const getStatusMap = (status: Interaction["status"]) => {
    switch (status) {
      case "COMPLETED":
        return { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-500", label: "COMPLETED" };
      case "BLOCKED":
        return { bg: "bg-rose-500", text: "text-rose-700", border: "border-rose-500", label: "BLOCKED" };
      case "IN PROGRESS":
        return { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-500", label: "IN PROGRESS" };
      case "SCHEDULED":
        return { bg: "bg-blue-500", text: "text-blue-700", border: "border-blue-500", label: "SCHEDULED" };
      default:
        return { bg: "bg-slate-400", text: "text-slate-600", border: "border-slate-400", label: "CANCELED" };
    }
  };

  // Dimensions
  const rowHeight = 44; // h-11 = 44px
  const colWidth = 36;  // w-9 = 36px
  const labelWidth = 280; // left side pane width

  // Compute dependency lines/arrows mathematically
  const dependencyLines = useMemo(() => {
    const lines: Array<{
      fromId: string;
      toId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      highlighted: boolean;
      status: string;
    }> = [];

    ganttInteractions.forEach((item, toIndex) => {
      if (item.PrevInteraction) {
        const dependencyIdStr = String(item.PrevInteraction);
        // Find predecessor's index in the current rendering list
        const fromIndex = ganttInteractions.findIndex(other => {
          return String(other.id) === dependencyIdStr || 
                 String(other.id.replace(/\D/g, '') || other.id) === dependencyIdStr;
        });

        if (fromIndex !== -1) {
          const predItem = ganttInteractions[fromIndex];
          
          // Row center Y coord
          const y1 = fromIndex * rowHeight + rowHeight / 2;
          const y2 = toIndex * rowHeight + rowHeight / 2;

          // X offsets based on date
          const fromDayIndex = daysInMonth.indexOf(predItem.ganttDate);
          const toDayIndex = daysInMonth.indexOf(item.ganttDate);

          if (fromDayIndex !== -1 && toDayIndex !== -1) {
            // Predecessor bar right edge
            const x1 = fromDayIndex * colWidth + colWidth; // block is 1 cell wide
            // Successor bar left edge
            const x2 = toDayIndex * colWidth;

            const isHighlighted = hoveredInteractionId === item.id || hoveredInteractionId === predItem.id;

            lines.push({
              fromId: predItem.id,
              toId: item.id,
              x1,
              y1,
              x2,
              y2,
              highlighted: isHighlighted,
              status: predItem.status
            });
          }
        }
      }
    });

    return lines;
  }, [ganttInteractions, daysInMonth, hoveredInteractionId]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-300">
      
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black font-mono">FLOW-GANTT</span>
            <h3 className="font-extrabold text-slate-800 tracking-tight text-sm">Sequence & Dependency Visualizer</h3>
          </div>
          <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
            Analyzing operational predecessor chains and milestone schedules for {MONTH_NAMES[calendarMonth]} {calendarYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Legend indicator toggler */}
          <button
            type="button"
            onClick={() => setShowOnlyDependencies(!showOnlyDependencies)}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
              showOnlyDependencies 
                ? "bg-indigo-600 text-white border-indigo-700 shadow-xs" 
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showOnlyDependencies ? "Showing Interdependent Only" : "Showing All Month Touchpoints"}
          </button>

          {/* Nav Controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-extrabold font-mono text-slate-700 px-2 min-w-[100px] text-center uppercase tracking-wider">
              {MONTH_NAMES[calendarMonth].substring(0, 3)} {calendarYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Visual Grid Section */}
      {ganttInteractions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 bg-slate-50/50 border border-slate-150 border-dashed rounded-xl select-none text-slate-400 space-y-2.5">
          <Calendar className="w-7 h-7 text-slate-300 stroke-[1.5]" />
          <p className="text-xs font-bold">No active touchpoints in this calendar window</p>
          <p className="text-[10px] text-slate-450 leading-none">Try toggling filters or switching months to find scheduled items</p>
        </div>
      ) : (
        <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          
          {/* Gantt Scroll Container Wrapper */}
          <div className="flex overflow-x-auto min-w-full">
            
            {/* LEFT COLUMN: Names and labels (sticky/frozen) */}
            <div 
              style={{ width: `${labelWidth}px`, minWidth: `${labelWidth}px` }}
              className="bg-slate-50 border-r border-slate-200/75 shrink-0 z-10 sticky left-0 shadow-[4px_0_12px_-5px_rgba(0,0,0,0.05)]"
            >
              {/* Corner header element */}
              <div className="h-10 border-b border-slate-200/80 bg-slate-900 text-slate-300/80 px-4 flex items-center justify-between text-[10.5px] font-bold font-mono tracking-wider uppercase">
                <span>Subject & Assignee</span>
                <span className="text-slate-500 font-extrabold">CRM</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-150">
                {ganttInteractions.map((item) => {
                  const isHovered = hoveredInteractionId === item.id;
                  const statusColors = getStatusMap(item.status);

                  return (
                    <div
                      key={item.id}
                      style={{ height: `${rowHeight}px` }}
                      onMouseEnter={() => setHoveredInteractionId(item.id)}
                      onMouseLeave={() => setHoveredInteractionId(null)}
                      onClick={() => onSelectInteraction(item)}
                      className={`px-4 flex flex-col justify-center cursor-pointer transition-colors duration-150 text-left select-none ${
                        isHovered ? "bg-indigo-50/40" : "bg-slate-50/80 hover:bg-slate-100/50"
                      } ${item.isWaiting ? "border-l-3 border-dashed border-slate-300/80 pl-3.5" : "border-l-3 border-transparent"}`}
                    >
                      <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                        <span className={`font-extrabold text-[11px] truncate leading-tight tracking-tight ${
                          item.isWaiting ? "text-slate-500 font-medium" : "text-slate-800"
                        }`}>
                          {item.subject}
                        </span>
                        
                        {/* Status micro badge */}
                        {item.isWaiting ? (
                          <span className="shrink-0 text-[7px] font-extrabold font-mono px-1 py-0.5 bg-slate-100 text-slate-400 rounded border border-dashed border-slate-300 tracking-wider">
                            WAITING
                          </span>
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColors.bg}`} />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9.5px] text-slate-450 font-bold font-mono truncate mt-0.5">
                        <span className="text-indigo-650">{item.assignee}</span>
                        <span className="text-slate-300">•</span>
                        <span className="truncate">{item.client}</span>
                        {item.isWaiting && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[8px] text-indigo-500 font-extrabold font-mono italic">Projected</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SCROLLABLE TIMELINE TRACKS */}
            <div className="relative flex-1 bg-white">
              
              {/* TIMELINE HEADERS: Calendar Days */}
              <div className="flex h-10 border-b border-slate-200/85 divide-x divide-slate-100 bg-slate-900 text-white text-[9px] font-black font-mono text-center shrink-0">
                {daysInMonth.map((dayStr, idx) => {
                  const dayNum = parseInt(dayStr.split("-")[2], 10);
                  const isWeekend = new Date(dayStr).getDay() === 0 || new Date(dayStr).getDay() === 6;
                  const isTodayStr = dayStr === new Date().toISOString().split("T")[0];

                  return (
                    <div
                      key={dayStr}
                      style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
                      className={`flex flex-col items-center justify-center shrink-0 leading-none py-1 relative ${
                        isTodayStr 
                          ? "bg-blue-600 text-white font-extrabold" 
                          : isWeekend 
                            ? "bg-slate-950/90 text-slate-400" 
                            : "bg-slate-900 text-slate-300"
                      }`}
                    >
                      <span className="text-[10px] tracking-tight">{dayNum}</span>
                      <span className="text-[6.5px] font-bold text-slate-400/80 uppercase mt-0.5">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][new Date(dayStr).getDay()]}
                      </span>
                      {isTodayStr && (
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-blue-500/30 pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* TIMELINE GANTT TRACK GRID BODY */}
              <div className="relative divide-y divide-slate-100 overflow-hidden" style={{ height: `${ganttInteractions.length * rowHeight}px` }}>
                
                {/* SVG Dependency Overlay */}
                <svg 
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{ 
                    width: `${daysInMonth.length * colWidth}px`, 
                    height: `${ganttInteractions.length * rowHeight}px` 
                  }}
                >
                  <defs>
                    <marker
                      id="gantt-arrow-highlight"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="4.5"
                      markerHeight="4.5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
                    </marker>
                    <marker
                      id="gantt-arrow-default"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="4"
                      markerHeight="4"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#cbd5e1" />
                    </marker>
                  </defs>

                  {/* Draw arrow lanes */}
                  {dependencyLines.map((line, idx) => {
                    const isHighlighted = line.highlighted;
                    
                    // Bezier curves/path coordinates
                    // Draw a nice neat stepped line or soft S-bound curve
                    const midX = (line.x1 + line.x2) / 2;
                    const path = `M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`;

                    return (
                      <path
                        key={`dep-${idx}`}
                        d={path}
                        fill="none"
                        className="transition-all duration-200"
                        stroke={isHighlighted ? "#6366f1" : "#cbd5e1"}
                        strokeWidth={isHighlighted ? "2.5" : "1"}
                        strokeDasharray={isHighlighted ? "0" : line.status === "COMPLETED" ? "0" : "3,3"}
                        markerEnd={isHighlighted ? "url(#gantt-arrow-highlight)" : "url(#gantt-arrow-default)"}
                      />
                    );
                  })}
                </svg>

                 {/* Rows Grid Track Layout */}
                {ganttInteractions.map((item, rowIdx) => {
                  const isHovered = hoveredInteractionId === item.id;
                  const itemDayIdx = daysInMonth.indexOf(item.ganttDate);
                  const statusColors = getStatusMap(item.status);

                  return (
                    <div
                      key={item.id}
                      style={{ height: `${rowHeight}px` }}
                      onMouseEnter={() => setHoveredInteractionId(item.id)}
                      onMouseLeave={() => setHoveredInteractionId(null)}
                      className={`flex divide-x divide-slate-100/50 relative transition-colors duration-150 ${
                        isHovered ? "bg-indigo-50/20" : "bg-transparent hover:bg-slate-50/20"
                      }`}
                    >
                      {/* Empty back cells */}
                      {daysInMonth.map((dayStr, dayIdx) => {
                        const isWeekend = new Date(dayStr).getDay() === 0 || new Date(dayStr).getDay() === 6;
                        return (
                          <div
                            key={dayStr}
                            style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
                            className={`shrink-0 h-full ${isWeekend ? "bg-slate-50/35" : ""}`}
                          />
                        );
                      })}

                      {/* Floating Absolute Gantt Pill placed accurately on the grid */}
                      {itemDayIdx !== -1 && (
                        <div
                          style={{
                            position: "absolute",
                            left: `${itemDayIdx * colWidth + 5}px`,
                            width: `${colWidth - 10}px`, // beautiful narrow milestone dot/bar
                            top: "50%",
                            transform: "translateY(-50%)",
                            height: "24px"
                          }}
                          onClick={() => onSelectInteraction(item)}
                          className={`z-30 rounded-lg cursor-pointer flex items-center justify-center transition-all ${
                            item.isWaiting
                              ? `bg-white border-2 border-dashed ${statusColors.border} ${statusColors.text} opacity-80 hover:opacity-100`
                              : isHovered 
                                ? `${statusColors.bg} scale-110 shadow-md ring-3 ring-indigo-100` 
                                : `${statusColors.bg} shadow-sm opacity-90 hover:opacity-100 hover:scale-105`
                          }`}
                          title={`${item.subject} (${item.isWaiting ? 'Waiting - Projected Date' : statusColors.label})`}
                        >
                          <GitCommit className={`w-3.5 h-3.5 stroke-[2.5] ${item.isWaiting ? statusColors.text : "text-white"}`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. Operational visual guide footer */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 flex flex-wrap items-center justify-between gap-3 text-[10px] font-semibold text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 flex items-center justify-center text-[7px] text-white">✓</span>
            <span className="uppercase text-slate-700">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 flex items-center justify-center text-[7px] text-white">⚙</span>
            <span className="uppercase text-slate-700">In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500 flex items-center justify-center text-[7px] text-white">⏰</span>
            <span className="uppercase text-slate-700">Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 flex items-center justify-center text-[7px] text-white">⛔</span>
            <span className="uppercase text-slate-700">Blocked</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Dashed arcs represent incomplete dependency links. Hover to highlight relations.</span>
        </div>
      </div>

    </div>
  );
};
