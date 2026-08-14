import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const isError = className?.includes("border-red-400");
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-brand-charcoal placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        isError && "ring-1 ring-red-400/20 focus:ring-red-400/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
