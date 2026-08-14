"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { QuickQuoteState, BasicDetails, VehicleDetails, CoverageDetails, HistoryDetails } from '../types';
import { DEFAULT_QUOTE_STATE } from '../data';

interface QuoteContextType {
  quoteState: QuickQuoteState;
  quoteIssuedBy: string;
  quoteJobTitle: string;
  onChangeIssuedBy: (name: string) => void;
  onChangeJobTitle: (title: string) => void;
  onChangeBasic: (changed: Partial<BasicDetails>) => void;
  onChangeVehicle: (changed: Partial<VehicleDetails>) => void;
  onChangeCoverage: (changed: Partial<CoverageDetails>) => void;
  onChangeHistory: (changed: Partial<HistoryDetails>) => void;
  onStartFresh: () => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Load state from sessionStorage on client-side mount
  const [quoteState, setQuoteState] = useState<QuickQuoteState>(DEFAULT_QUOTE_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [quoteIssuedBy, setQuoteIssuedBy] = useState<string>('');
  const [quoteJobTitle, setQuoteJobTitle] = useState<string>('');

  const onChangeIssuedBy = useCallback((name: string) => {
    setQuoteIssuedBy(name);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aib_quick_quote_issued_by', name);
    }
  }, []);

  const onChangeJobTitle = useCallback((title: string) => {
    setQuoteJobTitle(title);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aib_quick_quote_job_title', title);
    }
  }, []);

  useEffect(() => {
    let isReload = false;
    
    // Check if the current page load is a refresh
    if (typeof window !== 'undefined' && window.performance) {
      const navEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0 && navEntries[0].type === 'reload') {
        isReload = true;
      } else if (window.performance.navigation && window.performance.navigation.type === 1) {
        // Fallback for older browsers
        isReload = true;
      }
    }

    if (isReload) {
      // If refreshed, clear the state memory
      sessionStorage.removeItem('aib_quick_quote_state');
      sessionStorage.removeItem('aib_quick_quote_issued_by');
      sessionStorage.removeItem('aib_quick_quote_job_title');
      setQuoteState(DEFAULT_QUOTE_STATE);
      setQuoteIssuedBy('');
      setQuoteJobTitle('');
      
      // If they refreshed on a page other than the form, redirect them back to the form
      if (window.location.pathname !== '/quote') {
        router.push('/quote');
      }
    } else {
      // Normal load: retrieve saved state if exists
      const saved = sessionStorage.getItem('aib_quick_quote_state');
      if (saved) {
        try {
          setQuoteState(JSON.parse(saved));
        } catch (e) {
          // fallback to default
        }
      }
      const savedIssuedBy = sessionStorage.getItem('aib_quick_quote_issued_by');
      if (savedIssuedBy) {
        setQuoteIssuedBy(savedIssuedBy);
      }
      const savedJobTitle = sessionStorage.getItem('aib_quick_quote_job_title');
      if (savedJobTitle) {
        setQuoteJobTitle(savedJobTitle);
      }
    }
    
    setIsLoaded(true);
  }, [router]);

  // Trigger cache persist
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem('aib_quick_quote_state', JSON.stringify(quoteState));
    }
  }, [quoteState, isLoaded]);

  // Alert user on reload/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't show warning if the user hasn't filled anything yet
      const currentNoId = { ...quoteState, quoteId: '' };
      const defaultNoId = { ...DEFAULT_QUOTE_STATE, quoteId: '' };
      const isDirty = JSON.stringify(currentNoId) !== JSON.stringify(defaultNoId);

      if (!isDirty) {
        return; // Let the browser reload without any warning
      }

      e.preventDefault();
      
      // Customize message based on the screen (Note: Modern browsers typically ignore custom text and show a generic warning)
      let message = "You have an active quote session. Your unsaved parameters might be lost.";
      if (pathname === '/quote') {
        message = "If you refresh, your session memory will be cleared and you will need to refill the form.";
      } else if (pathname === '/quote/summary' || pathname === '/quote/results') {
        message = "Refreshing this page will clear your form and you will be redirected to the start.";
      }
      
      e.returnValue = message;
      return message;
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname, quoteState]);

  const onChangeBasic = useCallback((changed: Partial<BasicDetails>) => {
    setQuoteState(prev => ({
      ...prev,
      basic: { ...prev.basic, ...changed }
    }));
  }, []);

  const onChangeVehicle = useCallback((changed: Partial<VehicleDetails>) => {
    setQuoteState(prev => ({
      ...prev,
      vehicle: { ...prev.vehicle, ...changed }
    }));
  }, []);

  const onChangeCoverage = useCallback((changed: Partial<CoverageDetails>) => {
    setQuoteState(prev => ({
      ...prev,
      coverage: { ...prev.coverage, ...changed }
    }));
  }, []);

  const onChangeHistory = useCallback((changed: Partial<HistoryDetails>) => {
    setQuoteState(prev => ({
      ...prev,
      history: { ...prev.history, ...changed }
    }));
  }, []);

  const onStartFresh = () => {
    const fresh: QuickQuoteState = {
      quoteId: `QQ-${Date.now()}`,
      basic: {
        fullName: '',
        gender: '',
        dob: '',
        trn: '',
        occupation: '',
        livingWorkingIn: '',
        employer: '',
        blockBuildingName: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        address: '',
        email: '',
        telephoneHome: '',
        telephoneWork: '',
        telephoneMobile: '',
      },
      vehicle: {
        vehicleType: '',
        year: '',
        value: '',
        makeModel: '',
        isHighPerformance: '',
        valuationCompleted: '',
        cc: '',
        use: '',
        vehicleAdded: '',
        chassisNumber: '',
      },
      coverage: {
        typeOfBusiness: '',
        existingPolicyYear: '',
        insuranceProduct: '',
        coverType: '',
        sumInsured: '',
        includeTheftProtection: '',
        thirdPartyAddon: '',
      },
      history: {
        licenseIssueDate: '',
        firstTimeInsured: '',
        previousInsurerCarrier: '',
        hasNoClaimBonus: '',
        ncbYears: '',
        ncbPercent: '',
        ncbAmount: '',
        hasAccidentHistory: '',
        mainDriverGender: '',
        additionalDrivers: '',
        manualLoadPercentage: '',
      },
    };
    setQuoteState(fresh);
    setQuoteIssuedBy('');
    setQuoteJobTitle('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('aib_quick_quote_issued_by');
      sessionStorage.removeItem('aib_quick_quote_job_title');
    }
    router.push('/quote');
  };

  return (
    <QuoteContext.Provider
      value={{
        quoteState,
        quoteIssuedBy,
        quoteJobTitle,
        onChangeIssuedBy,
        onChangeJobTitle,
        onChangeBasic,
        onChangeVehicle,
        onChangeCoverage,
        onChangeHistory,
        onStartFresh,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
}
