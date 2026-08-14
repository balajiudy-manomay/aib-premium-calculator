const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../components');
const files = ['BasicDetailsForm.tsx', 'VehicleCoverageForm.tsx', 'HistoryDetailsForm.tsx', 'ConsolidatedQuoteForm.tsx'];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Fix SelectTrigger
  // Match <Select value={state.basic.occupation || undefined} ... > \n <SelectTrigger>
  content = content.replace(
    /<Select[\s\S]*?value=\{state\.(?:basic|vehicle|coverage|history)\.([a-zA-Z0-9_]+)(?:\?\.[^\}]+)?\s*(?:\|\|\s*undefined)?\}[\s\S]*?<SelectTrigger(?: className="([^"]*)")?>/g,
    (match, fieldName, existingClass) => {
      const baseClass = existingClass || "";
      // If already has dynamic class, skip
      if (match.includes('errors.')) return match;
      
      const newClassStr = `className={errors.${fieldName} ? "border-red-400 focus:ring-red-400/20 ${baseClass}" : "${baseClass || "border-slate-200"}"}`;
      
      // Replace the <SelectTrigger ...> part of the match
      return match.replace(/<SelectTrigger(?: className="[^"]*")?>/, `<SelectTrigger ${newClassStr}>`);
    }
  );

  // 2. Fix SegmentedToggle
  content = content.replace(
    /<SegmentedToggle[\s\S]*?value=\{state\.(?:basic|vehicle|coverage|history)\.([a-zA-Z0-9_]+)\}[\s\S]*?(?:name="[^"]*")?\s*\/>/g,
    (match, fieldName) => {
      if (match.includes('hasError')) return match;
      return match.replace(/\/>$/, ` hasError={!!errors.${fieldName}}\n              />`);
    }
  );

  // 3. Fix GenderToggle
  content = content.replace(
    /<GenderToggle[\s\S]*?value=\{state\.(?:basic|vehicle|coverage|history)\.([a-zA-Z0-9_]+)\}[\s\S]*?\/>/g,
    (match, fieldName) => {
      if (match.includes('hasError')) return match;
      return match.replace(/\/>$/, ` hasError={!!errors.${fieldName}}\n            />`);
    }
  );

  // 4. Fix DatePicker
  content = content.replace(
    /<DatePicker[\s\S]*?value=\{state\.(?:basic|vehicle|coverage|history)\.([a-zA-Z0-9_]+)\}[\s\S]*?\/>/g,
    (match, fieldName) => {
      if (match.includes('hasError')) return match;
      return match.replace(/\/>$/, ` hasError={!!errors.${fieldName}}\n            />`);
    }
  );

  // 5. Fix ComboboxInput
  content = content.replace(
    /<ComboboxInput[\s\S]*?(?:className="([^"]*)")?\s*\/>/g,
    (match, existingClass) => {
      if (match.includes('errors.')) return match;
      // Combobox is only used for makeModel, so we can hardcode errors.makeModel
      const baseClass = existingClass || "";
      const newClassStr = `className={errors.makeModel ? "border-red-400 focus:ring-red-400/20 ${baseClass}" : "${baseClass}"}`;
      if(match.includes('className=')) {
          return match.replace(/className="[^"]*"/, newClassStr);
      } else {
          return match.replace(/\/>$/, ` ${newClassStr} />`);
      }
    }
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
