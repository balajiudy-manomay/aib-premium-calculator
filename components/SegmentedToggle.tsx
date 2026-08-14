import React from 'react';

export interface ToggleOption<T extends string | number> {
  label: string;
  value: T;
}

interface SegmentedToggleProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: ToggleOption<T>[];
  disabled?: boolean;
  name?: string;
  hasError?: boolean;
}

export default function SegmentedToggle<T extends string | number>({
  value,
  onChange,
  options,
  disabled = false,
  name,
  hasError = false,
}: SegmentedToggleProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={`inline-flex w-fit !w-fit p-1 bg-slate-100 rounded-xl border select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${hasError ? 'border-red-400 bg-red-50 ring-1 ring-red-400/20' : 'border-slate-200/50'}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => !disabled && onChange(option.value)}
            className={`px-5 py-1.5 text-xs font-black transition-all duration-250 uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 ${isSelected
                ? 'bg-brand-indigo text-white rounded-lg shadow-sm'
                : 'text-brand-slate hover:text-brand-charcoal bg-transparent hover:bg-slate-200/30 rounded-lg'
              } ${disabled ? 'pointer-events-none' : 'cursor-pointer'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
