import React, { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
}) => {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay data-dialog-backdrop className="fixed inset-0 z-[100] bg-black/50" />
        <Dialog.Content
          {...(!description && { 'aria-describedby': undefined })}
          onOpenAutoFocus={() => {
            const active = document.activeElement;
            previouslyFocused.current = active instanceof HTMLElement ? active : null;
          }}
          onCloseAutoFocus={event => {
            event.preventDefault();
            previouslyFocused.current?.focus({ preventScroll: true });
          }}
          className={cn(
            'ui-dialog fixed left-1/2 top-1/2 z-[101] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-line bg-surface',
            sizeClasses[size],
            className
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line bg-canvas/50 px-5 py-4">
            <div className="min-w-0 space-y-1">
              <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
              {description && <Dialog.Description className="text-sm text-muted">{description}</Dialog.Description>}
            </div>
            <Dialog.Close
              aria-label="Close dialog"
              className="p-2 rounded-md text-muted hover:text-foreground hover:bg-muted-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X size={18} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain p-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
