import React, { useState, useEffect } from 'react';
import { BibleVersion, StaffMember } from '../types';
import { 
  fetchBibleVersionsAdmin, upsertBibleVersion, verifyBibleVersion, 
  fetchZoneDefaultVersions, setZoneDefaultVersion 
} from '../lib/supabase';
import { 
  ArrowUp, ArrowDown, ShieldAlert, Check, X, Plus, Play, RotateCw, Book 
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminBibleVersionsViewProps {
  currentStaff: StaffMember;
}

export const AdminBibleVersionsView: React.FC<AdminBibleVersionsViewProps> = ({ currentStaff }) => {
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [zoneDefaults, setZoneDefaults] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // New Version Form State
  const [newBibleId, setNewBibleId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newShortCode, setNewShortCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState<'none' | 'success' | 'failed'>('none');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [versionsData, defaultsData] = await Promise.all([
        fetchBibleVersionsAdmin(),
        fetchZoneDefaultVersions()
      ]);
      setVersions(versionsData);
      setZoneDefaults(defaultsData);
    } catch (e: any) {
      toast.error(`Error loading versions: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestVerify = async (bibleId: number) => {
    toast.info(`Verifying YouVersion ID ${bibleId} passages API access...`);
    try {
      const ok = await verifyBibleVersion(bibleId);
      if (ok) {
        toast.success(`YouVersion ID ${bibleId} successfully verified!`);
        await loadData();
      } else {
        toast.error(`Verification failed. Check YouVersion app key or translation ID.`);
      }
    } catch (err: any) {
      toast.error(`Verification request failed: ${err.message}`);
    }
  };

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedId = Number(newBibleId);
    if (isNaN(parsedId) || parsedId <= 0) {
      toast.error('Please enter a valid numeric YouVersion Bible ID.');
      return;
    }
    if (!newLabel.trim() || !newShortCode.trim()) {
      toast.error('Label and short code are required.');
      return;
    }

    try {
      setIsVerifying(true);
      setVerifiedStatus('none');
      
      // Verification is mandatory before adding
      const ok = await verifyBibleVersion(parsedId);
      if (!ok) {
        setVerifiedStatus('failed');
        toast.error('Verification failed. This Bible translation ID is invalid or inactive on YouVersion.');
        return;
      }

      setVerifiedStatus('success');
      
      // Save version
      await upsertBibleVersion({
        bible_id: parsedId,
        label: newLabel.trim(),
        short_code: newShortCode.trim().toUpperCase(),
        display_order: versions.length + 1,
        is_active: true,
        is_verified: true
      });
      
      toast.success(`Bible Version "${newLabel}" successfully verified and added!`);
      setNewBibleId('');
      newLabel && setNewLabel('');
      newShortCode && setNewShortCode('');
      setVerifiedStatus('none');
      await loadData();
    } catch (err: any) {
      toast.error(`Failed to add version: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleActive = async (version: BibleVersion) => {
    if (version.is_active && !version.is_verified) {
      toast.error('Cannot activate an unverified YouVersion translation ID. Run verification check first.');
      return;
    }
    
    try {
      await upsertBibleVersion({
        ...version,
        is_active: !version.is_active
      });
      toast.success(`${version.short_code} translation ${!version.is_active ? 'activated' : 'deactivated'}.`);
      await loadData();
    } catch (err: any) {
      toast.error(`Failed to toggle active state: ${err.message}`);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === versions.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reorderedList = [...versions];
    
    // Swap display order numbers
    const tempOrder = reorderedList[index].display_order;
    reorderedList[index].display_order = reorderedList[targetIndex].display_order;
    reorderedList[targetIndex].display_order = tempOrder;

    try {
      // Save updates
      await Promise.all([
        upsertBibleVersion(reorderedList[index]),
        upsertBibleVersion(reorderedList[targetIndex])
      ]);
      await loadData();
    } catch (err: any) {
      toast.error(`Reordering failed: ${err.message}`);
    }
  };

  const handleDefaultZoneChange = async (zone: 'kids' | 'teens' | 'teachers', bibleId: number) => {
    try {
      await setZoneDefaultVersion(zone, bibleId);
      toast.success(`Default translation configured for ${zone} zone!`);
      await loadData();
    } catch (err: any) {
      toast.error(`Failed to update default: ${err.message}`);
    }
  };

  // Only verified and active translations can be defaults
  const eligibleDefaults = versions.filter(v => v.is_active && v.is_verified);

  return (
    <div className="space-y-8 text-gray-700 font-sans text-left">
      <div>
        <h1 className="text-2xl font-black text-gray-900 font-display">Bible Reader Configuration</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage approved YouVersion translations, verify API IDs, reorder display priorities, and configure default translation lookups per-zone.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-150 bg-gray-50/50">
              <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                <Book className="text-teal-600" size={20} />
                <span>Active Translations List</span>
              </h3>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-gray-500 font-bold">Loading translations...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-xs font-black uppercase text-gray-400">
                      <th className="px-6 py-3">Order</th>
                      <th className="px-6 py-3">Translation Name</th>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Verification</th>
                      <th className="px-6 py-3">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-semibold text-gray-700">
                    {versions.map((ver, idx) => (
                      <tr key={ver.bible_id} className="hover:bg-gray-50/30 transition-colors">
                        {/* Display Reordering */}
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMove(idx, 'up')}
                              disabled={idx === 0}
                              className={`p-1 hover:bg-gray-100 rounded-md transition-all cursor-pointer ${
                                idx === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
                              }`}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(idx, 'down')}
                              disabled={idx === versions.length - 1}
                              className={`p-1 hover:bg-gray-100 rounded-md transition-all cursor-pointer ${
                                idx === versions.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
                              }`}
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </td>

                        {/* Translation Details */}
                        <td className="px-6 py-3">
                          <div>
                            <span className="font-bold text-gray-900 block">{ver.label}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 mt-1 inline-block">
                              {ver.short_code}
                            </span>
                          </div>
                        </td>

                        {/* ID */}
                        <td className="px-6 py-3 font-mono text-xs">{ver.bible_id}</td>

                        {/* Verified status check */}
                        <td className="px-6 py-3 whitespace-nowrap text-xs">
                          {ver.is_verified ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <Check size={14} strokeWidth={3} />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTestVerify(ver.bible_id)}
                              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 hover:underline cursor-pointer"
                            >
                              <RotateCw size={12} />
                              <span>Test Now</span>
                            </button>
                          )}
                        </td>

                        {/* Active checkbox */}
                        <td className="px-6 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(ver)}
                            className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-200 ${
                              ver.is_active ? 'bg-teal-700' : 'bg-gray-200'
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow transform transition-all duration-200 ${
                                ver.is_active ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Form & defaults */}
        <div className="space-y-6">
          {/* Defaults Selectors */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="font-black text-lg text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Book size={18} className="text-teal-600" />
              <span>Zone Defaults</span>
            </h3>

            {isLoading ? (
              <div className="text-xs text-gray-500 font-bold text-center py-4">Loading defaults...</div>
            ) : (
              <div className="space-y-4">
                {(['kids', 'teens', 'teachers'] as const).map(zone => (
                  <div key={zone}>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1 capitalize">
                      {zone} Zone Translation
                    </label>
                    <select
                      value={zoneDefaults[zone] || ''}
                      onChange={(e) => handleDefaultZoneChange(zone, Number(e.target.value))}
                      className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                    >
                      <option value="">Select Default...</option>
                      {eligibleDefaults.map(v => (
                        <option key={v.bible_id} value={v.bible_id}>{v.label} ({v.short_code})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Version Form */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="font-black text-lg text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Plus size={18} className="text-teal-600" />
              <span>Add Bible Version</span>
            </h3>

            <form onSubmit={handleAddVersion} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                  YouVersion Bible ID
                </label>
                <input
                  type="text"
                  required
                  value={newBibleId}
                  onChange={(e) => setNewBibleId(e.target.value)}
                  placeholder="e.g. 3034"
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                  Translation Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Berean Standard Bible"
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                  Short Code
                </label>
                <input
                  type="text"
                  required
                  value={newShortCode}
                  onChange={(e) => setNewShortCode(e.target.value)}
                  placeholder="e.g. BSB"
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none font-bold uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Play size={12} fill="currentColor" />
                <span>{isVerifying ? 'Verifying Version ID...' : 'Verify & Add Version'}</span>
              </button>
            </form>
            
            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 flex items-start gap-2.5">
              <ShieldAlert className="text-teal-700 shrink-0 mt-0.5" size={14} />
              <p className="text-[10px] text-teal-800 font-medium leading-relaxed">
                Verification requests confirm the numeric translation ID works against the YouVersion live passages API before allowing it to be added to the selector list, avoiding blank reader frames.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
