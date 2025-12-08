/**
 * Client-Side Fallback for Car Eligibility Checking
 * Uses embedded CSV data when backend is unavailable
 */

// Embedded eligible vehicles from clean_vehicle_dataset_2015_2025.csv
// Only includes vehicles where Eligible_CC4A_DCAP = "Yes"
export const ELIGIBLE_VEHICLES = [
  // Tesla
  { make: "Tesla", model: "Model S", years: "2015-2025", type: "BEV" },
  { make: "Tesla", model: "Model 3", years: "2015-2025", type: "BEV" },
  { make: "Tesla", model: "Model X", years: "2015-2025", type: "BEV" },
  { make: "Tesla", model: "Model Y", years: "2020-2025", type: "BEV" },
  
  // Chevrolet
  { make: "Chevrolet", model: "Bolt EV", years: "2017-2025", type: "BEV" },
  { make: "Chevrolet", model: "Bolt EUV", years: "2022-2025", type: "BEV" },
  { make: "Chevrolet", model: "Volt", years: "2015-2019", type: "PHEV" },
  
  // Nissan
  { make: "Nissan", model: "Leaf", years: "2015-2025", type: "BEV" },
  { make: "Nissan", model: "Ariya", years: "2023-2025", type: "BEV" },
  
  // Toyota
  { make: "Toyota", model: "Prius Prime", years: "2017-2025", type: "PHEV" },
  { make: "Toyota", model: "RAV4 Prime", years: "2021-2025", type: "PHEV" },
  { make: "Toyota", model: "bZ4X", years: "2023-2025", type: "BEV" },
  
  // Honda
  { make: "Honda", model: "Clarity", years: "2018-2021", type: "PHEV" },
  
  // Ford
  { make: "Ford", model: "Mustang Mach-E", years: "2021-2025", type: "BEV" },
  { make: "Ford", model: "F-150 Lightning", years: "2022-2025", type: "BEV" },
  { make: "Ford", model: "E-Transit", years: "2022-2025", type: "BEV" },
  
  // Hyundai
  { make: "Hyundai", model: "Ioniq 5", years: "2022-2025", type: "BEV" },
  { make: "Hyundai", model: "Ioniq 6", years: "2023-2025", type: "BEV" },
  { make: "Hyundai", model: "Kona Electric", years: "2019-2025", type: "BEV" },
  
  // Kia
  { make: "Kia", model: "EV6", years: "2022-2025", type: "BEV" },
  { make: "Kia", model: "Niro EV", years: "2019-2025", type: "BEV" },
  
  // BMW
  { make: "BMW", model: "i3", years: "2015-2021", type: "BEV" },
  { make: "BMW", model: "i4", years: "2022-2025", type: "BEV" },
  { make: "BMW", model: "iX", years: "2022-2025", type: "BEV" },
  
  // Mercedes-Benz
  { make: "Mercedes-Benz", model: "EQS", years: "2022-2025", type: "BEV" },
  { make: "Mercedes-Benz", model: "EQE", years: "2023-2025", type: "BEV" },
  
  // Volkswagen
  { make: "Volkswagen", model: "ID.4", years: "2021-2025", type: "BEV" },
  
  // Audi
  { make: "Audi", model: "e-tron", years: "2019-2025", type: "BEV" },
  { make: "Audi", model: "Q4 e-tron", years: "2022-2025", type: "BEV" },
  
  // Rivian
  { make: "Rivian", model: "R1T", years: "2022-2025", type: "BEV" },
  { make: "Rivian", model: "R1S", years: "2022-2025", type: "BEV" },
  
  // Polestar
  { make: "Polestar", model: "2", years: "2021-2025", type: "BEV" },
  
  // Lucid
  { make: "Lucid", model: "Air", years: "2022-2025", type: "BEV" },
];

// Common car makes for pattern matching
const KNOWN_MAKES = [
  "Tesla", "Chevrolet", "Chevy", "Nissan", "Toyota", "Honda", "Ford", 
  "Hyundai", "Kia", "BMW", "Mercedes", "Mercedes-Benz", "Volkswagen", "VW",
  "Audi", "Rivian", "Polestar", "Lucid", "Volvo", "Porsche", "Jaguar",
  "Mazda", "Subaru", "Mitsubishi", "Lexus", "Acura", "Cadillac", "GMC",
  "Jeep", "Dodge", "Chrysler", "Ram", "Buick", "Lincoln"
];

