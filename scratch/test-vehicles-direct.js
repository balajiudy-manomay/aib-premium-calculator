require('dotenv').config();
const { getVehicles } = require('./lib/graph-excel.service');

async function test() {
  try {
    console.log("Calling getVehicles()...");
    const vehicles = await getVehicles();
    console.log("Success! Returned vehicles count:", vehicles.length);
    console.log("First 10 vehicles:", vehicles.slice(0, 10));
  } catch (err) {
    console.error("Error in getVehicles():", err);
  }
}

test();
