const path = require('path');

async function testWithSumInsured(sumInsured) {
  const payload = {
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
    vehicleValue: sumInsured, // Set vehicle value to sumInsured
    isHighPerformanceVehicle: "No",
    makeAndModel: "Pequea 8012T",
    valuationDoneWithin6Months: "Yes",
    vehicleUse: "Private Use",
    vehicleAdded: "Under 3 months",
    motorcycleCC: 1600,
    typeOfBusiness: "New Business",
    product: "Private Car",
    typeOfCover: "Comprehensive",
    sumInsured: sumInsured,
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
  };

  const res = await fetch("http://localhost:3000/api/excel/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  return data.outputs;
}

async function main() {
  console.log("Testing calculations with Sum Insured = 2,000,000...");
  const res1 = await testWithSumInsured(2000000);
  console.log("GK Premium for 2M:", res1?.premiumComparison?.graceKennedy);
  console.log("Key Premium for 2M:", res1?.premiumComparison?.keyInsurance);
  console.log("Best Price Premium for 2M:", res1?.bestPrice?.premium);

  console.log("\nTesting calculations with Sum Insured = 5,000,000...");
  const res2 = await testWithSumInsured(5000000);
  console.log("GK Premium for 5M:", res2?.premiumComparison?.graceKennedy);
  console.log("Key Premium for 5M:", res2?.premiumComparison?.keyInsurance);
  console.log("Best Price Premium for 5M:", res2?.bestPrice?.premium);
}

main().catch(console.error);
