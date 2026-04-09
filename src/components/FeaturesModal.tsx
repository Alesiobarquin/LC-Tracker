import { useCallback, useEffect, useId, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FEATURE_SLIDES } from '../data/featuresModalSlides';
import { FEATURES_MODAL_STORAGE_KEY, FEATURES_MODAL_VERSION } from '../constants/featuresModal';

export interface FeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When opening programmatically (e.g. sidebar), start at this slide index */
  initialSlide?: number;
}

function persistDismissed() {
  try {
    localStorage.setItem(FEATURES_MODAL_STORAGE_KEY, FEATURES_MODAL_VERSION);
  } catch {
    /* ignore quota / private mode */
  }
}

export function FeaturesModal({ isOpen, onClose, initialSlide = 0 }: FeaturesModalProps) {
  const navigate = useNavigate();
  const titleId = useId();
  const [slideIndex, setSlideIndex] = useState(initialSlide);

  useEffect(() => {
    if (isOpen) {
      setSlideIndex(Math.min(Math.max(0, initialSlide), FEATURE_SLIDES.length - 1));
    }
  }, [isOpen, initialSlide]);

  const slide = FEATURE_SLIDES[slideIndex];
  const total = FEATURE_SLIDES.length;
  const SlideIcon = slide?.icon;

  const handleDismiss = useCallback(() => {
    persistDismissed();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleDismiss]);

  if (!isOpen || !slide) return null;

  const goPrev = () => setSlideIndex((i) => Math.max(0, i - 1));
  const goNext = () => setSlideIndex((i) => Math.min(total - 1, i + 1));

  const jumpToTab = () => {
    if (slide.tabId) {
      navigate(`/${slide.tabId}`);
      handleDismiss();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
      role="presentation"
      onClick={handleDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg sm:max-w-xl max-h-[min(90vh,720px)] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
          <h2 id={titleId} className="text-lg sm:text-xl font-semibold text-white leading-snug pr-2">
            How LC Tracker Works
          </h2>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 -m-1 shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 sm:py-8">
          <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            <div
              className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 mb-5 shadow-[0_0_32px_-8px_rgba(16,185,129,0.35)]"
              aria-hidden
            >
              <SlideIcon className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.75} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-semibold text-zinc-50 tracking-tight mb-2">{slide.title}</h3>
            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-md">{slide.subtitle}</p>
          </div>

          <ul className="space-y-3.5 sm:space-y-4 max-w-md mx-auto text-left">
            {slide.highlights.map((line) => (
              <li key={line} className="flex gap-3 sm:gap-4">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  aria-hidden
                />
                <span className="text-base sm:text-[17px] leading-relaxed text-zinc-200">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 sm:px-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-zinc-800/80 pt-4 shrink-0 bg-zinc-950/40">
          <div className="flex items-center justify-center gap-1.5 order-2 sm:order-1">
            {FEATURE_SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlideIndex(i)}
                className={`h-2 rounded-full transition-all ${i === slideIndex ? 'w-7 bg-emerald-500' : 'w-2 bg-zinc-600 hover:bg-zinc-500'}`}
                aria-label={`Go to slide ${i + 1} of ${total}`}
                aria-current={i === slideIndex ? 'true' : undefined}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 order-1 sm:order-2">
            {slide.tabId && (
              <button
                type="button"
                onClick={jumpToTab}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors"
              >
                Open in app
                <ExternalLink className="w-4 h-4 shrink-0" />
              </button>
            )}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrev}
                disabled={slideIndex === 0}
                className="p-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={slideIndex >= total - 1}
                className="p-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-6 pb-6 sm:pb-7 shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-3.5 sm:py-4 text-base sm:text-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
