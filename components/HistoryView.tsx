
import React, { useMemo, useState } from 'react';
import { Entry, Settings } from '../types';
import { TrendingUp, Info, Edit2, Trophy, Target, Ban, CheckCircle2, AlertCircle, PlayCircle, AlertOctagon } from 'lucide-react';
import { calculateChallengeBudgetSoFar, calculateChallengeTotalBudget, isChallengeFailed } from '../utils/financeHelpers';
import { getTodayISO } from '../utils/dateUtils';
import { calculateStats } from '../utils/financeHelpers';

interface HistoryViewProps {
  entries: Entry[];
  settings: Settings;
  onEditEntry: (entry: Entry) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ entries, settings, onEditEntry }) => {
  const [viewMode, setViewMode] = useState<'expenses' | 'challenges'>('expenses');
  const currency = settings.currency === 'JPY' ? '¥' : settings.currency === '$' ? '$' : settings.currency;
  const todayISO = getTodayISO();

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
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

  // Calculate needed stats to check failure for active challenge
  const activeChallengeStatus = useMemo(() => {
      if (!settings.activeChallenge) return null;
      
      // We need stats to get savedSoFar. 
      // Note: Calculating full stats here might be expensive if many entries, but necessary for accuracy.
      // Optimally, we'd pass statsMap from parent, but this component doesn't receive it currently.
      // We'll do a localized lightweight check or just calc stats.
      const statsMap = calculateStats(settings, entries, todayISO);
      
      // Determine relevant date for stats
      const isPastEnd = todayISO > settings.activeChallenge.endDate;
      const referenceDate = isPastEnd ? settings.activeChallenge.endDate : todayISO;
      const refStats = statsMap[referenceDate];
      const savedSoFar = refStats?.challengeSavedSoFar || 0;

      const isFailed = isChallengeFailed(settings.activeChallenge, settings, savedSoFar, todayISO);
      
      return { isFailed, savedSoFar };
  }, [settings, entries, todayISO]);

  // Combine Active and Past Challenges
  const allChallenges = useMemo(() => {
      const list = settings.pastChallenges ? [...settings.pastChallenges] : [];
      if (settings.activeChallenge) {
          list.unshift(settings.activeChallenge);
      }
      return list;
  }, [settings.pastChallenges, settings.activeChallenge]);

  return (
    <div className="h-full flex flex-col pb-24">
      <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">History</h2>
          
          <div className="bg-slate-900 p-1 rounded-xl flex gap-1 border border-slate-800">
             <button 
                onClick={() => setViewMode('expenses')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'expenses' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
             >
                Expenses
             </button>
             <button 
                onClick={() => setViewMode('challenges')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'challenges' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
             >
                Challenges
             </button>
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {viewMode === 'expenses' ? (
             <div className="space-y-6">
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
        ) : (
            <div className="space-y-4">
                 {allChallenges.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-4">
                        <div className="p-5 bg-slate-900 rounded-full border border-slate-800">
                            <Trophy size={32} />
                        </div>
                        <p className="text-base font-medium">No challenges found</p>
                    </div>
                 ) : (
                    allChallenges.map(challenge => {
                        let displayStatus = 'Cancelled';
                        let statusColor = 'text-slate-400';
                        let bgClass = 'bg-slate-900 border-slate-800';
                        let icon = <Ban size={18} />;
                        
                        // For active challenge, check if failed
                        const isActive = challenge.status === 'active';
                        const isActiveFailed = isActive && activeChallengeStatus?.isFailed;

                        if (isActive) {
                            if (isActiveFailed) {
                                displayStatus = 'Failed but still in progress';
                                statusColor = 'text-red-400';
                                bgClass = 'bg-red-950/20 border-red-900/40 shadow-[0_0_15px_rgba(220,38,38,0.2)]';
                                icon = <AlertOctagon size={18} />;
                            } else {
                                displayStatus = 'In Progress';
                                statusColor = 'text-blue-400';
                                bgClass = 'bg-slate-900 border-blue-900/50 shadow-[0_0_15px_rgba(30,58,138,0.2)]';
                                icon = <PlayCircle size={18} />;
                            }
                        } else {
                            const isCancelled = challenge.status === 'cancelled';
                            const isSuccess = !isCancelled && (challenge.finalSaved !== undefined && challenge.finalSaved >= 0);
                            const isFailed = !isCancelled && (challenge.finalSaved !== undefined && challenge.finalSaved < 0);

                            if (isSuccess) {
                                displayStatus = 'Successful';
                                statusColor = 'text-emerald-400';
                                bgClass = 'bg-emerald-950/20 border-emerald-900/40';
                                icon = <CheckCircle2 size={18} />;
                            } else if (isFailed) {
                                displayStatus = 'Failed';
                                statusColor = 'text-red-400';
                                bgClass = 'bg-red-950/20 border-red-900/40';
                                icon = <AlertCircle size={18} />;
                            }
                        }

                        // Determine saved amount to show
                        const savedAmount = isActive 
                            ? (activeChallengeStatus?.savedSoFar || 0) 
                            : (challenge.finalSaved || 0);

                        return (
                            <div key={challenge.id} className={`p-5 rounded-2xl border ${bgClass} shadow-sm relative overflow-hidden transition-all`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-black text-white">{challenge.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                            {challenge.startDate} — {challenge.endDate}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-black/30 ${statusColor}`}>
                                        {icon}
                                        <span className={isActiveFailed ? "max-w-[120px] leading-tight text-right" : ""}>{displayStatus}</span>
                                    </div>
                                </div>
                                
                                {challenge.purpose && (
                                    <div className="mb-4 flex items-center gap-2 text-slate-400 text-xs">
                                        <Target size={14} className="text-amber-500" />
                                        <span>Goal: <span className="text-slate-200 font-bold">{challenge.purpose}</span></span>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-bold uppercase">
                                        {isActive ? "Current Savings" : "Total Saved"}
                                    </span>
                                    <span className={`text-2xl font-black ${
                                        savedAmount >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                        {savedAmount >= 0 ? '+' : ''}{currency}{Math.round(savedAmount)}
                                    </span>
                                </div>
                                {isActive && !isActiveFailed && (
                                    <div className="mt-2 flex justify-center items-center">
                                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest animate-pulse">Active Now</span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                 )}
            </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
