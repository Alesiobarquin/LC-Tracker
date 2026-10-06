import { preferenceStorage } from "../lib/safeStorage";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FEATURE_SLIDES } from "../data/featuresModalSlides";
import {
  FEATURES_MODAL_STORAGE_KEY,
  FEATURES_MODAL_VERSION,
} from "../constants/featuresModal";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { TraceIndex } from "./ui/StudyTrace";

export interface FeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSlide?: number;
}

export function FeaturesModal({
  isOpen,
  onClose,
  initialSlide = 0,
}: FeaturesModalProps) {
  const navigate = useNavigate();
  const [slideIndex, setSlideIndex] = useState(initialSlide);
  useEffect(() => {
    if (isOpen)
      setSlideIndex(
        Math.min(Math.max(0, initialSlide), FEATURE_SLIDES.length - 1),
      );
  }, [isOpen, initialSlide]);
  const handleDismiss = useCallback(() => {
    preferenceStorage.setItem(
      FEATURES_MODAL_STORAGE_KEY,
      FEATURES_MODAL_VERSION,
    );
    onClose();
  }, [onClose]);
  const slide = FEATURE_SLIDES[slideIndex];
  if (!slide) return null;
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      title="How LC Tracker works"
      size="lg"
    >
      <div className="p-1 sm:p-3">
        <div className="flex items-center gap-3 mb-5">
          <TraceIndex active>
            {String(slideIndex + 1).padStart(2, "0")}
          </TraceIndex>
          <span className="register-label">
            Product tour / {FEATURE_SLIDES.length} sections
          </span>
        </div>
        <h3 className="text-2xl font-medium tracking-[-0.04em]">
          {slide.title}
        </h3>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          {slide.subtitle}
        </p>
        <ul className="my-6 border-t border-line">
          {slide.highlights.map((line) => (
            <li
              key={line}
              className="py-3 border-b border-line text-xs text-body leading-relaxed"
            >
              {line}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-1">
            {FEATURE_SLIDES.map((item, i) => (
              <button
                key={item.id}
                aria-label={`Go to slide ${i + 1} of ${FEATURE_SLIDES.length}`}
                aria-current={i === slideIndex ? "true" : undefined}
                onClick={() => setSlideIndex(i)}
                className={`min-w-8 min-h-9 text-[10px] font-mono rounded-sm ${i === slideIndex ? "bg-muted-surface text-foreground" : "text-subtle hover:text-foreground"}`}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              aria-label="Previous slide"
              disabled={slideIndex === 0}
              onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              size="sm"
              aria-label="Next slide"
              disabled={slideIndex === FEATURE_SLIDES.length - 1}
              onClick={() =>
                setSlideIndex((i) => Math.min(FEATURE_SLIDES.length - 1, i + 1))
              }
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-5 mt-5">
          {slide.tabId ? (
            <button
              className="quiet-action"
              onClick={() => {
                navigate(`/${slide.tabId}`);
                handleDismiss();
              }}
            >
              Open in app <ArrowUpRight size={14} />
            </button>
          ) : (
            <span />
          )}
          <Button variant="primary" onClick={handleDismiss}>
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
}
