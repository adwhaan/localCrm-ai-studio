import React, { useMemo } from "react";
import { 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  AlertOctagon, 
  Plus, 
  FileSpreadsheet, 
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Zap
} from "lucide-react";

interface Interaction {
  id: string;
  subject: string;
  type: string;
  assignee: string;
  status: "IN PROGRESS" | "COMPLETED" | "SCHEDULED" | "BLOCKED";
  client: string;
  date: string;
  summary: string;
  tagIds: string[];
}

interface InteractionsDashboardProps {
  interactions: Interaction[];
  onAddInteraction: () => void;
  onFilterStatus: (status: string) => void;
  onSwitchToListView: () => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const InteractionsDashboard: React.FC<InteractionsDashboardProps> = ({
  interactions,
  onAddInteraction,
  onFilterStatus,
  onSwitchToListView,
  showToast
}) => {
  // Statistics Calculations
  const stats = useMemo(() => {
    const total = interactions.length;
    
    // Status breakdown
    const completed = interactions.filter(i => i.status === "COMPLETED").length;
    const inProgress = interactions.filter(i => i.status === "IN PROGRESS").length;
    const scheduled = interactions.filter(i => i.status === "SCHEDULED").length;
    const blocked = interactions.filter(i => i.status === "BLOCKED").length;

    const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const activePipeline = inProgress + scheduled;
    const blockedRate = total > 0 ? Math.round((blocked / total) * 100) : 0;

    // Type Breakdown
    const typeMap: Record<string, number> = {};
    interactions.forEach(i => {
      const type = i.type || "Other";
      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    const typeStats = Object.entries(typeMap).map(([name, count]) => ({
      name,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a,b) => b.count - a.count);

    // Operator Workload Map (top assignees)
    const assigneeMap: Record<string, number> = {};
    interactions.forEach(i => {
      const ass = i.assignee || "Unassigned";
      assigneeMap[ass] = (assigneeMap[ass] || 0) + 1;
    });

    const workloads = Object.entries(assigneeMap).map(([name, count]) => ({
      name,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count).slice(0, 4);

    return {
      total,
      completed,
      completedPercent,
      activePipeline,
      blocked,
      blockedRate,
      typeStats,
      workloads
    };
  }, [interactions]);

  // Export spreadsheet function
  const handleExportSpreadsheet = () => {
    if (interactions.length === 0) {
      showToast("No deal touchpoint logs entries loaded to export.", "error");
      return;
    }

    try {
      const headers = ["ID", "Subject", "Type", "Assignee", "Status", "Client", "Execution Date", "Summary"];
      const rows = interactions.map(i => {
        return [
          i.id,
          `"${(i.subject || "").replace(/"/g, '""')}"`,
          `"${(i.type || "").replace(/"/g, '""')}"`,
          `"${(i.assignee || "").replace(/"/g, '""')}"`,
          i.status,
          `"${(i.client || "").replace(/"/g, '""')}"`,
          i.date,
          `"${(i.summary || "").replace(/"/g, '""')}"`
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `deal_alignment_touchpoints_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${interactions.length} deal logs to CSV spreadsheet.`, "success");
    } catch (err) {
      showToast("Failed to compile CSV spreadsheet file.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="deals-interactions-dashboard">
      
      {/* KPI Decker Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ledger */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Alignments</span>
            <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none block">{stats.total}</span>
            <span className="text-[10px] text-slate-500 font-medium block">Deals & touchpoint states</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Completed Touchpoints */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Actions</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none">{stats.completed}</span>
              <span className="text-xs text-emerald-600 font-bold">({stats.completedPercent}%)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Resolved pipeline items</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Active open state */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Pipeline</span>
            <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none block">{stats.activePipeline}</span>
            <span className="text-[10px] text-slate-500 font-medium block">Working/scheduled meetings</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Blocked risks amount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blocked Risk Ratio</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-3xl font-mono font-extrabold text-rose-600 leading-none">{stats.blocked}</span>
              <span className="text-xs text-rose-500 font-bold">({stats.blockedRate}% rate)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Critical blocks flagged</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core statistical breakdowns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Breakdown Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight font-mono uppercase">Stage Alignments Metrics</h3>
              <p className="text-[10px] text-slate-400">Stages covering current Touchpoint Deal cards</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div 
                onClick={() => { onFilterStatus("COMPLETED"); onSwitchToListView(); showToast("Showing completed-only touchpoints", "info"); }}
                className="bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-200 border border-emerald-150 p-4 rounded-lg cursor-pointer transition"
              >
                <div className="text-emerald-600 text-xs font-mono font-bold uppercase mb-1">Completed</div>
                <strong className="text-xl font-mono font-extrabold text-emerald-950 block">{stats.completed}</strong>
              </div>
              <div 
                onClick={() => { onFilterStatus("IN PROGRESS"); onSwitchToListView(); showToast("Showing in-progress touchpoints", "info"); }}
                className="bg-blue-50 hover:bg-blue-100 hover:border-blue-200 border border-blue-150 p-4 rounded-lg cursor-pointer transition"
              >
                <div className="text-blue-600 text-xs font-mono font-bold uppercase mb-1">In Progress</div>
                <strong className="text-xl font-mono font-extrabold text-blue-950 block">{interactions.filter(i => i.status === "IN PROGRESS").length}</strong>
              </div>
              <div 
                onClick={() => { onFilterStatus("SCHEDULED"); onSwitchToListView(); showToast("Showing scheduled touchpoints", "info"); }}
                className="bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-200 border border-indigo-150 p-4 rounded-lg cursor-pointer transition"
              >
                <div className="text-indigo-600 text-xs font-mono font-bold uppercase mb-1">Scheduled</div>
                <strong className="text-xl font-mono font-extrabold text-indigo-950 block">{interactions.filter(i => i.status === "SCHEDULED").length}</strong>
              </div>
              <div 
                onClick={() => { onFilterStatus("BLOCKED"); onSwitchToListView(); showToast("Showing BLOCKED at-risk states", "info"); }}
                className="bg-rose-50 hover:bg-rose-100 hover:border-rose-200 border border-rose-150 p-4 rounded-lg cursor-pointer transition"
              >
                <div className="text-rose-600 text-xs font-mono font-bold uppercase mb-1">Blocked 🚨</div>
                <strong className="text-xl font-mono font-extrabold text-rose-950 block">{stats.blocked}</strong>
              </div>
            </div>
          </div>

          {/* Touchpoint channels & Assignees workload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top channels */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h4 className="font-bold text-slate-900 text-xs tracking-tight font-mono uppercase border-b border-slate-100 pb-2 mb-3">Touchpoint Type Slices</h4>
              <div className="space-y-3">
                {stats.typeStats.length > 0 ? (
                  stats.typeStats.map((type) => (
                    <div key={type.name} className="flex justify-between items-center text-xs bg-slate-50/70 p-2 border border-slate-150 rounded-lg">
                      <span className="font-bold text-slate-700">{type.name}</span>
                      <span className="font-mono font-extrabold text-slate-900 bg-slate-200 px-2.5 py-0.5 rounded-full">{type.count} ({type.percent}%)</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400 italic">No touchpoint types logs</div>
                )}
              </div>
            </div>

            {/* Operator Workloads */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h4 className="font-bold text-slate-900 text-xs tracking-tight font-mono uppercase border-b border-slate-100 pb-2 mb-3">Team Operator Workloads</h4>
              <div className="space-y-3">
                {stats.workloads.length > 0 ? (
                  stats.workloads.map((work) => (
                    <div key={work.name} className="flex justify-between items-center text-xs bg-slate-50/70 p-2 border border-slate-150 rounded-lg">
                      <span className="font-bold text-slate-700 truncate max-w-[120px]">{work.name}</span>
                      <span className="font-mono font-extrabold text-indigo-750 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">{work.count} deals</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-450 italic">No operators workload calculated</div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right menu actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">Quick Actions Menu</h4>
            
            <div className="space-y-2 font-semibold">
              <button 
                onClick={onAddInteraction}
                className="w-full text-left p-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Log Touchpoint / Deal
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>

              <button 
                onClick={handleExportSpreadsheet}
                className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Download Deal Logs CSV
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>

              <button 
                onClick={onSwitchToListView}
                className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-slate-400" /> Load Kanban Alignment workspace
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Security & Action alert directive */}
          <div className="bg-slate-900 text-slate-350 rounded-xl p-5 border border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 text-white font-mono">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs uppercase font-bold tracking-wider">Touchpoint watch list</h4>
            </div>
            <p className="text-[11px] leading-relaxed">
              Touchpoints logged as "BLOCKED" are highlighted in high-visibility orange streaks across the system viewboards. Resolve blockers and update tickets within 24 hours to preserve operational alignment.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
