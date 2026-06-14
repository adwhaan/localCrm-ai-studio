import React, { useMemo } from "react";
import { 
  Users, 
  Award, 
  Building, 
  CheckCircle, 
  Plus, 
  FileSpreadsheet, 
  Star, 
  Linkedin, 
  ArrowRight,
  ShieldCheck,
  Mail,
  Phone
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  tagIds?: string[];
  LinkedInURL?: string;
  Ratting?: number;
  Rating?: number;
}

interface ContactsDashboardProps {
  contacts: Contact[];
  entities: { name: string }[];
  onAddContact: () => void;
  onFilterRating: (rating: string) => void;
  onSearchQuery: (query: string) => void;
  onSwitchToListView: () => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const ContactsDashboard: React.FC<ContactsDashboardProps> = ({
  contacts,
  entities,
  onAddContact,
  onFilterRating,
  onSearchQuery,
  onSwitchToListView,
  showToast
}) => {
  // Statistics Calculations
  const stats = useMemo(() => {
    const total = contacts.length;
    
    // Ratings
    let ratedCount = 0;
    let ratingSum = 0;
    let rating4Count = 0;
    let rating3Count = 0;
    let ratingLowCount = 0;
    
    contacts.forEach(c => {
      const rating = c.Ratting !== undefined ? c.Ratting : c.Rating;
      if (rating !== undefined && rating !== null) {
        ratingSum += rating;
        ratedCount++;
        if (rating === 4) rating4Count++;
        else if (rating === 3) rating3Count++;
        else if (rating >= 1) ratingLowCount++;
      }
    });
    
    const avgRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : "N/A";
    
    // LinkedIn
    const hasLinkedIn = contacts.filter(c => c.LinkedInURL && c.LinkedInURL.trim() !== "").length;
    const linkedinPercent = total > 0 ? Math.round((hasLinkedIn / total) * 100) : 0;
    
    // Companies
    const uniqueCompanies = new Set(
      contacts.map(c => c.company ? c.company.toLowerCase().trim() : "").filter(Boolean)
    ).size;

    // Roles frequency
    const roleMap: Record<string, number> = {};
    contacts.forEach(c => {
      const role = c.role || "Unknown";
      let key = "Staff / Core";
      if (/director|vp|vice president|chief|head|exec|ceo|cto|cfo/i.test(role)) {
        key = "Executive Lead / VP";
      } else if (/manager|lead|supervisor|director/i.test(role)) {
        key = "Manager / Lead";
      } else if (/architect|analyst|developer|engineer|specialist/i.test(role)) {
        key = "Analyst / Engineering";
      }
      roleMap[key] = (roleMap[key] || 0) + 1;
    });

    const roleBreakdown = Object.entries(roleMap).map(([name, count]) => ({
      name,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    return {
      total,
      avgRating,
      uniqueCompanies,
      hasLinkedIn,
      linkedinPercent,
      rating4Count,
      rating3Count,
      ratingLowCount,
      unratedCount: total - ratedCount,
      roleBreakdown
    };
  }, [contacts]);

  // Export to CSV Functionality (Swiss Modern standard)
  const handleExportRoster = () => {
    if (contacts.length === 0) {
      showToast("No contacts registry entries loaded to export.", "error");
      return;
    }

    try {
      const headers = ["ID", "Name", "Role", "Company", "Email", "Phone", "Rating", "LinkedIn URL"];
      const rows = contacts.map(c => {
        const rating = c.Ratting !== undefined ? c.Ratting : (c.Rating || "Unrated");
        return [
          c.id,
          `"${(c.name || "").replace(/"/g, '""')}"`,
          `"${(c.role || "").replace(/"/g, '""')}"`,
          `"${(c.company || "").replace(/"/g, '""')}"`,
          `"${(c.email || "").replace(/"/g, '""')}"`,
          `"${(c.phone || "").replace(/"/g, '""')}"`,
          rating,
          `"${(c.LinkedInURL || "").replace(/"/g, '""')}"`
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `enterprise_roster_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${contacts.length} Roster contacts to CSV spreadsheet.`, "success");
    } catch (err) {
      showToast("Failed to compile CSV spreadsheet file.", "error");
    }
  };

  const handleQuickFilterRating = (ratingVal: string) => {
    onFilterRating(ratingVal);
    onSwitchToListView();
    showToast(`Filtered Stakeholder list to Rating: ${ratingVal}`, "info");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="contacts-analytics-dashboard">
      
      {/* Dynamic KPI Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Roster */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stakeholders</span>
            <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none block">{stats.total}</span>
            <span className="text-[10px] text-slate-500 font-medium block">Indexed profiles in roster</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating Quality Index</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none">{stats.avgRating}</span>
              {stats.avgRating !== "N/A" && <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Mean alignment star score</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Reach Organizations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Organization Breadth</span>
            <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none block">{stats.uniqueCompanies}</span>
            <span className="text-[10px] text-slate-500 font-medium block">Unique company affiliations</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* LinkedIn linkage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LinkedIn Complete</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-3xl font-mono font-extrabold text-slate-900 leading-none">{stats.linkedinPercent}%</span>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">({stats.hasLinkedIn} profiles)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Social profile linkage rate</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Linkedin className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Stats Column Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Widget: Role Breakdown and Ratings Split */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Role Demographics */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight font-mono uppercase">Stakeholder Tier Demographics</h3>
              <p className="text-[10px] text-slate-400">Functional hierarchy and strategic classifications of indexed personas</p>
            </div>

            <div className="space-y-4">
              {stats.roleBreakdown.length > 0 ? (
                stats.roleBreakdown.map((role) => (
                  <div key={role.name} className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-150 shadow-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{role.name}</span>
                      <span className="font-mono font-extrabold text-slate-900">{role.count} operator{role.count !== 1 ? 's' : ''} ({role.percent}%)</span>
                    </div>
                    {/* Progress indicator */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${role.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  No role distributions computed
                </div>
              )}
            </div>
          </div>

          {/* Rating Breakdown Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight font-mono uppercase">Roster Star Rating Distribution</h3>
              <p className="text-[10px] text-slate-400">Continuous review indicators showing stakeholder status</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div 
                onClick={() => handleQuickFilterRating("4")}
                className="bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-150 p-4 rounded-lg cursor-pointer transition"
              >
                <div className="flex justify-center mb-1 text-emerald-600"><Star className="w-5 h-5 fill-emerald-500" /></div>
                <div className="text-lg font-mono font-bold text-emerald-800">{stats.rating4Count}</div>
                <div className="text-[10px] text-emerald-600 font-bold font-mono">Premium (Tier 4)</div>
              </div>

              <div 
                onClick={() => handleQuickFilterRating("3")}
                className="bg-blue-50 hover:bg-blue-100/70 border border-blue-150 p-4 rounded-lg cursor-pointer transition"
              >
                <div className="flex justify-center mb-1 text-blue-600"><Star className="w-5 h-5 fill-blue-400" /></div>
                <div className="text-lg font-mono font-bold text-blue-800">{stats.rating3Count}</div>
                <div className="text-[10px] text-blue-600 font-bold font-mono font-semibold">Standard (Tier 3)</div>
              </div>

              <div 
                onClick={() => handleQuickFilterRating("1")}
                className="bg-amber-50 hover:bg-amber-100/70 border border-amber-150 p-4 rounded-lg cursor-pointer transition"
              >
                <div className="flex justify-center mb-1 text-amber-505"><Star className="w-5 h-5 fill-amber-300" /></div>
                <div className="text-lg font-mono font-bold text-amber-800">{stats.ratingLowCount}</div>
                <div className="text-[10px] text-amber-600 font-bold font-mono font-semibold">Limited (Tier 1-2)</div>
              </div>

              <div 
                onClick={() => handleQuickFilterRating("NONE")}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-4 rounded-lg cursor-pointer transition"
              >
                <div className="flex justify-center mb-1 text-slate-400"><Star className="w-5 h-5 text-slate-300" /></div>
                <div className="text-lg font-mono font-bold text-slate-800">{stats.unratedCount}</div>
                <div className="text-[10px] text-slate-500 font-bold font-mono font-semibold">Pending Review</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Widget: Quick Action Hub */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">Quick Actions Menu</h4>
            
            <div className="space-y-2">
              <button 
                onClick={onAddContact}
                className="w-full text-left p-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Index New Stakeholder
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>

              <button 
                onClick={handleExportRoster}
                className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Download Roster Spreadsheet
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>

              <button 
                onClick={onSwitchToListView}
                className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition flex items-center justify-between group font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" /> Explore Roster Directory List
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-350 rounded-xl p-5 border border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-mono uppercase font-bold tracking-wider">Strategic Placement Directive</h4>
            </div>
            <p className="text-[11px] leading-relaxed">
              Verify telephone rosters and LinkedIn networks on a bi-weekly cycle. Unverified alignments or stakeholders with incomplete contact fields trigger a security ledger log inside the system audit logs.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
