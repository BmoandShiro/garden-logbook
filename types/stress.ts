export type StressType =
  | 'HEAT_STRESS'
  | 'COLD_STRESS'
  | 'LIGHT_STRESS'
  | 'DROUGHT_UNDERWATERING'
  | 'OVERWATERING'
  | 'NUTRIENT_BURN'
  | 'NUTRIENT_DEFICIENCY'
  | 'WIND_VPD_FAN_BURN'
  | 'ROOT_BOUND'
  | 'PHYSICAL_DAMAGE'
  | 'TRANSPLANT_SHOCK'
  | 'CHEMICAL_FOLIAR_SPRAY'
  | 'OTHER';

export type StressSymptom =
  | 'STUNTED_GROWTH'
  | 'SLOW_RECOVERY'
  | 'PALE_COLOR'
  | 'UNEVEN_GROWTH'
  | 'ABNORMAL_SPACING'
  | 'BRITTLE_STEMS'
  | 'WEAK_BRANCHING'
  | 'UNEXPLAINED_DROP'
  | 'SCENT_CHANGE'
  | 'HEAT_STRESS'
  | 'LIGHT_BURN'
  | 'STRETCHING'
  | 'TIP_CURL'
  | 'OVER_TRANSPIRATION'
  | 'NUTRIENT_LOCKOUT';

export type PlantArea =
  | 'TOP_LEAVES'
  | 'LOWER_LEAVES'
  | 'WHOLE_PLANT'
  | 'ROOT_ZONE'
  | 'MAIN_STEM_BRANCHES';

export type DetectionMethod =
  | 'VISUAL'
  | 'SOIL_MOISTURE_METER'
  | 'PH_EC_METER'
  | 'IR_THERMOMETER'
  | 'LEAF_SURFACE_SCAN'
  | 'OTHER';

export type StressDuration =
  | '<1_HOUR'
  | '1-6_HOURS'
  | '6-24_HOURS'
  | '1-3_DAYS'
  | 'ONGOING'
  | 'UNSURE';

export type StressImpactLevel = 1 | 2 | 3 | 4 | 5;

export type ExpectedRecoveryTime =
  | '<1_DAY'
  | '1-3_DAYS'
  | '3-7_DAYS'
  | '>1_WEEK'
  | 'UNKNOWN'; 