/**
 * Extract car make and model from user input or image metadata
 * This is a simple pattern matcher - not AI-based
 */
export function extractCarInfo(text) {
  if (!text) return null;
  
  const textLower = text.toLowerCase();
  
  // Try to find make
  let foundMake = null;
  for (const make of KNOWN_MAKES) {
    if (textLower.includes(make.toLowerCase())) {
      foundMake = make === "Chevy" ? "Chevrolet" : make === "VW" ? "Volkswagen" : make;
      break;
    }
  }
  
  if (!foundMake) return null;
  
  // Try to find model from eligible vehicles
  for (const vehicle of ELIGIBLE_VEHICLES) {
    if (vehicle.make === foundMake && textLower.includes(vehicle.model.toLowerCase())) {
      return {
        make: vehicle.make,
        model: vehicle.model,
        ...vehicle
      };
    }
  }
  
  return { make: foundMake, model: "Unknown" };
}

/**
 * Check if a car is eligible for Clean Cars 4 All based on make/model
 */
export function checkEligibilityClientSide(make, model) {
  if (!make || !model) {
    return {
      qualified: false,
      confidence: 0,
      eligibility_reason: "Unable to identify vehicle make and model"
    };
  }
  
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Check against eligible vehicles
  const match = ELIGIBLE_VEHICLES.find(v => 
    v.make.toLowerCase() === makeLower && 
    v.model.toLowerCase().includes(modelLower)
  );
  
  if (match) {
    return {
      qualified: true,
      confidence: 75, // Lower confidence for client-side matching
      name: `${match.make} ${match.model}`,
      vehicle_type: match.type,
      eligible_years: match.years,
      eligibility_reason: `✅ ${match.make} ${match.model} (${match.type}) is eligible for Clean Cars 4 All tax benefits (${match.years})`,
      method: "client-side-match"
    };
  }
  
  // Not in eligible list
  return {
    qualified: false,
    confidence: 60,
    name: `${make} ${model}`,
    eligibility_reason: `❌ ${make} ${model} is not in the Clean Cars 4 All eligible vehicle database. Only BEVs (Battery Electric Vehicles) and PHEVs (Plug-in Hybrid Electric Vehicles) from 2015+ may qualify.`,
    method: "client-side-match"
  };
}

/**
 * Client-side fallback prediction when backend is unavailable
 * Prompts user to manually enter make/model
 */
export function fallbackPrediction(userInput) {
  const extracted = extractCarInfo(userInput);
  
  if (extracted && extracted.model !== "Unknown") {
    const result = checkEligibilityClientSide(extracted.make, extracted.model);
    return {
      ...result,
      fallback: true,
      message: "⚠️ Using offline mode - backend unavailable"
    };
  }
  
  return {
    qualified: false,
    confidence: 0,
    fallback: true,
    requiresInput: true,
    message: "⚠️ Backend unavailable. Please manually enter the car make and model to check eligibility.",
    eligibility_reason: "Manual input required in offline mode"
  };
}

/**
 * Get list of all eligible vehicles for display
 */
export function getEligibleVehiclesList() {
  return ELIGIBLE_VEHICLES.map(v => ({
    name: `${v.make} ${v.model} (${v.years})`,
    type: v.type,
    make: v.make,
    model: v.model,
    years: v.years
  }));
}

/**
 * Search eligible vehicles by text query
 */
export function searchEligibleVehicles(query) {
  if (!query || query.length < 2) return [];
  
  const queryLower = query.toLowerCase();
  return ELIGIBLE_VEHICLES.filter(v => 
    v.make.toLowerCase().includes(queryLower) ||
    v.model.toLowerCase().includes(queryLower)
  ).map(v => ({
    name: `${v.make} ${v.model} (${v.years})`,
    type: v.type,
    make: v.make,
    model: v.model,
    years: v.years
  }));
}
