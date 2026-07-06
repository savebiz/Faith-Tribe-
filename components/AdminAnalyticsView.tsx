import React, { useState, useEffect } from 'react';
import { StaffMember, AnalyticsEvent } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { LayoutDashboard, Filter, TrendingUp, BookOpen, MessageSquare, Book, Flame } from 'lucide-react';

export const AdminAnalyticsView: React.FC<{ currentStaff: StaffMember }> = ({ currentStaff }) => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [daysBack, setDaysBack] = useState<number>(30);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedZone, daysBack]);

  const fetchAnalytics = async () => {
    setLoading(true);
    let query = supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Enforce zone_manager RLS logic via UI filter as well
    if (currentStaff.role === 'zone_manager' && currentStaff.scoped_zone) {
      query = query.eq('zone', currentStaff.scoped_zone);
    } else if (selectedZone !== 'all') {
      query = query.eq('zone', selectedZone);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load analytics');
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  // Aggregations
  const totalEvents = events.length;
  
  const chatMessagesCount = events.filter(e => e.event_type === 'chat_message_sent').length;
  const contentViewsCount = events.filter(e => e.event_type === 'content_viewed').length;
  const amensCount = events.filter(e => e.event_type === 'verse_reaction').length;

  const getTopVerses = () => {
    const counts: Record<string, number> = {};
    events.filter(e => e.event_type === 'verse_reaction').forEach(e => {
      if (e.metadata?.book && e.metadata?.chapter) {
        const ref = `${e.metadata.book} ${e.metadata.chapter}`;
        counts[ref] = (counts[ref] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const getBibleVersions = () => {
    const counts: Record<string, number> = {};
    events.filter(e => e.event_type === 'bible_version_selected').forEach(e => {
      if (e.metadata?.version_id) {
        counts[e.metadata.version_id] = (counts[e.metadata.version_id] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const topVerses = getTopVerses();
  const topVersions = getBibleVersions();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm font-medium text-gray-500">Track engagement, reading habits, and feature usage.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <select 
            value={daysBack}
            onChange={(e) => setDaysBack(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          {currentStaff.role !== 'zone_manager' && (
            <select 
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-indigo-500 capitalize"
            >
              <option value="all">All Zones</option>
              <option value="kids">Kids Zone</option>
              <option value="teens">Teens Zone</option>
              <option value="teachers">Teachers Zone</option>
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><p className="text-gray-500 font-medium">Loading analytics data...</p></div>
      ) : (
        <div className="space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <TrendingUp size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider">Total Events</h3>
              </div>
              <p className="text-3xl font-black text-gray-900">{totalEvents}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-indigo-500">
                <MessageSquare size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider">Chat Messages</h3>
              </div>
              <p className="text-3xl font-black text-indigo-900">{chatMessagesCount}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-emerald-500">
                <BookOpen size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider">Content Views</h3>
              </div>
              <p className="text-3xl font-black text-emerald-900">{contentViewsCount}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-amber-500">
                <Flame size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider">Amens Given</h3>
              </div>
              <p className="text-3xl font-black text-amber-900">{amensCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Passages */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 mb-4 flex items-center gap-2">
                <Book size={16} className="text-indigo-500" /> Most "Amen"ed Chapters
              </h3>
              {topVerses.length === 0 ? (
                <p className="text-sm text-gray-500">No reactions yet.</p>
              ) : (
                <div className="space-y-3">
                  {topVerses.map(([ref, count], i) => (
                    <div key={ref} className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-700">
                        {i + 1}. {ref}
                      </span>
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-lg">
                        {count} Amens
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bible Versions */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-emerald-500" /> Top Bible Versions Selected
              </h3>
              {topVersions.length === 0 ? (
                <p className="text-sm text-gray-500">No versions selected yet.</p>
              ) : (
                <div className="space-y-3">
                  {topVersions.map(([id, count], i) => (
                    <div key={id} className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-700">
                        {i + 1}. Version ID: {id}
                      </span>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg">
                        {count} Selections
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
