import React, { useState } from 'react';
import { StaffMember, Audience } from '../types';
import { 
  LayoutDashboard, Users, BookOpen, ClipboardList, AlertCircle, 
  LogOut, Menu, X, Shield, Sparkles, Smile
} from 'lucide-react';
import { AdminStaffView } from './AdminStaffView';

interface AdminLayoutProps {
  currentStaff: StaffMember;
  onSignOut: () => void;
  onNavigateHome: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentStaff, onSignOut, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    // If super_admin, default to staff, otherwise dashboard
    const path = window.location.pathname;
    if (path.endsWith('/staff') && currentStaff.role === 'super_admin') return 'staff';
    if (path.endsWith('/content') && ['super_admin', 'content_editor', 'zone_manager'].includes(currentStaff.role)) return 'content';
    if (path.endsWith('/review') && ['super_admin', 'reviewer'].includes(currentStaff.role)) return 'review';
    if (path.endsWith('/escalations') && ['super_admin', 'teacher_volunteer'].includes(currentStaff.role)) return 'escalations';
    return 'dashboard';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'content_editor', 'zone_manager', 'teacher_volunteer', 'reviewer'] },
    { id: 'staff', label: 'Staff & Roles', icon: Users, roles: ['super_admin'] },
    { id: 'content', label: 'Zone Content', icon: BookOpen, roles: ['super_admin', 'content_editor', 'zone_manager'] },
    { id: 'review', label: 'Review Queue', icon: ClipboardList, roles: ['super_admin', 'reviewer'] },
    { id: 'escalations', label: 'Escalations', icon: AlertCircle, roles: ['super_admin', 'teacher_volunteer'] },
  ].filter(item => item.roles.includes(currentStaff.role));

  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    // Push the state matching the tab path
    let newPath = '/admin';
    if (tabId !== 'dashboard') {
      newPath = `/admin/${tabId}`;
    }
    window.history.pushState(null, '', newPath);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'content_editor':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'zone_manager':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'reviewer':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-teal-100 text-teal-700 border-teal-200';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-150 flex-shrink-0">
        <div className="p-6 border-b border-gray-150 flex items-center justify-between">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-left font-display font-black text-xl text-teal-800 hover:opacity-85 transition-opacity"
          >
            <Shield className="text-teal-600" size={24} />
            <span>Faith Admin</span>
          </button>
        </div>

        {/* Staff Profile Card */}
        <div className="p-4 border-b border-gray-150 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
              {currentStaff.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{currentStaff.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{currentStaff.email}</p>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(currentStaff.role)}`}>
              {formatRole(currentStaff.role)}
            </span>
            {currentStaff.scoped_zone && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-gray-100 text-gray-600 border-gray-200">
                {currentStaff.scoped_zone} zone
              </span>
            )}
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => changeTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-150">
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition-all rounded-xl cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden flex items-center justify-between bg-white border-b border-gray-150 px-4 py-3 flex-shrink-0">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-2 font-display font-black text-lg text-teal-800"
          >
            <Shield className="text-teal-600" size={20} />
            <span>Faith Admin</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>

        {/* Mobile Sidebar overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="relative flex flex-col w-64 bg-white border-r border-gray-150 h-full">
              <div className="p-4 border-b border-gray-150 flex items-center justify-between">
                <span className="flex items-center gap-2 font-display font-black text-lg text-teal-800">
                  <Shield className="text-teal-600" size={20} />
                  <span>Faith Admin</span>
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-900 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 border-b border-gray-150 bg-gray-50/50">
                <p className="text-sm font-bold text-gray-900 truncate">{currentStaff.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{currentStaff.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(currentStaff.role)}`}>
                    {formatRole(currentStaff.role)}
                  </span>
                </div>
              </div>

              <nav className="flex-1 px-2 py-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => changeTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl cursor-pointer ${
                        isActive 
                          ? 'bg-teal-700 text-white' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-gray-150">
                <button
                  onClick={onSignOut}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900">Welcome Back, {currentStaff.full_name}!</h1>
                  <p className="text-sm text-gray-500 mt-1">Here is a quick overview of Faith Tribe management statistics.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-150 px-3 py-1.5 rounded-full shrink-0 self-start md:self-auto">
                  <Sparkles size={14} className="animate-spin text-teal-600" />
                  <span>Active Session</span>
                </div>
              </div>

              {/* Stats Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wider text-gray-400">Total Staff Profiles</p>
                  <h3 className="text-3xl font-black text-gray-900 mt-1">1</h3>
                  <div className="mt-2 text-xs font-bold text-teal-600 flex items-center gap-1">
                    <span>Active Team Roles</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wider text-gray-400">Distress Escalations</p>
                  <h3 className="text-3xl font-black text-gray-900 mt-1">0</h3>
                  <div className="mt-2 text-xs font-bold text-gray-500 flex items-center gap-1">
                    <span>All responders active</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wider text-gray-400">Pending Review</p>
                  <h3 className="text-3xl font-black text-gray-900 mt-1">0</h3>
                  <div className="mt-2 text-xs font-bold text-gray-500 flex items-center gap-1">
                    <span>Curriculum updates clean</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wider text-gray-400">Zone Scopes</p>
                  <h3 className="text-3xl font-black text-gray-900 mt-1">3</h3>
                  <div className="mt-2 text-xs font-bold text-gray-500 flex items-center gap-1">
                    <span>Kids, Teens, Teachers</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Content Summary */}
              <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
                <h3 className="font-black text-lg text-gray-900 mb-3 flex items-center gap-2">
                  <Smile className="text-amber-500" size={20} />
                  <span>Admin Portal Operations</span>
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  Use the navigation links in the sidebar to review active staff accounts, configure live streams, update interactive weekly fun cards, or track converts decision logs.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'staff' && <AdminStaffView currentStaff={currentStaff} />}

          {['content', 'review', 'escalations'].includes(activeTab) && (
            <div className="bg-white p-8 rounded-3xl border border-gray-150 shadow-sm text-center py-16">
              <div className="mx-auto w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <BookOpen size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900">Module Under Construction</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 font-medium">
                This area (role-gated `/admin/{activeTab}`) is reserved for future admin content management modules.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
