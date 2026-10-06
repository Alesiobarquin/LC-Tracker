import React from 'react';
import { cn } from '../../utils/cn';

const fieldBase =
  'w-full bg-canvas border border-line rounded-xl px-4 py-3 text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, className)} {...props} />
  )
);
Input.displayName = 'Input';

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, 'resize-none', className)} {...props} />
  )
);
TextArea.displayName = 'TextArea';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(fieldBase, 'appearance-none pr-10', className)} {...props} />
  )
);
Select.displayName = 'Select';
