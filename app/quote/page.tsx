"use client";

import { useQuote } from '@/context/QuoteContext';
import BasicDetailsForm from '@/components/BasicDetailsForm';

export default function BasicDetailsPage() {
  const { quoteState, onChangeBasic } = useQuote();

  return (
    <BasicDetailsForm
      state={quoteState}
      onChangeBasic={onChangeBasic}
    />
  );
}
