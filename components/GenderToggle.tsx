"use client";

import clsx from "clsx";
import { Mars, Venus } from "lucide-react";

const DEFAULT_GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
] as const;

type Option<T extends string> = {
  label: string;
  value: T;
};

type GenderToggleProps<
  T extends string = (typeof DEFAULT_GENDER_OPTIONS)[number]["value"],
> = {
  value: T;
  onChange: (value: T) => void;
  options?: Option<T>[];
  disabled?: boolean;
  className?: string;
  name?: string;
  hasError?: boolean;
};

export default function GenderToggle<
  T extends string = (typeof DEFAULT_GENDER_OPTIONS)[number]["value"],
>({
  value,
  onChange,
  options = DEFAULT_GENDER_OPTIONS as unknown as Option<T>[],
  disabled = false,
  className,
  name = "gender",
  hasError = false,
}: GenderToggleProps<T>) {
  return (
    <div className={clsx("grid grid-cols-2 gap-3 w-full mt-2", className)}>
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <label
            key={option.value}
            className={clsx(
              "relative cursor-pointer rounded-xl border px-4 h-10 transition-all duration-200",
              "flex items-center justify-center text-sm font-semibold select-none",
              isSelected
                ? "border-brand-blue bg-blue-50/30 text-brand-blue ring-1 ring-brand-blue/20"
                : hasError
                  ? "border-red-400 bg-red-50 text-red-700 hover:border-red-500 ring-1 ring-red-400/20"
                  : "border-slate-200 bg-slate-50 text-brand-slate hover:border-slate-300 hover:text-brand-charcoal",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />

            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  "flex items-center justify-center rounded-full border p-1 transition-all w-7 h-7",
                  isSelected
                    ? "border-brand-blue bg-blue-100/50 text-brand-blue"
                    : "border-slate-200 bg-white text-brand-slate",
                )}
              >
                {option.value === "Male" ? (
                  <Mars className="w-3.5 h-3.5" />
                ) : option.value === "Female" ? (
                  <Venus className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-black">
                    {option.label.charAt(0)}
                  </span>
                )}
              </div>

              <span>{option.label}</span>
            </div>
          </label>
        );
      })}
    </div>
  );
}
