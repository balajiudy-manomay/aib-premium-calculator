"use client";

import React, { useState } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { useQuote } from '@/context/QuoteContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ResetFormButton() {
  const { onStartFresh } = useQuote();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleResetConfirm = () => {
    if (onStartFresh) {
      onStartFresh();
    }
    setDialogOpen(false);
  };

  if (!onStartFresh) return null;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 border border-red-200/80 hover:border-red-300 bg-red-50/50 hover:bg-red-50 text-red-600 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition duration-150 active:scale-97 hover:shadow-[0_2px_8px_-3px_rgba(220,38,38,0.1)] no-print print:hidden"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Form</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[400px] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-red-500">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <DialogTitle className="text-lg font-extrabold text-slate-900 tracking-tight">Reset Calculator State?</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-2 font-medium">
              This action will clear all current inputs, client details, and premium calculations. This cannot be undone.
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:flex-1 rounded-xl text-slate-700 font-bold border-slate-200 hover:bg-slate-50">
              Keep Quote
            </Button>
          </DialogClose>
          <Button 
            onClick={handleResetConfirm}
            variant="destructive"
            className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm shadow-red-600/10 hover:shadow-red-600/20"
          >
            Clear & Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
