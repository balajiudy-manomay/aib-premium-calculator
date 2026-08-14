const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../components');
const files = ['BasicDetailsForm.tsx', 'VehicleCoverageForm.tsx', 'HistoryDetailsForm.tsx', 'ConsolidatedQuoteForm.tsx'];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Look for <Select and its value prop
  // This regex matches <Select ... value={state...} ...>
  // Actually, simpler: replace `value={state.foo}` with `value={state.foo || undefined}` 
  // only if it's right after <Select
  
  // Let's just use string replacement for known fields
  const fields = [
    'state.basic.occupation',
    'state.basic.livingWorkingIn',
    'state.vehicle.vehicleType',
    'state.vehicle.year?.toString()',
    'state.vehicle.use',
    'state.vehicle.vehicleAdded',
    'state.coverage.typeOfBusiness',
    'state.coverage.existingPolicyYear',
    'state.coverage.insuranceProduct',
    'state.coverage.coverType',
    'state.history.previousInsurerCarrier',
    'state.history.ncbYears',
    'state.history.ncbPercent?.toString()',
    'state.history.additionalDrivers'
  ];

  fields.forEach(field => {
    // Escape ? and .
    const escapedField = field.replace(/\./g, '\\.').replace(/\?/g, '\\?');
    const regex = new RegExp(`value=\\{${escapedField}\\}`, 'g');
    content = content.replace(regex, `value={${field} || undefined}`);
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
