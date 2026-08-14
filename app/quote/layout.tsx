"use client";

import React from 'react';
import { QuoteProvider, useQuote } from '@/context/QuoteContext';
import Header from '@/components/Header';

function QuoteLayoutContent({ children }: { children: React.ReactNode }) {
  const { onStartFresh, quoteIssuedBy, quoteJobTitle, onChangeIssuedBy, onChangeJobTitle } = useQuote();

  return (
    <div id="aib-main-layout" className="bg-brand-light min-h-screen text-brand-charcoal font-sans antialiased flex flex-col">
      {/* 1. Header with start fresh action */}
      <Header 
        onStartFresh={onStartFresh} 
        quoteIssuedBy={quoteIssuedBy} 
        onChangeIssuedBy={onChangeIssuedBy} 
        quoteJobTitle={quoteJobTitle}
        onChangeJobTitle={onChangeJobTitle}
      />

      <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6 animate-fade-in">
        <div id="active-calculator-workflow" className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuoteProvider>
      <QuoteLayoutContent>{children}</QuoteLayoutContent>
    </QuoteProvider>
  );
}
