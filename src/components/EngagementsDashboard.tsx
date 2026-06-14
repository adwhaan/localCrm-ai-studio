import React, { useMemo } from "react";
import { 
  Handshake, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  Plus, 
  FileSpreadsheet, 
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Layers
} from "lucide-react";

interface Engagement {
  id: string;
  title: string;
  client: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Pending Draft" | "Closed" | "Under Negotiation";
  description: string;
  tagIds?: string[];
}

interface EngagementsDashboardProps {
  engagements: Engagement[];
  onAddEngagement: () => void;
  onFilterStatus: (status: "Active" | "Pending Draft" | "Closed" | "Under Negotiation") => void;
  onSwitchToListView: () => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const EngagementsDashboard: React.FC<EngagementsDashboardProps> = ({
  engagements,
  onAddEngagement,
  onSwitchToListView,
  showToast
}) => {
  // Statistics Calculations
  const stats = useMemo(() => {
    const total = engagements.length;
    
    // Status metrics
    const active = engagements.filter(e => e.status === "Active").length;
    const pendingDraft = engagements.filter(e => e.status === "Pending Draft").length;
    const negotiating = engagements.filter(e => e.status === "Under Negotiation").length;
    const closed = engagements.filter(e => e.status === "Closed").length;

    // Unique corporate clients
    const uniqueClients = new Set(
      engagements.map(e => e.client ? e.client.toLowerCase().trim() : "").filter(Boolean)
    ).size;

    // Type Breakdown
    const typeMap: Record<string, number> = {};
    engagements.forEach(e => {
      const type = e.type || "Other SOW";
      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    const typeStats = Object.entries(typeMap).map(([name, count]) => ({
      name,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a,b) => b.count - a.count).slice(0, 4);

    return {
      total,
      active,
      pendingDraft,
      negotiating,
      closed,
      uniqueClients,
      typeStats
    };
  }, [engagements]);

  // Export spreadsheet function
  const handleExportCSV = () => {
    if (engagements.length === 0) {
      showToast("No corporate engagements entries loaded to export.", "error");
      return;
    }

    try {
      const headers = ["ID", "Agreement Title", "Client Company", "Type", "Start Date", "End Date", "Status", "Description"];
      const rows = engagements.map(e => {
        return [
          e.id,
          `"${(e.title || "").replace(/"/g, '""')}"`,
          `"${(e.client || "").replace(/"/g, '""')}"`,
          `"${(e.type || "").replace(/"/g, '""')}"`,
          e.startDate,
          e.endDate,
          e.status,
          `"${(e.description || "").replace(/"/g, '""')}"`
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `corporate_engagements_sow_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${engagements.length} engagements to CSV spreadsheet.`, "success");
    } catch (err) {
      showToast("Failed to compile CSV spreadsheet file.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="engagements-analytics-dashboard">
      
      {/* KPI Decker Grid Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Engagements</span>
            <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none block">{stats.total}</span>
            <span className="text-[10px] text-slate-500 font-medium block">Strategic enterprise SOWs</span>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
            <Handshake className="w-5 h-5" />
          </div>
        </div>

        {/* Active Agreements */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active SOW Tracks</span>
            <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none block">{stats.active}</span>
            <span className="text-[10px] text-slate-500 font-medium block">Working/executed campaigns</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Negotiation pipeline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Negotiation Pipe</span>
            <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none block">{stats.negotiating}</span>
            <span className="text-[10px] text-slate-500 font-medium block">Pending corporate approvals</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Client scope served */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Enterprise Client reach</span>
            <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none block">{stats.uniqueClients}</span>
            <span className="text-[10px] text-slate-500 font-medium block">Active client organizations SOW</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core statistical breakdowns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Breakdown Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight font-mono uppercase">Engagement Pipeline Allocations</h3>
              <p className="text-[10px] text-slate-400">Current states covering signed partner campaigns</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-semibold">
              <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-lg">
                <div className="text-emerald-700 text-[10px] font-mono tracking-wider uppercase mb-1">Active</div>
                <strong className="text-xl font-mono font-extrabold text-emerald-950 block">{stats.active}</strong>
              </div>
              <div className="bg-blue-50 border border-blue-150 p-4 rounded-lg">
                <div className="text-blue-700 text-[10px] font-mono tracking-wider uppercase mb-1">In Negotiation</div>
                <strong className="text-xl font-mono font-extrabold text-blue-950 block">{stats.negotiating}</strong>
              </div>
              <div className="bg-amber-50 border border-amber-150 p-4 rounded-lg">
                <div className="text-amber-700 text-[10px] font-mono tracking-wider uppercase mb-1">Pending Draft</div>
                <strong className="text-xl font-mono font-extrabold text-amber-950 block">{stats.pendingDraft}</strong>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <div className="text-slate-500 text-[10px] font-mono tracking-wider uppercase mb-1">Closed SOWs</div>
                <strong className="text-xl font-mono font-extrabold text-slate-950 block">{stats.closed}</strong>
              </div>
            </div>
          </div>

          {/* Types and Categories progress lists */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight font-mono uppercase">Agreement Categories</h3>
              <p className="text-[10px] text-slate-400">Core types covering contract deliverables and tracks</p>
            </div>

            <div className="space-y-4">
              {stats.typeStats.length > 0 ? (
                stats.typeStats.map((type) => (
                  <div key={type.name} className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-150 shadow-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> {type.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900">{type.count} track{type.count !== 1 ? 's' : ''} ({type.percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-250 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${type.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 italic">No types computed</div>
              )}
            </div>
          </div>

        </div>

        {/* Right menu actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono font-semibold">Quick Actions Menu</h4>
            
            <div className="space-y-2 font-semibold">
              <button 
                onClick={onAddEngagement}
                className="w-full text-left p-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Draft Engagement SOW
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>

              <button 
                onClick={handleExportCSV}
                className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export agreements database CSV
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>

              <button 
                onClick={onSwitchToListView}
                className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-slate-450" /> Expand Timeline SOW View
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Audit indicator card */}
          <div className="bg-slate-900 text-slate-350 rounded-xl p-5 border border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 text-white font-mono">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs uppercase font-bold tracking-wider font-semibold">SOW Execution Directive</h4>
            </div>
            <p className="text-[11px] leading-relaxed">
              Ensure SOW engagement dates strictly match SOW contractual signoffs. Overlapped durations or missing target client fields will flag a warning on the central main dashboard.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
