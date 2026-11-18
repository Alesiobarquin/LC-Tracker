import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useRegisterCoachTools } from '../coach/commands';
import { X, Send, AlertCircle, CheckCircle2, ImagePlus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '@clerk/react';
import { safeUUID } from '../utils/uuid';

interface FeedbackModalProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onOpen, onClose }: FeedbackModalProps) {
  const { user } = useUser();
  const [type, setType] = useState('feature_request');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'success' | string>('idle');
  const [sentFeedback, setSentFeedback] = useState(false);
  useEffect(() => {
    setMessage('');
    setImageFile(null);
    setImagePreview(null);
    setStatus('idle');
    setSentFeedback(false);
  }, [user?.id]);
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  useRegisterCoachTools(user && (isOpen || onOpen) ? {
    feedback_draft: {
      description: 'Open the native feedback form with optional type (feature_request/bug/general) and message (the requested draft). The user chooses attachments and explicitly presses Send Feedback.',
      run: (args) => {
        const parsed = z.strictObject({
          type: z.enum(['feature_request', 'bug', 'general']).optional(),
          message: z.string().trim().min(1).max(4000).optional(),
        }).safeParse(args);
        if (!parsed.success || submitting.current || status === 'success') {
          return { message: 'The feedback draft cannot be changed right now.' };
        }
        if (parsed.data.type) setType(parsed.data.type);
        if (parsed.data.message) setMessage(parsed.data.message);
        if (!isOpen) onOpen?.();
        return { message: 'Feedback form opened. Review the draft, choose an optional image, and press Send Feedback there.' };
      },
    },
    feedback_status: {
      kind: 'read',
      description: 'Read feedback draft and delivery state without message text or attachment contents.',
      run: () => ({
        message: status === 'success' || (sentFeedback && !isOpen) ? 'Feedback sent.' : isOpen ? 'The feedback form is open.' : 'The feedback form is closed.',
        data: { type, hasDraft: Boolean(message.trim()), hasImage: Boolean(imageFile), isSubmitting, lastSendConfirmed: sentFeedback, failed: status.includes('Failed') },
      }),
    },
    ...(isOpen && !imageFile ? {
      feedback_attach_image: {
        description: 'Open the native image picker for the current feedback draft. Takes no arguments.',
        run: (args: Record<string, unknown>) => {
          if (Object.keys(args).length || submitting.current) return { message: 'This image picker is unavailable.' };
          if (navigator.userActivation?.isActive) {
            imageInput.current?.click();
            return { message: 'Select an image in the browser picker.' };
          }
          return { message: 'Select Image in the feedback form to choose an attachment.' };
        },
      },
    } : {}),
  } : {});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setStatus('Please sign in to send feedback.');
      return;
    }
    if (!message.trim() || submitting.current || status === 'success') return;

    submitting.current = true;
    setSentFeedback(false);
    setIsSubmitting(true);
    setStatus('idle');

    try {
      let imageUrl = null;

      if (imageFile) {
        setStatus('Uploading image...');
        const fileExt = imageFile.name.split('.').pop() || 'png';
        const fileName = `${safeUUID()}.${fileExt}`;
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
      setSentFeedback(true);
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
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        className="bg-surface border border-line rounded-md w-full max-w-md overflow-hidden ui-dialog animate-in fade-in duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-line bg-canvas/50">
          <h2 id="feedback-modal-title" className="text-lg font-semibold text-foreground">Share Feedback</h2>
          <button
            onClick={onClose}
            aria-label="Close feedback modal"
            className="p-1 text-muted hover:text-foreground hover:bg-muted-surface rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {status === 'success' && (
            <div className="flex items-center gap-2 p-3 text-accent bg-accent/10 border border-accent/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <p className="font-medium text-sm">Feedback sent successfully!</p>
            </div>
          )}

          {status !== 'idle' && status !== 'success' && (
            <div className="flex items-center gap-2 p-3 text-danger bg-danger/10 border border-danger/20 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium text-sm break-words">{status}</p>
            </div>
          )}

          {!user && status === 'idle' && (
            <div className="flex items-center gap-2 p-3 text-warning bg-warning/10 border border-warning/20 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium text-sm">Sign in to send feedback.</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="feedback-type" className="text-sm font-medium text-body">Type of Feedback</label>
            <select
              id="feedback-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-canvas border border-line rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="feature_request">💡 Feature Request</option>
              <option value="bug">🐛 Bug Report</option>
              <option value="general">💬 General Feedback</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="feedback-message" className="text-sm font-medium text-body">Message</label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              className="w-full h-32 bg-canvas border border-line rounded-lg px-4 py-3 text-foreground placeholder-subtle focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-body">Attach Screenshot (Optional)</span>
            {imagePreview ? (
              <div className="relative inline-block mt-2 rounded-lg overflow-hidden border border-line-strong">
                <img src={imagePreview} alt="Preview" className="max-h-32 object-cover" />
                <button
                  type="button"
                  aria-label="Remove attached image"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    URL.revokeObjectURL(imagePreview);
                  }}
                  className="absolute top-1 right-1 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={imageInput}
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
                  className="flex items-center gap-2 px-4 py-2 bg-muted-surface hover:bg-hover-surface text-body rounded-lg cursor-pointer transition-colors text-sm w-max border border-line-strong mt-1 peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:outline-none"
                >
                  <ImagePlus className="w-4 h-4" aria-hidden="true" />
                  Select Image
                </label>
                <p className="text-xs text-subtle mt-2">JPG, PNG, or WebP up to 5MB.</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status === 'success' || !message.trim() || !user}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-strong disabled:opacity-50 disabled:hover:bg-accent text-on-accent font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
