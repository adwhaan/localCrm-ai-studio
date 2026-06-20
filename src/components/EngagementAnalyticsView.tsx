import React, { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { Engagement, Interaction } from "../types";

interface EngagementAnalyticsViewProps {
  engagements: Engagement[];
  interactions: Interaction[];
  onSwitchToListView: () => void;
}

export const EngagementAnalyticsView: React.FC<EngagementAnalyticsViewProps> = ({
  engagements,
  interactions,
  onSwitchToListView
}) => {
  const [selectedEngagementId, setSelectedEngagementId] = useState<string>(
    engagements.length > 0 ? engagements[0].id : ""
  );

  const chartData = useMemo(() => {
    if (!selectedEngagementId) return [];
    
    const eng = engagements.find(e => e.id === selectedEngagementId);
    if (!eng) return [];

    // Filter interactions for this engagement
    const linkedInts = interactions.filter(i => String(i.engagementId) === String(eng.id));
    
    if (linkedInts.length === 0) return [];

    // Group interactions by date to build the burn-up chart
    // We want a cumulative count of total tasks vs completed tasks over time.
    const dates = new Set<string>();
    
    // Add engagement start/end dates if available
    if (eng.startDate) dates.add(eng.startDate);
    if (eng.endDate) dates.add(eng.endDate);
    
    linkedInts.forEach(i => {
      if (i.date) dates.add(i.date);
    });

    const sortedDates = Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let cumulativeTotal = 0;
    let cumulativeCompleted = 0;
    
    const data = sortedDates.map(dateStr => {
      // Find interactions created on or before this date (using the interaction's date as its defining moment)
      // Actually, standard burn-up counts total created interactions up to that date, and completed interactions up to that date.
      // Assuming i.date is when it's scheduled/due, or we just count all linked ones as total.
      // Burn-up: Total Scope vs Completed Scope.
      
      const totalToDate = linkedInts.filter(i => i.date && i.date <= dateStr).length;
      const completedToDate = linkedInts.filter(i => i.date && i.date <= dateStr && i.status === "COMPLETED").length;
      
      return {
        date: dateStr,
        TotalLabel: "Total Scope",
        CompletedLabel: "Completed",
        total: totalToDate,
        completed: completedToDate,
      };
    });

    return data;
  }, [engagements, interactions, selectedEngagementId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Engagement Burn-up Metrics
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Tracking completed interactions against total scoped interactions.
            </p>
          </div>
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs font-bold shadow-inner shrink-0">
             <select
               value={selectedEngagementId}
               onChange={(e) => setSelectedEngagementId(e.target.value)}
               className="bg-white border text-sm border-slate-300 rounded px-3 py-1.5 outline-none font-sans font-semibold text-slate-800"
             >
               {engagements.map(e => (
                 <option key={e.id} value={e.id}>{e.title}</option>
               ))}
             </select>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-96 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }} 
                   itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Area type="stepAfter" dataKey="total" name="Total Touchpoints" stroke="#64748b" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="completed" name="Completed Touchpoints" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 italic text-xs bg-slate-50 border border-dashed border-slate-200 rounded-xl">
             <p>No interaction data found for this engagement.</p>
          </div>
        )}
      </div>
    </div>
  );
};
