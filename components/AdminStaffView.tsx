import React, { useState, useEffect } from 'react';
import { StaffMember, AuditLogEntry, StaffRole, ZoneScope } from '../types';
import { 
  fetchStaffMembers, inviteStaffMember, updateStaffRole, 
  deactivateStaffMember, reactivateStaffMember, fetchAuditLogs 
} from '../lib/supabase';
import { UserPlus, Settings, Check, X, ShieldAlert, ClipboardList, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminStaffViewProps {
  currentStaff: StaffMember;
}

export const AdminStaffView: React.FC<AdminStaffViewProps> = ({ currentStaff }) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Invite Panel Form State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('teacher_volunteer');
  const [inviteZone, setInviteZone] = useState<ZoneScope>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Role Form State
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<StaffRole>('teacher_volunteer');
  const [editingZone, setEditingZone] = useState<ZoneScope>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [staffData, logData] = await Promise.all([
        fetchStaffMembers(),
        fetchAuditLogs()
      ]);
      setStaffList(staffData);
      setAuditLogs(logData);
    } catch (e: any) {
      toast.error(`Error fetching admin data: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) {
      toast.error('Email and Full Name are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await inviteStaffMember(inviteEmail, inviteName, inviteRole, inviteZone);
      toast.success(`Successfully invited ${inviteName}!`);
      setIsInviteOpen(false);
      
      // Reset form
      setInviteEmail('');
      setInviteName('');
      setInviteRole('teacher_volunteer');
      setInviteZone(null);
      
      await loadData();
    } catch (e: any) {
      toast.error(`Failed to invite staff: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChangeSubmit = async (id: string) => {
    try {
      await updateStaffRole(id, editingRole, editingZone);
      toast.success('Staff role updated successfully.');
      setEditingStaffId(null);
      await loadData();
    } catch (e: any) {
      toast.error(`Failed to update role: ${e.message}`);
    }
  };

  const handleToggleDeactivate = async (member: StaffMember) => {
    const isDeactivating = member.status === 'active' || member.status === 'invited';
    const confirmMsg = isDeactivating
      ? `Are you sure you want to deactivate ${member.full_name}? They will lose dashboard access immediately.`
      : `Reactivate ${member.full_name}'s account?`;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      if (isDeactivating) {
        await deactivateStaffMember(member.id);
        toast.success(`${member.full_name} deactivated.`);
      } else {
        await reactivateStaffMember(member.id);
        toast.success(`${member.full_name} reactivated.`);
      }
      await loadData();
    } catch (e: any) {
      toast.error(`Operation failed: ${e.message}`);
    }
  };

  const getRoleLabel = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'content_editor': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'zone_manager': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'reviewer': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-teal-50 text-teal-700 border-teal-100';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-150';
      case 'invited': return 'bg-yellow-50 text-yellow-700 border-yellow-150';
      default: return 'bg-red-50 text-red-700 border-red-150';
    }
  };

  return (
    <div className="space-y-8 text-gray-700 font-sans text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Staff & Roles</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage permission roles, zone scopes, and view staff audit trails.</p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-700 text-white font-bold rounded-2xl hover:bg-teal-800 hover:scale-[1.01] active:scale-95 transition-all shadow-md shadow-teal-100 cursor-pointer text-sm shrink-0"
        >
          <UserPlus size={18} />
          <span>Invite Staff</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-150 text-center">
          <p className="text-sm font-bold text-gray-500">Loading directory records...</p>
        </div>
      ) : (
        <>
          {/* Staff List Table */}
          <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150">
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Name / Email</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Role</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Scope</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Telegram Link</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staffList.map((member) => {
                    const isSelf = member.id === currentStaff.id;
                    const isEditing = editingStaffId === member.id;
                    
                    return (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                        {/* Name / Email */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-extrabold text-sm">
                              {member.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <span>{member.full_name}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-black uppercase bg-teal-50 text-teal-700 border border-teal-100 px-1.5 py-0.5 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-medium text-gray-500 mt-0.5">{member.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editingRole}
                              onChange={(e) => {
                                const roleVal = e.target.value as StaffRole;
                                setEditingRole(roleVal);
                                if (roleVal !== 'zone_manager') setEditingZone(null);
                              }}
                              className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="content_editor">Content Editor</option>
                              <option value="zone_manager">Zone Manager</option>
                              <option value="teacher_volunteer">Teacher Volunteer</option>
                              <option value="reviewer">Reviewer</option>
                            </select>
                          ) : (
                            <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getRoleBadgeStyle(member.role)}`}>
                              {getRoleLabel(member.role)}
                            </span>
                          )}
                        </td>

                        {/* Scope */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            editingRole === 'zone_manager' ? (
                              <select
                                value={editingZone || ''}
                                onChange={(e) => setEditingZone((e.target.value || null) as ZoneScope)}
                                className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                              >
                                <option value="">Select Zone...</option>
                                <option value="kids">Kids</option>
                                <option value="teens">Teens</option>
                                <option value="teachers">Teachers</option>
                              </select>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">Global</span>
                            )
                          ) : member.role === 'zone_manager' ? (
                            <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 uppercase">
                              {member.scoped_zone || 'None'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Global</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(member.status)}`}>
                            {member.status}
                          </span>
                        </td>

                        {/* Telegram chat link */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-500">
                          {member.telegram_chat_id ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <Check size={14} strokeWidth={3} />
                              <span>Linked</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 flex items-center gap-1 font-medium">
                              <X size={14} strokeWidth={2} />
                              <span>No</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleRoleChangeSubmit(member.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer"
                                title="Save"
                              >
                                <Check size={16} strokeWidth={2.5} />
                              </button>
                              <button
                                onClick={() => setEditingStaffId(null)}
                                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg cursor-pointer"
                                title="Cancel"
                              >
                                <X size={16} strokeWidth={2.5} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2.5">
                              {!isSelf && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingStaffId(member.id);
                                      setEditingRole(member.role);
                                      setEditingZone(member.scoped_zone);
                                    }}
                                    className="text-teal-600 hover:text-teal-800 cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Settings size={13} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleToggleDeactivate(member)}
                                    className={`${
                                      member.status === 'deactivated' 
                                        ? 'text-green-600 hover:text-green-800' 
                                        : 'text-red-500 hover:text-red-700'
                                    } cursor-pointer`}
                                  >
                                    {member.status === 'deactivated' ? 'Activate' : 'Deactivate'}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs Box */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
              <ClipboardList className="text-teal-600" size={20} />
              <span>Action Audit Log</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150">
                    <th className="px-4 py-2.5 font-black uppercase text-gray-400 w-1/4">Actor</th>
                    <th className="px-4 py-2.5 font-black uppercase text-gray-400 w-1/5">Action</th>
                    <th className="px-4 py-2.5 font-black uppercase text-gray-400 w-1/3">Details</th>
                    <th className="px-4 py-2.5 font-black uppercase text-gray-400 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-400 font-semibold">
                        No system operations logged yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-bold text-gray-900">{log.actor_name}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200/60 font-semibold">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-400">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Side Invite Modal Panel */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsInviteOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900">Invite Team Member</h3>
                <button onClick={() => setIsInviteOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Doe"
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jane.doe@example.com"
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Permission Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => {
                      const val = e.target.value as StaffRole;
                      setInviteRole(val);
                      if (val !== 'zone_manager') setInviteZone(null);
                    }}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="content_editor">Content Editor</option>
                    <option value="zone_manager">Zone Manager</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="teacher_volunteer">Teacher Volunteer</option>
                  </select>
                </div>

                {inviteRole === 'zone_manager' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Scoped Zone
                    </label>
                    <select
                      value={inviteZone || ''}
                      onChange={(e) => setInviteZone((e.target.value || null) as ZoneScope)}
                      required
                      className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                    >
                      <option value="">Select Scoped Zone...</option>
                      <option value="kids">Kids Zone</option>
                      <option value="teens">Teens Tribe</option>
                      <option value="teachers">Teachers Hub</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-teal-700 text-white font-bold rounded-full hover:bg-teal-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? 'Sending Invitation...' : 'Send Invitation Email'}
                </button>
              </form>
            </div>
            
            <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 mt-6 flex items-start gap-2.5">
              <ShieldAlert className="text-teal-700 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-teal-800 font-medium leading-relaxed">
                Supabase sends a secure, personalized verification link to the email provided, enabling them to set a private password.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
