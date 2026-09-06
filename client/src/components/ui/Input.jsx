import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  isCurrency = false,
  currencyPrefix = 'Rp',
  isMonospace = false,
  containerClassName = '',
  className = '',
  required = false,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-[11px] font-semibold text-slate-600 tracking-wider uppercase flex items-center justify-between">
          <span>{label} {required && <span className="text-rose-500">*</span>}</span>
        </label>
      )}
      <div className="relative flex items-center">
        {isCurrency && (
          <div className="absolute left-0 inset-y-0 flex items-center justify-center px-3 bg-slate-100 border-r border-slate-300 rounded-l-md text-xs font-semibold text-slate-600 select-none">
            {currencyPrefix}
          </div>
        )}
        <input
          ref={ref}
          className={`h-9 w-full text-sm bg-white border rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition font-sans ${
            isCurrency ? 'pl-14 pr-3 text-right tabular-nums font-mono' : isMonospace ? 'px-3 font-mono text-xs' : 'px-3'
          } ${error ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300'} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-[11px] text-rose-600 font-medium">{error}</span>}
      {helperText && !error && <span className="text-[11px] text-slate-400">{helperText}</span>}
    </div>
  );
});

export const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  containerClassName = '',
  className = '',
  required = false,
  children,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-[11px] font-semibold text-slate-600 tracking-wider uppercase">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`h-9 px-3 text-sm bg-white border rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition font-sans ${
          error ? 'border-rose-500' : 'border-slate-300'
        } ${className}`}
        {...props}
      >
        {children || options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-[11px] text-rose-600 font-medium">{error}</span>}
      {helperText && !error && <span className="text-[11px] text-slate-400">{helperText}</span>}
    </div>
  );
});
