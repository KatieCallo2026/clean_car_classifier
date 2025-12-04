# Clean Cars 4 All - Eligibility Database

This file contains the list of vehicles that qualify for California's Clean Cars 4 All program.

## Qualification Criteria

To qualify for Clean Cars 4 All benefits, vehicles must meet the following criteria:

1. **Zero-Emission Vehicles (ZEV)**: Battery Electric Vehicles (BEV)
2. **Plug-in Hybrid Electric Vehicles (PHEV)**: With minimum electric range
3. **Fuel Cell Electric Vehicles (FCEV)**
4. **Model Year**: Typically 2015 or newer (check current program requirements)
5. **Purchase Price**: Must be below program limits

## Integration Instructions

### Option 1: Static Database (Current Implementation)
The `modelService.js` uses keyword matching to determine eligibility. This works for testing but should be replaced with a proper database.

### Option 2: API Integration (Recommended)
Create an API endpoint that:
1. Accepts the predicted car model/make/year
2. Queries the official Clean Cars 4 All database
3. Returns detailed eligibility information

### Option 3: Database File
Create a JSON database file with all qualified vehicles:

```json
{
  "qualified_vehicles": [
    {
      "make": "Tesla",
      "model": "Model 3",
      "years": [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      "type": "BEV",
      "incentive_amount": 9500
    },
    {
      "make": "Toyota",
      "model": "Prius Prime",
      "years": [2017, 2018, 2019, 2020, 2021, 2022, 2023],
      "type": "PHEV",
      "incentive_amount": 7500
    }
  ]
}
```

## Official Resources

- **Clean Cars 4 All Program**: https://ww2.arb.ca.gov/our-work/programs/clean-cars-4-all
- **Eligible Vehicle List**: Check the official CARB website for the most up-to-date list
- **Income Requirements**: Program has income eligibility requirements
- **Scrap Vehicle Requirements**: Old vehicle must meet certain criteria

## TODO for Production

- [ ] Integrate with official CARB database API (if available)
- [ ] Create comprehensive vehicle database with all qualified models
- [ ] Add year-specific eligibility rules
- [ ] Include incentive amount calculations
- [ ] Add income eligibility checker
- [ ] Implement vehicle condition verification
- [ ] Add geographic eligibility (specific California regions)
- [ ] Include dealer/retailer verification system
