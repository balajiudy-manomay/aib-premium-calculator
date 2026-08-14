"use client";

import { useQuote } from '@/context/QuoteContext';
import VehicleCoverageForm from '@/components/VehicleCoverageForm';

export default function VehicleCoveragePage() {
  const { quoteState, onChangeVehicle, onChangeCoverage } = useQuote();

  return (
    <VehicleCoverageForm
      state={quoteState}
      onChangeVehicle={onChangeVehicle}
      onChangeCoverage={onChangeCoverage}
    />
  );
}
