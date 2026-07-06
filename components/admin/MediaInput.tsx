import { useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface MediaInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept: 'image' | 'video';
  className?: string;
}

export function MediaInput({ label, value, onChange, accept, className = '' }: MediaInputProps) {
  const [uploading, setUploading] = useState(false);

  const acceptString = accept === 'image' ? 'image/*' : 'video/*';
  const Icon = accept === 'image' ? ImageIcon : Video;

  async function handleFileSelect(file: File) {
    try {
      setUploading(true);
      
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Date.now().toString();

      const fileName = `${uuid}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('content-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        toast.error(`Upload failed: ${error.message}`);
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('content-media')
        .getPublicUrl(fileName);

      onChange(publicUrlData.publicUrl);
      toast.success('File uploaded successfully!');
    } catch (e: any) {
      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </label>
      
      <div className="flex items-center gap-2">
        {value ? (
          <div className="relative flex-1 group">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none pr-8"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex-1">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${accept} URL or upload file...`}
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
            />
          </div>
        )}

        <div className="relative flex-shrink-0">
          <input
            type="file"
            accept={acceptString}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
              // Reset the input value so the same file can be selected again
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={uploading}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold hover:bg-teal-100 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
}
