
import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsType, Entry } from '../types';
import { Save, Trash2, AlertTriangle, RefreshCw, User, Image as ImageIcon, Upload, FileText, Share2, Mail } from 'lucide-react';
import { APP_VERSION } from '../constants';

interface SettingsProps {
  settings: SettingsType;
  entries: Entry[];
  onSave: (newSettings: SettingsType) => void;
  onReset: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, entries, onSave, onReset }) => {
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [exportEmail, setExportEmail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when props change (e.g. after reset)
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (field: keyof SettingsType, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const handleBudgetChange = (field: keyof SettingsType, value: string) => {
    // Handle comma for international inputs
    const cleanVal = value.replace(',', '.');
    if (cleanVal === '' || /^\d*\.?\d*$/.test(cleanVal)) {
        const numVal = parseFloat(cleanVal);
        handleChange(field, isNaN(numVal) ? 0 : numVal);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
  };

  const handleResetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowResetConfirm(true);
  };

  const handleConfirmReset = (e: React.MouseEvent) => {
    e.preventDefault();
    onReset();
    setShowResetConfirm(false);
  };

  const handleForceReload = () => {
    window.location.reload();
  };

  // Handle Image Upload and Resize
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Define max dimensions (512x512 is plenty for an app icon)
        const MAX_SIZE = 512;
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio to center crop to square
        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;

        if (ctx) {
          // Draw image cropped to square and resized
          ctx.drawImage(img, startX, startY, size, size, 0, 0, MAX_SIZE, MAX_SIZE);
          
          // Convert to Base64 string (JPEG 0.8 quality to save space)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          handleChange('logo', dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- Export Logic ---
  const generateCSV = (): string => {
    // Header
    const headers = ["Date", "Amount", "Note", "Timestamp", "ID"];
    
    // Sort by Date Descending
    const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    
    // Rows
    const rows = sortedEntries.map(e => {
        const escapedNote = `"${(e.note || '').replace(/"/g, '""')}"`;
        return [
            e.date,
            e.amount,
            escapedNote,
            new Date(e.timestamp).toISOString(),
            e.id
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const handleExportToEmail = () => {
    if (!exportEmail) {
        alert("Please enter a recipient email address.");
        return;
    }

    const csvContent = generateCSV();
    const subject = encodeURIComponent("BrewBalance Data Export");
    const body = encodeURIComponent(
`Here is your BrewBalance data export.

${csvContent}
`
    );

    const mailtoLink = `mailto:${exportEmail}?subject=${subject}&body=${body}`;

    // Browser URL length limits are typically around 2000 chars.
    if (mailtoLink.length > 2000) {
        alert("Your history is too long to send via a direct email link. Please use the 'Share as File' button instead.");
    } else {
        window.location.href = mailtoLink;
    }
  };

  const handleShareFile = async () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'brewbalance_export.csv', { type: 'text/csv' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'BrewBalance Export',
                text: 'Here is my BrewBalance expense history in CSV format.'
            });
        } catch (error) {
            console.log('Share cancelled or failed', error);
        }
    } else {
        // Fallback for desktop or non-supported browsers: Direct Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brewbalance_export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="pb-24 h-full flex flex-col">
      <h2 className="text-3xl font-extrabold text-white mb-6 tracking-tight">Settings</h2>
      
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        
        {/* Profile Section */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-800">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={16} /> User Profile
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Your Name</label>
              <input
                type="text"
                enterKeyHint="done"
                value={localSettings.userName || ''}
                onChange={e => handleChange('userName', e.target.value)}
                className="w-full p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 focus:border-amber-500 outline-none transition-all font-bold text-lg text-white placeholder-slate-700"
                placeholder="Enter your name"
              />
            </div>

            {/* Custom Logo Upload */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Custom App Icon</label>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-800 bg-slate-950 shrink-0">
                        {localSettings.logo ? (
                            <img src={localSettings.logo} alt="Custom Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                <ImageIcon size={24} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            className="hidden" 
                            accept="image/*"
                         />
                         <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                            >
                                <Upload size={14} /> Upload Photo
                            </button>
                            {localSettings.logo && (
                                <button
                                    type="button"
                                    onClick={() => handleChange('logo', null)}
                                    className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-bold rounded-xl transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                         </div>
                         <p className="text-[10px] text-slate-500 mt-2">
                            Upload a photo from your library. It will be cropped to a square.
                         </p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-800">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            Daily Targets
          </h3>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Weekday Budget</label>
              <div className="relative group">
                <input
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  pattern="[0-9]*"
                  value={localSettings.weekdayBudget || ''}
                  placeholder="300"
                  onChange={e => handleBudgetChange('weekdayBudget', e.target.value)}
                  className="w-full p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 focus:border-amber-500 outline-none transition-all font-bold text-lg text-white placeholder-slate-700"
                />
                <span className="absolute right-4 top-4 text-slate-600 font-medium pointer-events-none">{localSettings.currency}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Weekend Budget</label>
              <div className="relative group">
                <input
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  pattern="[0-9]*"
                  value={localSettings.weekendBudget || ''}
                  placeholder="2000"
                  onChange={e => handleBudgetChange('weekendBudget', e.target.value)}
                  className="w-full p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 focus:border-amber-500 outline-none transition-all font-bold text-lg text-white placeholder-slate-700"
                />
                <span className="absolute right-4 top-4 text-slate-600 font-medium pointer-events-none">{localSettings.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-800">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            Configuration
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Currency Symbol</label>
              <input
                type="text"
                enterKeyHint="done"
                value={localSettings.currency}
                onChange={e => handleChange('currency', e.target.value)}
                className="w-full p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 focus:border-amber-500 outline-none transition-all font-medium text-white"
                placeholder="e.g. JPY, $, €"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <label className="text-sm font-semibold text-slate-300">Alarm Threshold</label>
                 <span className="text-xs font-bold bg-amber-900/30 text-amber-400 px-2 py-1 rounded-lg">
                    {Math.round(localSettings.alarmThreshold * 100)}%
                 </span>
              </div>
              <div className="h-10 flex items-center">
                <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={localSettings.alarmThreshold}
                    onChange={e => handleChange('alarmThreshold', parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The dashboard turns <span className="text-amber-400 font-bold">yellow</span> when you spend {Math.round(localSettings.alarmThreshold * 100)}% of your daily budget.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Start Date</label>
                  <input
                    type="date"
                    value={localSettings.startDate}
                    onChange={e => handleChange('startDate', e.target.value)}
                    className="w-full p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 focus:border-amber-500 outline-none transition-all font-medium text-slate-300 scheme-dark"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">End Date <span className="font-normal text-slate-600">(Optional)</span></label>
                  <input
                    type="date"
                    value={localSettings.endDate || ''}
                    onChange={e => handleChange('endDate', e.target.value || null)}
                    className="w-full p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 focus:border-amber-500 outline-none transition-all font-medium text-slate-300 scheme-dark"
                  />
                </div>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-800">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText size={16} /> Data Export
             </h3>
             
             <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Recipient Email (Optional)</label>
                    <input
                        type="email"
                        value={exportEmail}
                        onChange={(e) => setExportEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 focus:border-amber-500 outline-none text-white text-sm"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={handleExportToEmail}
                        className="py-3 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors flex flex-col items-center justify-center gap-1 text-xs border border-slate-700"
                    >
                        <Mail size={18} className="text-amber-500" />
                        <span>Send to Email</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleShareFile}
                        className="py-3 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors flex flex-col items-center justify-center gap-1 text-xs border border-slate-700"
                    >
                        <Share2 size={18} className="text-emerald-500" />
                        <span>Share / Save CSV</span>
                    </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                    "Send to Email" opens your mail app. For large histories, use "Share CSV" to attach the file instead.
                </p>
             </div>
        </div>

        <div className="pt-2">
            <button
                type="submit"
                className="w-full py-4 px-6 bg-amber-500 text-slate-900 font-bold rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
            >
                <Save size={18} /> Save Settings
            </button>
        </div>

        {/* Danger Zone */}
        <div className="mt-10 pt-6 border-t border-slate-800">
             <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                Danger Zone
             </h3>
             
             {!showResetConfirm ? (
               <button
                  type="button"
                  onClick={handleResetClick}
                  className="w-full py-4 px-6 bg-slate-900 text-red-500 font-bold rounded-2xl hover:bg-red-950/30 transition-all flex items-center justify-center gap-2 active:scale-95 border border-red-900/30"
               >
                  <Trash2 size={18} /> Reset App Data
               </button>
             ) : (
               <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
                 <div className="flex items-start gap-3 mb-4">
                   <AlertTriangle className="text-red-500 shrink-0" size={24} />
                   <div>
                     <h4 className="font-bold text-red-400 text-sm">Are you sure?</h4>
                     <p className="text-xs text-red-300/80 mt-1">
                       This will permanently delete all expenses and reset your settings. This action cannot be undone.
                     </p>
                   </div>
                 </div>
                 <div className="flex gap-3">
                   <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-3 bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition-colors text-sm"
                   >
                      Cancel
                   </button>
                   <button
                      type="button"
                      onClick={handleConfirmReset}
                      className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20 text-sm"
                   >
                      Yes, Delete All
                   </button>
                 </div>
               </div>
             )}
        </div>

        {/* App Version & Reload */}
        <div className="pt-8 pb-4 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-2">
                BrewBalance v{APP_VERSION}
            </p>
            <button 
                type="button"
                onClick={handleForceReload}
                className="inline-flex items-center gap-2 text-xs font-bold text-amber-500/80 hover:text-amber-400 transition-colors px-3 py-2 rounded-lg hover:bg-slate-900"
            >
                <RefreshCw size={12} /> Force Reload / Update
            </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
