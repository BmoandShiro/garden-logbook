# Log Type Field Mappings

## Time Tracking (All Types)
- Log Entry Time (auto-recorded when submitted)
- Action Time (when the task actually occurred)
- Action Date (when the task actually occurred)

## Core Fields (Always Show)
- Location (Garden → Room → Zone → Plant)
- Notes (General)
- Image Upload
- Stage

## Section Notes Format (All Types)
Each section below includes:
- Section-specific notes/observations field
- Option to add images specific to that section
- Ability to tag specific measurements or values in notes

## WATERING (Combined with Feeding)
### Primary Fields
- Water Amount + Unit
- Water Source
- Water Temperature
- Water pH (before)
- Runoff pH
- Water EC/PPM (before) [500 scale]
- Runoff EC/PPM [500 scale]
- Medium Moisture (before/after)

### Nutrient Fields (Optional)
- Nutrient Line Selection
- Jack's 321 Products:
  - Part A Amount (5-12-26)
  - Part B Amount (15-0-0 Calcium Nitrate)
  - Part C Amount (Epsom Salts)
  - Booster Amount
  - Finish Amount
- Custom Nutrients (name, amount, unit)

### Optional Fields
- Environmental Measurements
  - Temperature
  - Humidity
  - VPD
  - PAR (μmol/m²/s)
  - PPFD (μmol/m²/s)
  - Light Height
  - Medium Temperature
  - Medium pH

### Section Notes
- Nutrient Mix Observations
- Plant Response Notes
- Issues Encountered
- Follow-up Required

## ENVIRONMENTAL
### Primary Fields
- Temperature + Unit
- Humidity
- CO2 Level (PPM)
- VPD
- PAR (μmol/m²/s)
- PPFD (μmol/m²/s)
- Light Height + Unit
- Airflow Status

### Optional Fields
- Medium Temperature
- Medium Moisture

### Section Notes
- Equipment Issues
- Climate Control Observations
- Plant Response to Conditions
- Adjustment Notes

## PRUNING (Combined with Defoliation)
### Primary Fields
- Action Type (Pruning/Defoliation)
- Training Methods (if pruning)
- Trim Amount + Unit
- Node Count (after)
- Branch Count (after)
- Plant Height + Unit
- Plant Width + Unit
- Percentage of Canopy Removed (if defoliation)
- Reason for Action

### Optional Fields
- Environmental Measurements

### Section Notes
- Technique Details
- Plant Response
- Recovery Observations
- Future Recommendations

## TRAINING
### Primary Fields
- Training Methods
- Plant Height + Unit
- Plant Width + Unit
- Node Count
- Branch Count

### Optional Fields
- Environmental Measurements

## FLUSHING
### Primary Fields
- Water Amount + Unit
- Water Source
- Water pH
- Runoff pH
- Water EC/PPM
- Runoff EC/PPM
- Duration of Flush

### Section Notes
- Flush Effectiveness
- Plant Response
- Nutrient Lockout Observations
- Recovery Notes

## HARVEST
### Primary Fields
- Wet Weight + Unit
- Plant Height + Unit
- Plant Width + Unit
- Node Count
- Branch Count
- Trim Weight + Unit
- Environmental Conditions

### Optional Fields
- Estimated Final Weight
- Drying Method
- Trim Method

### Section Notes
- Quality Observations
- Density Notes
- Trichome Status
- Drying Recommendations

## PEST_DISEASE
### Primary Fields
- Pest Types
- Disease Types
- Severity Rating
- Affected Areas
- Treatment Methods
- Treatment Products
- Treatment Dosage + Unit

### Optional Fields
- Environmental Measurements
- Images of Affected Areas

### Section Notes
- Spread Patterns
- Treatment Effectiveness
- Prevention Notes
- Follow-up Schedule

## TRANSPLANT
### Primary Fields
- New Container Size
- Medium Type
- Plant Height + Unit
- Plant Width + Unit
- Root Health Rating

### Optional Fields
- Environmental Measurements
- Water/Feeding Details

### Section Notes
- Root Health Details
- Stress Indicators
- Recovery Progress
- Medium Condition

## GERMINATION
### Primary Fields
- Medium Type
- Medium Temperature
- Medium Moisture
- Environmental Measurements
- Success Rate

### Section Notes
- Germination Rate Details
- Issues Encountered
- Successful Conditions
- Improvement Notes

## CLONING
### Primary Fields
- Number of Clones
- Medium Type
- Medium Temperature
- Humidity
- Light Intensity
- Treatment Products (if any)
- Success Rate

### Section Notes
- Success Rate Details
- Root Development
- Environmental Response
- Technique Effectiveness

## INSPECTION
### Primary Fields
- Health Rating
- Pest Check
- Disease Check
- Deficiencies
- Leaf Color
- Plant Height + Unit
- Plant Width + Unit
- Node Count
- Branch Count

### Optional Fields
- Environmental Measurements

### Section Notes
- Detailed Observations
- Growth Pattern Notes
- Health Indicators
- Recommendations

## TREATMENT
### Primary Fields
- Treatment Methods
- Treatment Products
- Treatment Dosage + Unit
- Target Issue
- Affected Areas
- Follow-up Required

### Optional Fields
- Environmental Measurements

### Section Notes
- Treatment Effectiveness
- Side Effects
- Recovery Progress
- Follow-up Notes

## STRESS
### Primary Fields
- Stress Type
- Severity Rating
- Affected Areas
- Environmental Measurements
- Corrective Actions

### Section Notes
- Stress Indicators
- Recovery Signs
- Prevention Notes
- Action Effectiveness

## GENERAL
### Primary Fields
- Basic Environmental Measurements
- Plant Measurements
- Health Rating

### Optional Fields
- All other fields available but collapsed/hidden by default

### Section Notes
- General Observations
- Maintenance Notes
- Future Planning
- Concerns

## CUSTOM
- All fields available and organized by category
- User can save custom templates with their preferred fields
- Template sharing functionality (future feature)

### Section Notes
- Custom Categories
- Template Notes
- Process Documentation
- Results Tracking

---

# Implementation Plan

1. Database Migration:
   - Create backup of current schema
   - Add new fields and enums
   - Add section notes fields
   - Update existing logs to new format

2. UI Components:
   - Create modular section components
   - Build dynamic form generator
   - Implement section-specific note fields
   - Add image upload per section

3. API Updates:
   - Update log creation/edit endpoints
   - Add section note handling
   - Implement filtering and search

4. Features to Implement First:
   - Basic log entry with new fields
   - Time tracking (action vs entry time)
   - Section notes with formatting
   - Image attachments per section

Would you like me to start with:
1. Database migration
2. UI components
3. API updates
4. Or something else?

---

# Notes for Future Modifications
1. Schema Flexibility:
   - All fields are optional in the database
   - New fields can be added without breaking existing logs
   - Field types can be modified with migration scripts
   
2. Easy to Add:
   - New measurement units
   - New log types
   - New fields to existing log types
   - New validation rules
   
3. Easy to Modify:
   - Field groupings
   - Required vs optional fields
   - Default values
   - Unit conversions
   
4. Future Features to Consider:
   - Calculated fields (e.g., VPD from temperature/humidity)
   - Custom validation rules per field
   - Saved templates per user
   - Batch log entry
   - Data import/export formats 