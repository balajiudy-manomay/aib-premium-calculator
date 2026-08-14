"use client";

import React, { useState } from "react";
import { Send, FileText, FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, message: string) => Promise<void>;
  defaultTo: string;
  pdfName: string;
  excelName: string;
}

export default function EmailModal({
  isOpen,
  onClose,
  onSend,
  defaultTo,
  pdfName,
  excelName,
}: EmailModalProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(`Your AIB Quote Details - ${pdfName.split("_").pop()?.replace(".pdf", "") || "Summary"}`);
  const [message, setMessage] = useState(
    "Hi there,\n\nPlease find attached the requested quote summary and breakdown from Allied Insurance Brokers.\n\nThank you for choosing AIB!"
  );
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(to, subject, message);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSending && !success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg w-full p-0 overflow-hidden bg-white rounded-3xl gap-0 border-none shadow-2xl [&>button]:top-4 [&>button]:right-6 [&>button]:text-slate-400 hover:[&>button]:text-slate-600 [&>button]:bg-slate-100 [&>button]:w-8 [&>button]:h-8 [&>button]:rounded-full [&>button]:flex [&>button]:items-center [&>button]:justify-center hover:[&>button]:bg-slate-200">
        
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-black text-brand-indigo m-0">Send via Email</DialogTitle>
        </DialogHeader>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800">Email Sent!</h3>
              <p className="text-sm font-semibold text-slate-500 text-center">
                The documents have been successfully dispatched to {to}.
              </p>
            </div>
          ) : (
            <>
              {/* To Field */}
              <div>
                <label className="block text-[10px] font-black text-brand-slate tracking-wider uppercase mb-1.5">
                  To
                </label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition"
                  placeholder="customer@example.com"
                />
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-[10px] font-black text-brand-slate tracking-wider uppercase mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition"
                />
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-[10px] font-black text-brand-slate tracking-wider uppercase mb-1.5">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition resize-none"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-[10px] font-black text-brand-slate tracking-wider uppercase mb-2">
                  Attachments (Generated Automatically)
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                    <FileText className="w-5 h-5 text-red-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate flex-1 min-w-0">
                      {pdfName}
                    </span>
                    <span className="text-[10px] font-black text-slate-400">PDF</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                    <FileSpreadsheet className="w-5 h-5 text-green-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate flex-1 min-w-0">
                      {excelName}
                    </span>
                    <span className="text-[10px] font-black text-slate-400">XLSX</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
            <button
              onClick={onClose}
              disabled={isSending}
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !to}
              className="px-6 py-2.5 bg-brand-blue hover:bg-brand-indigo text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
