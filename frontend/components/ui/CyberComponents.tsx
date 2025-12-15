'use client';
/**
 * Cyber UI Components - shadcn-compatible
 * ========================================
 * Bloomberg Terminal 2077 Aesthetic
 */
import React, { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

// Utility function
export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

// ============================================================
// CYBER CARD - Glassmorphism container
// ============================================================
const cardVariants = cva(
    'backdrop-blur-2xl border rounded-2xl p-6',
    {
        variants: {
            variant: {
                default: 'bg-black/40 border-white/10',
                elevated: 'bg-black/50 border-white/15 shadow-2xl shadow-black/50',
                glow: 'bg-black/40 border-violet-500/30 shadow-[0_0_40px_-10px_rgba(124,58,237,0.3)]',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

interface CyberCardProps extends VariantProps<typeof cardVariants> {
    children: React.ReactNode;
    className?: string;
}

export function CyberCard({ children, className, variant }: CyberCardProps) {
    return (
        <div className={cn(cardVariants({ variant }), className)}>
            {children}
        </div>
    );
}

// ============================================================
// CYBER INPUT - Underline style with animated focus
// ============================================================
interface CyberInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
    ({ className, label, error, icon, ...props }, ref) => {
        return (
            <div className="relative group">
                {label && (
                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest font-mono">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            'w-full bg-transparent border-0 border-b-2 border-white/20 rounded-none',
                            'py-3 text-white placeholder-gray-600 font-mono',
                            'transition-all duration-300 ease-out',
                            'focus:outline-none focus:border-violet-500',
                            'focus:shadow-[0_4px_15px_-3px_rgba(139,92,246,0.5)]',
                            'hover:border-white/30',
                            icon ? 'pl-7' : '',
                            error && 'border-red-500 focus:border-red-500',
                            className
                        )}
                        {...props}
                    />
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-violet-500 to-cyan-400 group-focus-within:w-full transition-all duration-500" />
                </div>
                {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </div>
        );
    }
);
CyberInput.displayName = 'CyberInput';

// ============================================================
// CYBER SELECT - Styled select wrapper
// ============================================================
interface CyberSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
}

export const CyberSelect = forwardRef<HTMLSelectElement, CyberSelectProps>(
    ({ className, label, options, ...props }, ref) => {
        return (
            <div className="relative group">
                {label && (
                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest font-mono">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={cn(
                            'w-full bg-transparent border-0 border-b-2 border-white/20 rounded-none',
                            'py-3 text-white font-mono appearance-none cursor-pointer',
                            'transition-all duration-300 ease-out',
                            'focus:outline-none focus:border-violet-500',
                            'focus:shadow-[0_4px_15px_-3px_rgba(139,92,246,0.5)]',
                            'hover:border-white/30',
                            className
                        )}
                        {...props}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value} className="bg-gray-900 text-white">
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-focus-within:text-violet-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-violet-500 to-cyan-400 group-focus-within:w-full transition-all duration-500" />
                </div>
            </div>
        );
    }
);
CyberSelect.displayName = 'CyberSelect';

// ============================================================
// CYBER BUTTON - Holographic button
// ============================================================
const buttonVariants = cva(
    'relative inline-flex items-center justify-center gap-2 font-semibold backdrop-blur-sm border rounded-xl transition-all duration-300 ease-out overflow-hidden',
    {
        variants: {
            variant: {
                primary: 'bg-violet-600/80 text-white border-violet-400/40 hover:bg-violet-500/90 hover:border-violet-400/60 hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]',
                secondary: 'bg-transparent text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/10 hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]',
                ghost: 'bg-transparent text-gray-400 border-white/10 hover:text-white hover:bg-white/5 hover:border-white/20',
                danger: 'bg-red-600/80 text-white border-red-400/40 hover:bg-red-500/90 hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]',
            },
            size: {
                sm: 'px-4 py-2 text-sm',
                md: 'px-6 py-3 text-sm',
                lg: 'px-8 py-4 text-base',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
);

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    loading?: boolean;
    glow?: boolean;
}

export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
    ({ className, variant, size, loading, glow, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    buttonVariants({ variant, size }),
                    glow && 'animate-pulse',
                    (disabled || loading) && 'opacity-50 cursor-not-allowed',
                    className
                )}
                {...props}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        children
                    )}
                </span>
            </button>
        );
    }
);
CyberButton.displayName = 'CyberButton';

// ============================================================
// CYBER LABEL - Tech mono label
// ============================================================
interface CyberLabelProps {
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}

export function CyberLabel({ children, icon, className }: CyberLabelProps) {
    return (
        <div className={cn('flex items-center gap-2 mb-4', className)}>
            {icon && <span className="text-violet-400">{icon}</span>}
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest font-mono">
                {children}
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-3" />
        </div>
    );
}

// ============================================================
// CYBER TEXTAREA - Code editor style
// ============================================================
interface CyberTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const CyberTextarea = forwardRef<HTMLTextAreaElement, CyberTextareaProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="relative group">
                {label && (
                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest font-mono">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={cn(
                        'w-full bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl',
                        'p-4 text-gray-200 placeholder-gray-600',
                        'font-mono text-sm leading-relaxed',
                        'transition-all duration-300 ease-out resize-none',
                        'focus:outline-none focus:border-violet-500/50',
                        'focus:shadow-[0_0_25px_-5px_rgba(139,92,246,0.4)]',
                        'hover:border-white/20',
                        error && 'border-red-500/50 focus:border-red-500',
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </div>
        );
    }
);
CyberTextarea.displayName = 'CyberTextarea';
