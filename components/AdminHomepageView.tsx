import React, { useState, useEffect } from 'react';
import { DbBroadcastStatus, StaffMember } from '../types';
import { fetchBroadcastStatus, updateBroadcastStatus } from '../lib/supabase';
import { Radio, Video, Image, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface AdminHomepageViewProps {
  currentStaff: StaffMember;
}

export const AdminHomepageView: React.FC<AdminHomepageViewProps> = ({ currentStaff }) => {
  const [isLive, setIsLive] = useState(false);
  const [title, setTitle] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [teensTopicTitle, setTeensTopicTitle] = useState('');
  const [teensTopicDesc, setTeensTopicDesc] = useState('');
  const [teensTopicVideoId, setTeensTopicVideoId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const status = await fetchBroadcastStatus();
      setIsLive(status.is_live);
      setTitle(status.title || '');
      setStreamUrl(status.url || '');
      setHeroVideoUrl(status.hero_video_url || '');
      setHeroImageUrl(status.hero_image_url || '');
      setTeensTopicTitle(status.teens_topic_title || '');
      setTeensTopicDesc(status.teens_topic_desc || '');
      setTeensTopicVideoId(status.teens_topic_video_id || '');
    } catch (e: any) {
      toast.error(`Error loading broadcast status: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateBroadcastStatus(
        isLive,
        title.trim(),
        streamUrl.trim(),
        heroVideoUrl.trim(),
        heroImageUrl.trim(),
        teensTopicTitle.trim(),
        teensTopicDesc.trim(),
        teensTopicVideoId.trim()
      );
      toast.success('Homepage and broadcast status updated successfully!');
      await loadData();
    } catch (err: any) {
      toast.error(`Failed to update settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 text-gray-700 font-sans text-left max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900 font-display">Homepage & Broadcast Control</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure active live streams, looping background hero assets, and banner titles.</p>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-150 text-center">
          <p className="text-sm font-bold text-gray-500">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Live stream settings box */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6">
            <h3 className="font-black text-lg text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Radio className={`${isLive ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} size={20} />
              <span>Live Broadcast Status</span>
            </h3>

            {/* Live Toggle */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-200/60">
              <div>
                <p className="font-bold text-gray-900 text-sm">Toggle Live Broadcast State</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">When active, a red "Watch Live" call-out and media stream overlay appears across the public homepage.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLive(!isLive)}
                className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                  isLive ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-all duration-300 ${
                    isLive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Stream details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Service / Broadcast Title
                </label>
                <input
                  type="text"
                  required={isLive}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Morning Glory Service"
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Embed Stream Video Player URL
                </label>
                <input
                  type="text"
                  required={isLive}
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/embed/..."
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Hero Visual Assets Settings */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6">
            <h3 className="font-black text-lg text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Video className="text-teal-600" size={20} />
              <span>Hero visual background assets</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                  <Video size={13} />
                  <span>Looping Background Video Asset Path</span>
                </label>
                <input
                  type="text"
                  required
                  value={heroVideoUrl}
                  onChange={(e) => setHeroVideoUrl(e.target.value)}
                  placeholder="/faith-tribe-hero.mp4"
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                  <Image size={13} />
                  <span>Image Poster Asset Path</span>
                </label>
                <input
                  type="text"
                  required
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="/faith-tribe-hero-poster-1080.jpg"
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Teens Topic of the Month Settings */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6">
            <h3 className="font-black text-lg text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sparkles className="text-emerald-500" size={20} />
              <span>Teens Topic of the Month</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  required
                  value={teensTopicTitle}
                  onChange={(e) => setTeensTopicTitle(e.target.value)}
                  placeholder="e.g. Identity in a Filtered World"
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none font-semibold text-gray-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Topic Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={teensTopicDesc}
                  onChange={(e) => setTeensTopicDesc(e.target.value)}
                  placeholder="e.g. Who are you when the screen is turned off? Learn how Christ defines your worth..."
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none font-medium text-gray-800 leading-relaxed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  YouTube Video ID (Watch Message)
                </label>
                <input
                  type="text"
                  required
                  value={teensTopicVideoId}
                  onChange={(e) => setTeensTopicVideoId(e.target.value)}
                  placeholder="e.g. dQw4w9WgXcQ"
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">Provide only the 11-character YouTube video ID (e.g. the part after watch?v=).</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 text-sm"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving Configurations...' : 'Save Configurations'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
