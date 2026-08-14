"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface StepperProps {
  activeStep: 1 | 2 | 3;
}

export default function Stepper({ activeStep }: StepperProps) {
  const router = useRouter();

  const steps = [
    {
      num: 1,
      label: "Basic Details",
      sublabel: "STEP 01",
      href: "/quote",
    },
    {
      num: 2,
      label: "Vehicle & Coverage Details",
      sublabel: "STEP 02",
      href: "/quote/vehicle",
    },
    {
      num: 3,
      label: "History",
      sublabel: "STEP 03",
      href: "/quote/history",
    },
  ];

  return (
    <div className="w-full flex items-center justify-between bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] px-6 py-5 sm:px-8 select-none max-sm:hidden">
      <div className="w-full flex items-center gap-4 sm:gap-6">
        {steps.map((step, idx) => {
          const isActive = activeStep >= step.num;

          return (
            <React.Fragment key={step.num}>
              {/* Stepper Node */}
              <button
                type="button"
                onClick={() => router.push(step.href)}
                className="flex items-center gap-3 shrink-0 text-left transition hover:text-brand-indigo"
              >
                {/* Node Box */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-extrabold text-sm transition-all duration-300 ${
                    isActive
                      ? "bg-brand-indigo text-white shadow-sm shadow-brand-indigo/10"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step.num}
                </div>
                {/* Node Text Description */}
                <div className="leading-tight">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {step.sublabel}
                  </span>
                  <span
                    className={`block text-xs sm:text-sm font-black tracking-tight mt-0.5 ${
                      isActive ? "text-brand-indigo" : "text-slate-450"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </button>

              {/* Connecting Line (omit after last item) */}
              {idx < steps.length - 1 && (
                <div className="flex-1 min-w-5 h-0.5 bg-slate-100 hidden md:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
