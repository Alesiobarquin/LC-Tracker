import React from 'react';
import { cn } from '../../utils/cn';

const fieldBase =
  'w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-500 transition-colors focus:outline-none focus:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-50';

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
