"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, User, Briefcase } from 'lucide-react';
import logoImg from '../public/cropped-AIB-GKFG-1-01.webp';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from './ui/dialog';
import { Button } from './ui/button';

interface HeaderProps {
  onStartFresh?: () => void;
  quoteIssuedBy?: string;
  onChangeIssuedBy?: (name: string) => void;
  quoteJobTitle?: string;
  onChangeJobTitle?: (title: string) => void;
}

export default function Header({
  onStartFresh,
  quoteIssuedBy,
  onChangeIssuedBy,
  quoteJobTitle,
  onChangeJobTitle
}: HeaderProps) {
  const router = useRouter();
  const [tempName, setTempName] = useState(quoteIssuedBy || '');
  const [tempJobTitle, setTempJobTitle] = useState(quoteJobTitle || '');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (dialogOpen) {
      setTempName(quoteIssuedBy || '');
      setTempJobTitle(quoteJobTitle || '');
    }
  }, [dialogOpen, quoteIssuedBy, quoteJobTitle]);

  const handleLogoClick = () => {
    router.push('/quote');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeIssuedBy?.(tempName);
    onChangeJobTitle?.(tempJobTitle);
    setDialogOpen(false);
  };

  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] sticky top-0 z-50 select-none no-print print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">

        {/* Left Side: Allied Insurance Brokers Corporate Brand Identity */}
        <div
          className="flex items-center gap-3 cursor-pointer shrink-0 transition-transform duration-200 hover:scale-102 active:scale-98"
          onClick={handleLogoClick}
          title="Go to main form page"
        >
          <Image
            src={logoImg}
            alt="Allied Insurance Brokers"
            className="h-10 sm:h-12 w-[97px] sm:w-[116px] object-contain"
            priority
          />
        </div>

        {/* Right Side: Actions Container */}
        <div className="flex items-center gap-4 ml-auto min-w-0">
          {/* Quote Issued By / Representative modal trigger */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex flex-col items-start bg-transparent transition-all duration-200 rounded-xl px-3.5 py-1.5 max-w-xs cursor-pointer group text-left"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap select-none shrink-0 flex items-center gap-1 mb-0.5">
                  <User className="w-3 h-3" />
                  Quote Issued by
                </span>
                <div className="flex flex-col items-start min-w-[120px] w-full pl-3">
                  <div className="flex items-center gap-1.5 w-full">
                    <span className="text-xs font-black text-slate-800 truncate max-w-[180px]">
                      {quoteIssuedBy || "Set Representative"}
                    </span>
                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity duration-150 ml-auto" />
                  </div>
                  {quoteJobTitle && (
                    <span className="text-[10px] text-slate-450 font-extrabold truncate max-w-[150px] leading-none mt-0.5">
                      {quoteJobTitle}
                    </span>
                  )}
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[400px] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <form onSubmit={handleSave} className="space-y-4">
                <DialogHeader className="flex flex-col gap-1.5 text-start">
                  <DialogTitle className="text-lg font-extrabold text-slate-900 tracking-tight">Quote Issued By</DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 font-medium">
                    Enter the details of the representative issuing this quote. These will appear on the final breakdown.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <label htmlFor="rep-name" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" /> Representative Name
                    </label>
                    <input
                      id="rep-name"
                      type="text"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 font-medium text-slate-800"
                      placeholder="e.g. Alexander Thorne"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="rep-title" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> Job Title
                    </label>
                    <input
                      id="rep-title"
                      type="text"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 font-medium text-slate-800"
                      placeholder="e.g. Account Executive"
                      value={tempJobTitle}
                      onChange={(e) => setTempJobTitle(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter className="mt-4 flex gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="flex-1 rounded-xl font-bold border-slate-200 hover:bg-slate-50 text-slate-700">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="flex-1 bg-brand-indigo hover:bg-brand-blue text-white rounded-xl font-bold shadow-sm"
                  >
                    Save Details
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
