import React, { useState, useEffect } from 'react';
import { StaffMember, Escalation } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Hand, Clock, Filter, Printer, Download } from 'lucide-react';

export const AdminEscalationsView: React.FC<{ currentStaff: StaffMember }> = ({ currentStaff }) => {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  useEffect(() => {
    fetchEscalations();
  }, []);

  const fetchEscalations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('escalations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load escalations');
    } else {
      setEscalations(data || []);
    }
    setLoading(false);
  };

  const handleClaim = async (id: string) => {
    try {
      const { error } = await supabase
        .from('escalations')
        .update({
          status: 'claimed',
          claimed_by: currentStaff.id
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Escalation claimed');
      fetchEscalations();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const { error } = await supabase
        .from('escalations')
        .update({
          status: 'resolved'
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Escalation resolved');
      fetchEscalations();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredEscalations = escalations.filter(e => {
    if (filterStatus === 'all') return true;
    return e.status === filterStatus;
  });

  const printView = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm border border-red-200">
            <AlertCircle size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Distress Escalations</h1>
            <p className="text-sm font-medium text-gray-500">Safeguarding accountability record for flagged Faith Buddy chats.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="queued">Queued</option>
            <option value="claimed">Claimed</option>
            <option value="resolved">Resolved</option>
          </select>
          <button 
            onClick={printView}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Printer size={16} /> Print Record
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-black uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Flagged Message Excerpt</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Claimed By</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">Loading records...</td>
              </tr>
            ) : filteredEscalations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No escalations found.</td>
              </tr>
            ) : (
              filteredEscalations.map(escalation => (
                <tr key={escalation.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {escalation.status === 'queued' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200"><Clock size={12} /> Queued</span>}
                    {escalation.status === 'claimed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200"><Hand size={12} /> Claimed</span>}
                    {escalation.status === 'resolved' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-green-100 text-green-700 border border-green-200"><CheckCircle size={12} /> Resolved</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium max-w-xs truncate">
                    "{escalation.message}"
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">
                    {new Date(escalation.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700">
                    {escalation.claimed_by ? 'Staff member' : '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {escalation.status === 'queued' && (
                      <button 
                        onClick={() => handleClaim(escalation.id)}
                        className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Claim
                      </button>
                    )}
                    {escalation.status === 'claimed' && (currentStaff.id === escalation.claimed_by || currentStaff.role === 'super_admin') && (
                      <button 
                        onClick={() => handleResolve(escalation.id)}
                        className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Print-only CSS hiding UI elements */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .max-w-5xl, .max-w-5xl * { visibility: visible; }
          .max-w-5xl { position: absolute; left: 0; top: 0; width: 100%; }
          button, select { display: none !important; }
        }
      `}</style>
    </div>
  );
};
