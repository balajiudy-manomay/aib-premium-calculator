const path = require('path');

async function main() {
  const payload = {
    inputs: {
      fullName: "Alexander Vance",
      gender: "Male",
      dateOfBirth: "1985-10-14",
      trn: "123-456-789",
      occupation: "Engineer",
      livingOrWorkingIn: "Kingston & St. Andrew",
      employer: "AIB",
      address: "123 Main St",
      emailAddress: "alexander.v@curator.corp",
      telephoneHome: "+1 (876) 381-0000",
      telephoneWork: "+1 (876) 381-0000",
      telephoneMobile: "+1 (876) 381-0000",
      vehicleType: "Personal Vehicle",
      vehicleYear: 2024,
      vehicleValue: 4000000,
      isHighPerformanceVehicle: "No",
      makeAndModel: "Pequea 8012T",
      valuationDoneWithin6Months: "Yes",
      vehicleUse: "Private Use",
      vehicleAdded: "Under 3 months",
      motorcycleCC: 1600,
      typeOfBusiness: "New Business",
      product: "Private Car",
      typeOfCover: "Comprehensive",
      sumInsured: 4000000,
      renewalYear: 1,
      tpAddOn: "Not Required",
      includeTheft: "Yes",
      firstIssueDateOfDriversLicence: "2025-01-01",
      firstTimeInsured: "Yes",
      previousInsurer: "None",
      noClaimBonusDiscount: "No",
      noClaimBonusDiscountYear: 0,
      noClaimBonusPercentageEarned: 0,
      accidentOrLossInLastFiveYears: "No",
      paymentsMade: 0,
      mainDriverGender: "Male",
      numberOfDrivers: "Insured only"
    },
    insurer: "keyInsurance"
  };

  console.log("Calling API /api/excel/breakdown for keyInsurance...");
  
  // Since the dev server is running on localhost:3000, let's call it via fetch
  const res = await fetch("http://localhost:3000/api/excel/breakdown", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log("\nAPI Response status:", res.status);
  console.log("API Response success:", data.success);
  console.log("Breakdown values keys and values:");
  console.log(JSON.stringify(data.breakdown, null, 2));
}

main().catch(console.error);
