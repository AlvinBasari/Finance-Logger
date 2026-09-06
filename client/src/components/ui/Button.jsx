import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-4 py-2 gap-2 shadow-2xs',
    lg: 'text-sm px-5 py-2.5 gap-2.5 shadow-sm',
  };

  const variantStyles = {
    primary: 'bg-corporate-900 hover:bg-corporate-800 active:bg-black text-white border border-transparent shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
    outline: 'bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white border border-transparent',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 border-transparent',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5" />
      ) : null}
      {children}
    </button>
  );
};
