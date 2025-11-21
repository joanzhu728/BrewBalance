import React, { useMemo } from 'react';
import { Entry, Settings } from '../types';
import { TrendingUp, Info, Edit2 } from 'lucide-react';

interface HistoryViewProps {
  entries: Entry[];
  settings: Settings;
  onEditEntry: (entry: Entry) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ entries, settings, onEditEntry }) => {
  const currency = settings.currency === 'JPY' ? '¥' : settings.currency === '$' ? '$' : settings.currency;

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    // Sort entries by timestamp descending
    const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    
    sorted.forEach(entry => {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
    });
    return groups;
  }, [entries]);

  const dates = Object.keys(groupedEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="h-full flex flex-col pb-24">
      <h2 className="text-3xl font-extrabold text-white mb-6 tracking-tight px-1">Expense History</h2>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
        {dates.length === 0 ? (
           <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-4">
              <div className="p-5 bg-slate-900 rounded-full border border-slate-800">
                 <Info size={32} />
              </div>
              <p className="text-base font-medium">No expenses recorded yet</p>
           </div>
        ) : (
          dates.map(date => (
            <div key={date} className="space-y-3">
               <div className="flex items-center gap-3 px-1">
                 <span className="text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                   {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                 </span>
                 <div className="h-px bg-slate-800 flex-1"></div>
               </div>
               
               <div className="space-y-3">
                 {groupedEntries[date].map(entry => (
                    <button 
                        key={entry.id} 
                        onClick={() => onEditEntry(entry)}
                        className="w-full flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-sm hover:bg-slate-800/50 transition-colors group text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-950/30 flex items-center justify-center text-amber-500 border border-amber-900/30 group-hover:scale-110 transition-transform">
                                <TrendingUp size={18} />
                            </div>
                            <div>
                                <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{entry.note}</div>
                                <div className="text-xs text-slate-500 font-medium">{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="font-black text-white text-lg">
                                -{currency}{entry.amount}
                            </div>
                            <Edit2 size={14} className="text-slate-600 group-hover:text-slate-400" />
                        </div>
                    </button>
                 ))}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryView;