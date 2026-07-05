import React, { useState, useEffect } from 'react';
import { VotdOverride, BibleVersion, StaffMember } from '../types';
import { fetchActiveBibleVersions, fetchVotdOverrides, setVotdOverride, deleteVotdOverride } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Calendar, Plus, Trash2, ShieldAlert, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface AdminVotdViewProps {
  currentStaff: StaffMember;
}

export const AdminVotdView: React.FC<AdminVotdViewProps> = ({ currentStaff }) => {
  const [overrides, setOverrides] = useState<VotdOverride[]>([]);
  const [activeVersions, setActiveVersions] = useState<BibleVersion[]>([]);
  const [activeZone, setActiveZone] = useState<'kids' | 'teens' | 'teachers'>('kids');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [overrideRef, setOverrideRef] = useState('');
  const [overrideVersion, setOverrideVersion] = useState<number>(3034);
  const [overrideNote, setOverrideNote] = useState('');
  const [selectedOverrideId, setSelectedOverrideId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isZoneManager = currentStaff.role === 'zone_manager';
  const managerZone = currentStaff.scoped_zone;

  const loadData = async () => {
    try {
      setIsLoading(true);
      const zoneToQuery = isZoneManager && managerZone ? managerZone : activeZone;
      
      const [overridesData, versionsData] = await Promise.all([
        fetchVotdOverrides(zoneToQuery),
        fetchActiveBibleVersions()
      ]);
      
      setOverrides(overridesData);
      setActiveVersions(versionsData);
      if (versionsData.length > 0) {
        // Find default version (BSB 3034 or first available)
        const defaultVer = versionsData.find(v => v.bible_id === 3034) || versionsData[0];
        setOverrideVersion(defaultVer.bible_id);
      }
    } catch (e: any) {
      toast.error(`Error loading overrides: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isZoneManager && managerZone) {
      setActiveZone(managerZone);
    }
    loadData();
  }, [activeZone]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (dateStr: string) => {
    const existing = overrides.find(o => o.override_date === dateStr);
    setSelectedDateStr(dateStr);
    
    if (existing) {
      setSelectedOverrideId(existing.id);
      setOverrideRef(existing.reference);
      setOverrideVersion(existing.version_id);
      setOverrideNote(existing.note || '');
    } else {
      setSelectedOverrideId(null);
      setOverrideRef('');
      // Set to BSB default if available
      const bsb = activeVersions.find(v => v.bible_id === 3034) || activeVersions[0];
      setOverrideVersion(bsb ? bsb.bible_id : 3034);
      setOverrideNote('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateStr) return;
    if (!overrideRef.trim()) {
      toast.error('Scripture reference is required (e.g. JHN.3.16).');
      return;
    }

    try {
      setIsSaving(true);
      await setVotdOverride(
        activeZone,
        selectedDateStr,
        overrideRef.trim().toUpperCase(),
        overrideVersion,
        overrideNote.trim() || null
      );
      toast.success(`Override configured for ${selectedDateStr}!`);
      setSelectedDateStr(null);
      await loadData();
    } catch (err: any) {
      toast.error(`Failed to set override: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearOverride = async () => {
    if (!selectedOverrideId) return;
    if (!window.confirm('Clear this Verse of the Day override?')) return;
    
    try {
      setIsSaving(true);
      await deleteVotdOverride(selectedOverrideId);
      toast.success('Override cleared.');
      setSelectedDateStr(null);
      await loadData();
    } catch (err: any) {
      toast.error(`Failed to clear override: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Calendar rendering helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendarCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const cells = [];
    
    // Empty cells before the first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="bg-gray-50/50 aspect-square border-b border-r border-gray-150"></div>);
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const hasOverride = overrides.find(o => o.override_date === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      
      cells.push(
        <div
          key={day}
          onClick={() => handleDateClick(dateStr)}
          className={`aspect-square p-2 border-b border-r border-gray-150 flex flex-col justify-between cursor-pointer hover:bg-teal-50/30 transition-colors group relative ${
            isToday ? 'bg-teal-50/20' : ''
          }`}
        >
          <span className={`text-xs font-bold ${isToday ? 'text-teal-700 font-black bg-teal-100/60 px-1.5 py-0.5 rounded-md' : 'text-gray-500'}`}>
            {day}
          </span>
          
          {hasOverride ? (
            <div className="bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black rounded-lg p-1 truncate text-center shadow-sm">
              {hasOverride.reference}
              <span className="block text-[8px] font-medium text-amber-600">
                {activeVersions.find(v => v.bible_id === hasOverride.version_id)?.short_code || 'BSB'}
              </span>
            </div>
          ) : (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-gray-400 self-center">
              + Override
            </span>
          )}
        </div>
      );
    }
    
    return cells;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-8 text-gray-700 font-sans text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Verse of the Day Overrides</h1>
          <p className="text-sm text-gray-500 mt-0.5">Override the automatic daily scripture verse with specific topic-based scripture references per-zone.</p>
        </div>

        {/* Zone Selector */}
        {!isZoneManager ? (
          <div className="flex gap-1.5 bg-white p-1 rounded-2xl border border-gray-150 shadow-sm">
            {(['kids', 'teens', 'teachers'] as const).map(zone => (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize cursor-pointer transition-all ${
                  activeZone === zone ? 'bg-teal-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs font-black uppercase tracking-wider bg-teal-50 border border-teal-150 text-teal-700 px-3 py-1.5 rounded-full">
            {activeZone} zone overrides
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-150 text-center">
          <p className="text-sm font-bold text-gray-500">Loading overrides schedule...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden flex flex-col">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-150 bg-gray-50/50">
            <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
              <Calendar className="text-teal-600" size={20} />
              <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            </h3>
            <div className="flex gap-1.5">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-150 rounded-lg cursor-pointer text-gray-600">
                <ChevronLeft size={20} />
              </button>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-150 rounded-lg cursor-pointer text-gray-600">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 text-center border-b border-gray-150 font-bold bg-gray-50 text-xs py-3 text-gray-400">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>
          <div className="grid grid-cols-7 border-l border-t border-gray-150">
            {renderCalendarCells()}
          </div>
        </div>
      )}

      {/* Override Editor Modal Panel */}
      {selectedDateStr && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedDateStr(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                    Configure override
                  </span>
                  <h3 className="text-lg font-black text-gray-900 mt-1">{selectedDateStr}</h3>
                </div>
                <button onClick={() => setSelectedDateStr(null)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    YouVersion Scripture USFM Code
                  </label>
                  <input
                    type="text"
                    required
                    value={overrideRef}
                    onChange={(e) => setOverrideRef(e.target.value)}
                    placeholder="e.g. JHN.3.16"
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none font-bold uppercase"
                  />
                  <span className="text-[10px] text-gray-400 block mt-1">
                    Must use USFM code reference format (e.g. `JHN.3.16`, `LUK.15.11-20`).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Bible Translation Version
                  </label>
                  <select
                    value={overrideVersion}
                    onChange={(e) => setOverrideVersion(Number(e.target.value))}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none font-semibold"
                  >
                    {activeVersions.map(v => (
                      <option key={v.bible_id} value={v.bible_id}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Internal Note / Event Label
                  </label>
                  <input
                    type="text"
                    value={overrideNote}
                    onChange={(e) => setOverrideNote(e.target.value)}
                    placeholder="e.g. Christmas Day Reading"
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none font-medium"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  {selectedOverrideId && (
                    <button
                      type="button"
                      onClick={handleClearOverride}
                      disabled={isSaving}
                      className="px-4 py-2.5 bg-red-50 text-red-600 font-bold rounded-full hover:bg-red-100 cursor-pointer flex items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-all text-xs"
                    >
                      <Trash2 size={14} />
                      <span>Delete Override</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 bg-teal-700 text-white font-bold rounded-full hover:bg-teal-800 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 text-xs"
                  >
                    <Check size={14} />
                    <span>{selectedOverrideId ? 'Save Changes' : 'Apply Override'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 mt-6 flex items-start gap-2.5">
              <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                Applying a Verse of the Day override overrides the automatic YouVersion daily lookup for all users inside the {activeZone} zone. If no override exists, the reader falls back to the default automatic lookup.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
