import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { format } from 'date-fns';
import LogRawDataToggle from '../components/LogRawDataToggle';

async function getLog(id: string) {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;
  const res = await fetch(`${baseUrl}/api/logs/${id}`);
  if (!res.ok) return null;
  return res.json();
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1 border-b border-dark-border last:border-b-0">
      <span className="font-medium text-dark-text-secondary">{label}</span>
      <span className="text-dark-text-primary text-right min-w-[8rem] flex-1 justify-end flex">{value ?? <span className="italic text-dark-text-secondary">N/A</span>}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-dark-bg-primary rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-2 text-garden-400">{title}</h2>
      {children}
    </div>
  );
}

export default async function LogDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const log = await getLog(id);
  if (!log) return notFound();

  // Merge log fields and log.data fields for display
  const merged = { ...log, ...(log.data || {}) };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Location Section */}
      <Section title="Location">
        <FieldRow label="Garden" value={log.garden?.name} />
        <FieldRow label="Room" value={log.room?.name} />
        <FieldRow label="Zone" value={log.zone?.name} />
        <FieldRow label="Plant" value={log.plant?.name} />
      </Section>

      {/* Log Info Section */}
      <Section title="Log Info">
        <FieldRow label="Type" value={log.type?.replace(/_/g, ' ')} />
        <FieldRow label="Stage" value={log.stage} />
        <FieldRow label="Date/Time" value={format(new Date(log.logDate), 'PPP p')} />
        <FieldRow label="User ID" value={log.userId} />
      </Section>

      {/* TRANSFER-specific section - Only for TRANSFER logs */}
      {log.type === 'TRANSFER' && (
        <Section title="Transfer Details">
          <FieldRow label="Transfer To Garden" value={merged.destinationGardenId} />
          <FieldRow label="Transfer To Room" value={merged.destinationRoomId} />
          <FieldRow label="Transfer To Zone" value={merged.destinationZoneId} />
        </Section>
      )}

      {/* TRANSPLANT-specific section - Only for TRANSPLANT logs */}
      {log.type === 'TRANSPLANT' && (
        <Section title="Transplant Details">
          <FieldRow label="Transplant From" value={merged.transplantFromSize} />
          <FieldRow label="Transplant To" value={merged.transplantToSize} />
          <FieldRow label="Soil Moisture When Transplanting" value={merged.soilMoisture} />
        </Section>
      )}

      {/* PEST_STRESS_DISEASE-specific section - Only for PEST_STRESS_DISEASE logs */}
      {log.type === 'PEST_STRESS_DISEASE' && (
        <Section title="Pest/Stress/Disease Details">
          <FieldRow label="Health Rating" value={merged.healthRating} />
          <FieldRow label="Method Inspected" value={merged.inspectionMethod} />
          <FieldRow label="Area of Plant Most Affected" value={Array.isArray(merged.affectedAreas) ? merged.affectedAreas.join(', ') : merged.affectedAreas} />
          <FieldRow label="Leaf Symptoms" value={Array.isArray(merged.leafSymptoms) ? merged.leafSymptoms.join(', ') : merged.leafSymptoms} />
          <FieldRow label="Pest Indicators" value={Array.isArray(merged.pestIndicators) ? merged.pestIndicators.join(', ') : merged.pestIndicators} />
          <FieldRow label="Fungal/Bacterial Symptoms" value={Array.isArray(merged.fungalSymptoms) ? merged.fungalSymptoms.join(', ') : merged.fungalSymptoms} />
          <FieldRow label="General/Other Plant Stress Signs" value={Array.isArray(merged.stressSymptoms) ? merged.stressSymptoms.join(', ') : merged.stressSymptoms} />
          <FieldRow label="Pest Identification Status" value={merged.pestIdentificationStatus} />
          <FieldRow label="Confidence Level" value={merged.pestConfidenceLevel} />
          <FieldRow label="Pest Types" value={Array.isArray(merged.pestTypes) ? merged.pestTypes.join(', ') : merged.pestTypes} />
          <FieldRow label="Disease Types" value={Array.isArray(merged.diseaseTypes) ? merged.diseaseTypes.join(', ') : merged.diseaseTypes} />
          <FieldRow label="IPM Methods & Beneficial Organisms" value={Array.isArray(merged.ipmMethods) ? merged.ipmMethods.join(', ') : merged.ipmMethods} />
          <FieldRow label="Method of Detection" value={Array.isArray(merged.detectionMethods) ? merged.detectionMethods.join(', ') : merged.detectionMethods} />
          <FieldRow label="Duration of Stress" value={merged.stressDuration} />
          <FieldRow label="Suspected Cause" value={merged.suspectedCause} />
          <FieldRow label="Recovery Actions Taken" value={merged.recoveryActions} />
          <FieldRow label="Expected Recovery Time" value={merged.expectedRecoveryTime} />
        </Section>
      )}

      {/* DRYING-specific section - Only for DRYING logs */}
      {log.type === 'DRYING' && (
        <Section title="Drying Details">
          <FieldRow label="Trim Moisture" value={merged.trimMoisture} />
          <FieldRow label="Nug Moisture When Trimmed (%)" value={merged.nugMoisturePercent} />
          <FieldRow label="Trim Method" value={merged.trimMethod} />
          <FieldRow label="RH (%)" value={merged.dryingRh} />
          <FieldRow label="Temperature" value={merged.dryingTemp !== undefined ? `${merged.dryingTemp}${merged.temperatureUnit ? ` ${merged.temperatureUnit}` : ''}` : undefined} />
          <FieldRow label="Estimated Days Left Till Dry" value={merged.estimatedDaysLeft} />
        </Section>
      )}

      {/* HARVEST-specific section - Only for HARVEST logs */}
      {log.type === 'HARVEST' && (
        <Section title="Harvest Details">
          <FieldRow label="Hang Method" value={merged.hangMethod} />
          <FieldRow label="Trichome Coloration" value={merged.trichomeColor} />
          <FieldRow label="Harvest to be used live" value={merged.forLiveUse ? 'Yes' : 'No'} />
        </Section>
      )}

      {/* HST-specific section - Only for HST logs */}
      {log.type === 'HST' && (
        <Section title="HST Details">
          <FieldRow label="Topped at Node" value={merged.toppedNode} />
          <FieldRow label="FIM at Node" value={merged.fimNode} />
          <FieldRow label="Defoliation Intensity" value={merged.defoliationIntensity} />
          <FieldRow label="Portion of Plant Defoliated (%)" value={merged.defoliationPercentage} />
          <FieldRow label="Training Goals" value={Array.isArray(merged.trainingGoals) ? merged.trainingGoals.join(', ') : merged.trainingGoals} />
        </Section>
      )}

      {/* LST-specific section - Only for LST logs */}
      {log.type === 'LST' && (
        <Section title="LST Details">
          <FieldRow label="Supercropping Intensity" value={merged.supercroppingIntensity} />
          <FieldRow label="Tie Down Intensity" value={merged.tieDownIntensity} />
          <FieldRow label="Canopy Shape" value={merged.canopyShape} />
          <FieldRow label="Leaf Tucking Intensity" value={merged.leafTuckingIntensity} />
          <FieldRow label="Trunk Supports" value={merged.trunkSupports} />
        </Section>
      )}

      {/* Environmental Data Section - Only for ENVIRONMENTAL logs */}
      {log.type === 'ENVIRONMENTAL' && (
        <Section title="Environmental Data">
          <FieldRow label="Temperature" value={merged.temperature !== undefined ? `${merged.temperature}${merged.temperatureUnit ? ` ${merged.temperatureUnit}` : ''}` : undefined} />
          <FieldRow label="Humidity" value={merged.humidity} />
          <FieldRow label="CO₂" value={merged.co2} />
          <FieldRow label="VPD" value={merged.vpd} />
          <FieldRow label="Dew Point" value={merged.dewPoint} />
          <FieldRow label="Average PAR" value={merged.averagePar} />
          <FieldRow label="Fan Speed" value={merged.fanSpeed} />
          <FieldRow label="Air Exchange Type" value={merged.airExchangeType} />
        </Section>
      )}

      {/* Watering-specific sections - Only for WATERING logs */}
      {log.type === 'WATERING' && (
        <>
          <Section title="Source Water Info">
            <FieldRow label="Water Source" value={merged.waterSource} />
            <FieldRow label="Source Water pH" value={merged.sourceWaterPh} />
            <FieldRow label="Source Water PPM" value={merged.sourceWaterPpm} />
            <FieldRow label="Source Water Temperature" value={merged.sourceWaterTemperature !== undefined ? `${merged.sourceWaterTemperature}${merged.sourceWaterTemperatureUnit ? ` ${merged.sourceWaterTemperatureUnit}` : ''}` : undefined} />
          </Section>

          <Section title="Nutrient Information">
            <FieldRow label="Water Amount" value={merged.waterAmount ? `${merged.waterAmount} ${merged.waterUnit || ''}` : undefined} />
            <FieldRow label="Water Temperature" value={merged.waterTemperature ? `${merged.waterTemperature}${merged.waterTemperatureUnit ? ` ${merged.waterTemperatureUnit}` : ''}` : undefined} />
            <FieldRow label="Nutrient Water Temperature" value={merged.nutrientWaterTemperature !== undefined ? `${merged.nutrientWaterTemperature}${merged.nutrientWaterTemperatureUnit ? ` ${merged.nutrientWaterTemperatureUnit}` : ''}` : undefined} />
            <FieldRow label="Nutrient Water pH" value={merged.nutrientWaterPh} />
            <FieldRow label="Nutrient Water PPM" value={merged.nutrientWaterPpm} />
            <FieldRow label="PPM Scale" value={merged.ppmScale} />
            <FieldRow label="Nutrient Line" value={merged.nutrientLine} />
            <FieldRow label="Jacks321 Used" value={Array.isArray(merged.jacks321Used) ? merged.jacks321Used.join(', ') : merged.jacks321Used} />
            <FieldRow label="Jacks321 Unit" value={merged.jacks321Unit} />
            <FieldRow label="Part A Amount" value={merged.partAAmount} />
            <FieldRow label="Part B Amount" value={merged.partBAmount} />
            <FieldRow label="Part C Amount" value={merged.partCAmount} />
            <FieldRow label="Booster Amount" value={merged.boosterAmount} />
            <FieldRow label="Finish Amount" value={merged.finishAmount} />
          </Section>

          <Section title="Additives">
            <FieldRow label="Uncoated Aspirin (81-325mg/gal)" value={merged.uncoatedAspirin} />
            <FieldRow label="Nukem Root Drench" value={merged.nukemRootDrench} />
            <FieldRow label="Oxiphos" value={merged.oxiphos} />
            <FieldRow label="SeaGreen" value={merged.seaGreen} />
            <FieldRow label="Teabrewer Batch" value={merged.teabrewerBatch} />
            <FieldRow label="Teabrewer Volume" value={merged.teabrewerVolume} />
          </Section>
        </>
      )}

      {/* CLONING-specific section - Only for CLONING logs */}
      {log.type === 'CLONING' && (
        <Section title="Cloning Details">
          <FieldRow label="Cloning Method" value={merged.cloningMethod} />
          <FieldRow label="Cut From" value={merged.cutFrom} />
          <FieldRow label="Additives Used" value={Array.isArray(merged.additivesUsed) ? merged.additivesUsed.join(', ') : merged.additivesUsed} />
          <FieldRow label="Sanitation Method" value={merged.sanitationMethod} />
          <FieldRow label="RH (%)" value={merged.rh} />
          <FieldRow label="Temperature" value={merged.temperature !== null && merged.temperature !== undefined ? `${merged.temperature}${merged.temperatureUnit ? ` ${merged.temperatureUnit}` : ''}` : undefined} />
          <FieldRow label="Light Hours per Day" value={merged.lightHoursPerDay} />
          <FieldRow label="Light Type" value={merged.lightType} />
          <FieldRow label="Dome Used" value={merged.domeUsed ? 'Yes' : 'No'} />
          <FieldRow label="Vents Opened" value={merged.ventsOpened ? 'Yes' : 'No'} />
          <FieldRow label="Dome Removed" value={merged.domeRemoved ? 'Yes' : 'No'} />
          <FieldRow label="Vents Closed" value={merged.ventsClosed ? 'Yes' : 'No'} />
        </Section>
      )}

      {/* TREATMENT-specific section - Only for TREATMENT logs */}
      {log.type === 'TREATMENT' && (
        <Section title="Treatment Details">
          <FieldRow label="Treatment Type" value={merged.treatmentType} />
          <FieldRow label="Foliar Spray Products" value={Array.isArray(merged.foliarSprayProducts) ? merged.foliarSprayProducts.join(', ') : merged.foliarSprayProducts} />
          <FieldRow label="Application Method" value={merged.applicationMethod} />
          <FieldRow label="Coverage Method" value={merged.coverageMethod} />
          <FieldRow label="Target Pests" value={Array.isArray(merged.targetPests) ? merged.targetPests.join(', ') : merged.targetPests} />
          <FieldRow label="BCA Predator Types" value={Array.isArray(merged.bcaPredatorTypes) ? merged.bcaPredatorTypes.join(', ') : merged.bcaPredatorTypes} />
          <FieldRow label="BCA Acclimation Prior to Release" value={merged.bcaAcclimationPriorToRelease ? 'Yes' : 'No'} />
          <FieldRow label="Release Count" value={merged.releaseCount} />
          <FieldRow label="pH of Treatment Solution" value={merged.phOfTreatmentSolution} />
          <FieldRow label="Additives" value={Array.isArray(merged.additives) ? merged.additives.join(', ') : merged.additives} />
        </Section>
      )}

      {/* Notes Section */}
      <Section title="Notes">
        <div className="text-dark-text-primary whitespace-pre-line min-h-[2rem]">{merged.notes || <span className="italic text-dark-text-secondary">N/A</span>}</div>
      </Section>

      {/* Raw Data Toggle (Client Component) */}
      <LogRawDataToggle log={log} />
    </div>
  );
} 