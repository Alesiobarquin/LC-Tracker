import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2, ImagePlus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '@clerk/clerk-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user } = useUser();
  const [type, setType] = useState('feature_request');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | string>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    setIsSubmitting(true);
    setStatus('idle');

    try {
      let imageUrl = null;

      if (imageFile) {
        setStatus('Uploading image...');
        const fileExt = imageFile.name.split('.').pop() || 'png';
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('feedback_images')
          .upload(filePath, imageFile);

        if (uploadError) {
          const isPermissionIssue = /row-level security|permission denied|not allowed/i.test(uploadError.message || '');
          if (isPermissionIssue) {
            throw new Error('Image upload was blocked by storage permissions. Please retry in a moment or contact support.');
          }
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('feedback_images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      setStatus('Saving feedback...');
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          type,
          message: message.trim(),
          image_url: imageUrl,
        });

      if (error) throw error;

      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setMessage('');
        setType('feature_request');
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }, 2000);
    } catch (err: any) {
      console.error('Operation failed: Error submitting feedback');
      setStatus('Failed to send. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
          <h2 className="text-lg font-semibold text-white">Share Feedback</h2>
          <button
            onClick={onClose}
            aria-label="Close feedback modal"
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {status === 'success' && (
            <div className="flex items-center gap-2 p-3 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <p className="font-medium text-sm">Feedback sent successfully!</p>
            </div>
          )}

          {status !== 'idle' && status !== 'success' && (
            <div className="flex items-center gap-2 p-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium text-sm break-words">{status}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Type of Feedback</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="feature_request">💡 Feature Request</option>
              <option value="bug">🐛 Bug Report</option>
              <option value="general">💬 General Feedback</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-zinc-300">Attach Screenshot (Optional)</span>
            {imagePreview ? (
              <div className="relative inline-block mt-2 rounded-lg overflow-hidden border border-zinc-700">
                <img src={imagePreview} alt="Preview" className="max-h-32 object-cover" />
                <button
                  type="button"
                  aria-label="Remove attached image"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    URL.revokeObjectURL(imagePreview);
                  }}
                  className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-red-500/80 text-white rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  id="screenshot-upload"
                  accept="image/png, image/jpeg, image/webp"
                  className="sr-only peer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      setStatus('Image must be less than 5MB.');
                      return;
                    }
                    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                      setStatus('Invalid file type (JPG, PNG, WebP only).');
                      return;
                    }
                    setStatus('idle');
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                />
                <label
                  htmlFor="screenshot-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer transition-colors text-sm w-max border border-zinc-700 mt-1 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:outline-none"
                >
                  <ImagePlus className="w-4 h-4" aria-hidden="true" />
                  Select Image
                </label>
                <p className="text-xs text-zinc-500 mt-2">JPG, PNG, or WebP up to 5MB.</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
