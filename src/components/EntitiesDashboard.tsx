import React, { useMemo } from "react";
import { 
  Building, 
  MapPin, 
  Award, 
  Layers, 
  Plus, 
  FileSpreadsheet, 
  Star, 
  ArrowRight,
  ShieldCheck,
  Globe,
  Briefcase
} from "lucide-react";

interface Entity {
  id: string;
  name: string;
  industry: string;
  tier: "Strategic" | "Enterprise" | "Key Account" | "Growth";
  location: string;
  AddressLine_1?: string;
  AddressLine_2?: string;
  Postalcode?: string;
  City?: string;
  Website?: string;
  Rating?: number;
}

interface EntitiesDashboardProps {
  entities: Entity[];
  onAddEntity: () => void;
  onFilterRating: (rating: string) => void;
  onSearchQuery: (query: string) => void;
  onSwitchToListView: () => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const EntitiesDashboard: React.FC<EntitiesDashboardProps> = ({
  entities,
  onAddEntity,
  onFilterRating,
  onSearchQuery,
  onSwitchToListView,
  showToast
}) => {
  // Statistics Calculations
  const stats = useMemo(() => {
    const total = entities.length;
    
    // Star Rating stats
    let ratedCount = 0;
    let ratingSum = 0;
    let rating4Count = 0;
    let rating3Count = 0;
    let ratingLowCount = 0;
    
    entities.forEach(e => {
      if (e.Rating !== undefined && e.Rating !== null) {
        ratingSum += e.Rating;
        ratedCount++;
        if (e.Rating === 4) rating4Count++;
        else if (e.Rating === 3) rating3Count++;
        else if (e.Rating >= 1) ratingLowCount++;
      }
    });
    
    const avgRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : "N/A";
    
    // Tier metrics
    const strategicCount = entities.filter(e => e.tier === "Strategic").length;
    const enterpriseCount = entities.filter(e => e.tier === "Enterprise").length;
    const keyAccountCount = entities.filter(e => e.tier === "Key Account").length;
    const growthCount = entities.filter(e => e.tier === "Growth").length;
    
    // Website percentage
    const hasWebsite = entities.filter(e => e.Website && e.Website.trim() !== "").length;
    const webPercent = total > 0 ? Math.round((hasWebsite / total) * 100) : 0;
    
    // Industries map
    const industryMap: Record<string, number> = {};
    entities.forEach(e => {
      const ind = e.industry ? e.industry.trim() : "Other / Unspecified";
      industryMap[ind] = (industryMap[ind] || 0) + 1;
    });
    
    const industryBreakdown = Object.entries(industryMap)
      .map(([name, count]) => ({
        name,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // top 4 industries only to remain elegant

    // Top locations
    const locationsList = entities.map(e => e.City || e.location || "Other").filter(Boolean);
    const uniqueLocations = new Set(locationsList).size;

    return {
      total,
      avgRating,
      strategicCount,
      enterpriseCount,
      keyAccountCount,
      growthCount,
      hasWebsite,
      webPercent,
      rating4Count,
      rating3Count,
      ratingLowCount,
      unratedCount: total - ratedCount,
      industryBreakdown,
      uniqueLocations
    };
  }, [entities]);

  // Export to CSV Functionality
  const handleExportCompanies = () => {
    if (entities.length === 0) {
      showToast("No companies registry entries loaded to export.", "error");
      return;
    }

    try {
      const headers = ["ID", "Name", "Industry", "Tier", "Location", "City", "Website", "Rating"];
      const rows = entities.map(e => {
        return [
          e.id,
          `"${(e.name || "").replace(/"/g, '""')}"`,
          `"${(e.industry || "").replace(/"/g, '""')}"`,
          `"${e.tier || ""}"`,
          `"${(e.location || "").replace(/"/g, '""')}"`,
          `"${(e.City || "").replace(/"/g, '""')}"`,
          `"${(e.Website || "").replace(/"/g, '""')}"`,
          e.Rating || "Unrated"
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `corporate_entities_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${entities.length} companies to CSV.`, "success");
    } catch (err) {
      showToast("Failed to compile CSV spreadsheet file.", "error");
    }
  };

  const handleQuickFilterRating = (ratingVal: string) => {
    onFilterRating(ratingVal);
    onSwitchToListView();
    showToast(`Filtered Companies list to Rating: ${ratingVal}`, "info");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="companies-analytics-dashboard">
      
      {/* KPI Stats Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Indexed Clients</span>
            <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none block">{stats.total}</span>
            <span className="text-[10px] text-slate-500 font-medium block">Total corporate listings</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* Avg Corporate Rating */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trust Star Quotient</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none">{stats.avgRating}</span>
              {stats.avgRating !== "N/A" && <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Strategic trust star average</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-550 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Strategic Tier Count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Strategic Focus Tier</span>
            <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none block">{stats.strategicCount}</span>
            <span className="text-[10px] text-slate-500 font-medium block">Priority 1 enterprise partnerships</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Region & Web Visibility */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Corporate Web Footprint</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none">{stats.webPercent}%</span>
              <span className="text-[10px] text-purple-600 font-mono font-bold">({stats.uniqueLocations} cities)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Global index location density</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Globe className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Detailed Industry Sectors & Tiers */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tiers Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight font-mono uppercase">Strategic Partnership Allocation</h3>
              <p className="text-[10px] text-slate-400">Account size, billing limits, and structural classifications</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-emerald-600 block">Strategic Tier</span>
                <strong className="text-xl font-mono font-extrabold text-emerald-950 mt-1 block">{stats.strategicCount}</strong>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-blue-600 block">Enterprise Tier</span>
                <strong className="text-xl font-mono font-extrabold text-blue-950 mt-1 block">{stats.enterpriseCount}</strong>
              </div>
              <div className="bg-purple-50/50 border border-purple-100 p-3 rounded-lg">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-purple-600 block">Key Account</span>
                <strong className="text-xl font-mono font-extrabold text-purple-950 mt-1 block">{stats.keyAccountCount}</strong>
              </div>
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-500 block">Growth Slices</span>
                <strong className="text-xl font-mono font-extrabold text-slate-950 mt-1 block">{stats.growthCount}</strong>
              </div>
            </div>
          </div>

          {/* Industry representation progress bars */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight font-mono uppercase">Primary Enterprise Industries</h3>
              <p className="text-[10px] text-slate-400">Main market sectors covering current corporate listings</p>
            </div>

            <div className="space-y-4">
              {stats.industryBreakdown.length > 0 ? (
                stats.industryBreakdown.map((ind) => (
                  <div key={ind.name} className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-150 shadow-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {ind.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900">{ind.count} accounts ({ind.percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${ind.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 italic">No industry allocations calculated</div>
              )}
            </div>
          </div>
        </div>

        {/* Right column menus & actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">Quick Actions Menu</h4>
            
            <div className="space-y-2 font-semibold">
              <button 
                onClick={onAddEntity}
                className="w-full text-left p-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Index Corporate Company
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>

              <button 
                onClick={handleExportCompanies}
                className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Companies Excel CSV
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>

              <button 
                onClick={onSwitchToListView}
                className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" /> Load Companies Index List
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Strategic Placement Directive */}
          <div className="bg-slate-900 text-slate-350 rounded-xl p-5 border border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 text-white font-mono">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs uppercase font-bold tracking-wider">Enterprise Integrity Clause</h4>
            </div>
            <p className="text-[11px] leading-relaxed">
              Companies assigned to the "Strategic Account" tier must have complete addresses and a registered domain website linked within 7 business days of creation. Periodically review unrated accounts using the list filter menus.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
