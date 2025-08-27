import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { format } from 'date-fns';
import LogRawDataToggle from '../components/LogRawDataToggle';
import { renderForecastedMessage } from '@/lib/renderForecastedMessage';
import LogDateField from './LogDateField';
import { db } from '@/lib/db';
import zipcodeToTimezone from 'zipcode-to-timezone';

async function getLog(id: string) {
  try {
    const log = await db.log.findUnique({
      where: { id },
      include: {
        plant: true,
        garden: true,
        room: true,
        zone: true,
      },
    });
    if (!log) return null;
    
    let timezone = log.garden?.timezone || null;
    if (!timezone && log.garden?.zipcode) {
      try {
        timezone = zipcodeToTimezone.lookup(log.garden.zipcode) || null;
      } catch (e) {
        timezone = null;
      }
    }
    return { ...log, timezone };
  } catch (error) {
    console.error('Error fetching log:', error);
    return null;
  }
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
        <FieldRow label="Date/Time" value={<LogDateField date={log.logDate} timezone={log.timezone} />} />
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
            <FieldRow label="Nutrient Water Temperature" value={merged.nutrientWaterTemperature !== undefined ? `${merged.nutrientWaterTemperature}${merged.nutrientWaterTemperatureUnit ? ` ${merged.nutrientWaterTemperatureUnit}` : ''}` : undefined} />
            <FieldRow label="Nutrient Water pH" value={merged.nutrientWaterPh} />
            <FieldRow label="Nutrient Water PPM" value={merged.nutrientWaterPpm} />
            <FieldRow label="PPM Scale" value={merged.ppmScale} />
            <FieldRow label="Nutrient Line" value={merged.nutrientLine} />
            <FieldRow label="Jacks321 Used" value={Array.isArray(merged.jacks321Used) ? merged.jacks321Used.join(', ') : merged.jacks321Used} />
            <FieldRow label="Jacks321 Unit" value={merged.jacks321Unit} />
            <FieldRow label="Part A Amount (5-12-26)" value={merged.partAAmount} />
            <FieldRow label="Part B Amount (Calcium Nitrate 15-0-0)" value={merged.partBAmount} />
            <FieldRow label="Part C Amount (Epsom Salts)" value={merged.partCAmount} />
            <FieldRow label="Bloom Booster" value={merged.bloomAmount} />
            <FieldRow label="Finish Amount" value={merged.finishAmount} />
          </Section>

          <Section title="Additives">
            <FieldRow label="Uncoated Aspirin (81-325mg/gal)" value={merged.aspirinAmount} />
            <FieldRow label="Nukem Root Drench" value={merged.nukemAmount} />
            <FieldRow label="Oxiphos" value={merged.oxiphosAmount} />
            <FieldRow label="SeaGreen" value={merged.seagreenAmount} />
            <FieldRow label="Tea Brewer Size" value={merged.teaBrewSize ? `${merged.teaBrewSize} gallons` : undefined} />
            <FieldRow label="Tea Water Temperature" value={merged.teaWaterTemp ? `${merged.teaWaterTemp}°F` : undefined} />
            <FieldRow label="Tea Growth Stage" value={merged.teaGrowthStage} />
            <FieldRow label="Tea Earthworm Castings" value={merged.teaEarthwormCastings} />
            <FieldRow label="Tea Fish Kelp Extract" value={merged.teaFishKelpExtract} />
            <FieldRow label="Tea Molasses" value={merged.teaMolasses} />
            <FieldRow label="Tea Brew Duration" value={merged.teaBrewDuration} />
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

      {/* WEATHER_ALERT or SENSOR_ALERT-specific section */}
      {(log.type === 'WEATHER_ALERT' || log.type === 'SENSOR_ALERT') && merged.sensorTemperature && (
        <Section title="Sensor Readings">
          <FieldRow label="Sensor Temperature" value={`${merged.sensorTemperature}°F`} />
          <FieldRow label="Sensor Humidity" value={`${merged.sensorHumidity}%`} />
        </Section>
      )}

      {/* WEATHER_ALERT-specific section */}
      {(log.type === 'WEATHER_ALERT' || log.type === 'WEATHER ALERT') && merged.sinceLastPrecipDiff && (
        <Section title="Heavy Rain (Since Last Log)">
          <div className="text-blue-700 font-semibold text-sm">
            {merged.sinceLastPrecipDiff}
          </div>
        </Section>
      )}

      {/* CHANGE_LOG-specific section */}
      {log.type === 'CHANGE_LOG' && (
        <Section title="Change Details">
          <FieldRow label="Entity Type" value={merged.entityType} />
          <FieldRow label="Entity Name" value={merged.entityName} />
          <FieldRow label="Changed By" value={merged.changedBy?.name} />
          <FieldRow label="Path" value={merged.path} />
          
          {merged.changes && Array.isArray(merged.changes) && (
            <div className="mt-4">
              <h3 className="text-md font-semibold mb-3 text-emerald-300">Changes Made:</h3>
              <div className="space-y-3">
                {merged.changes.map((change: any, index: number) => (
                  <div key={index} className="bg-dark-bg-secondary rounded-lg p-4 border border-dark-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-emerald-200 capitalize">
                        {change.field.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-xs text-dark-text-secondary">Change #{index + 1}</span>
                    </div>
                    
                    {/* Special handling for sensitivities object */}
                    {change.field === 'sensitivities' && typeof change.oldValue === 'object' && typeof change.newValue === 'object' ? (
                      <div className="space-y-3">
                        {Object.keys({ ...(change.oldValue || {}), ...(change.newValue || {}) }).map((sensitivityKey) => {
                          const oldSensitivity = change.oldValue?.[sensitivityKey];
                          const newSensitivity = change.newValue?.[sensitivityKey];
                          const hasChanged = JSON.stringify(oldSensitivity) !== JSON.stringify(newSensitivity);
                          
                          if (!hasChanged) return null;
                          
                          return (
                            <div key={sensitivityKey} className="bg-dark-bg-primary rounded p-3 border border-dark-border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-blue-300 capitalize">
                                  {sensitivityKey.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-xs text-dark-text-secondary">Sensitivity</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <span className="text-sm font-medium text-red-400">Old Value:</span>
                                  <div className="mt-1 p-2 bg-red-900/20 border border-red-800 rounded text-sm">
                                    {oldSensitivity ? (
                                      <div className="space-y-1">
                                        {Object.entries(oldSensitivity).map(([key, value]) => (
                                          <div key={key} className="flex justify-between">
                                            <span className="text-dark-text-secondary">{key}:</span>
                                            <span className="text-red-200">{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="italic text-dark-text-secondary">empty</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-green-400">New Value:</span>
                                  <div className="mt-1 p-2 bg-green-900/20 border border-green-800 rounded text-sm">
                                    {newSensitivity ? (
                                      <div className="space-y-1">
                                        {Object.entries(newSensitivity).map(([key, value]) => (
                                          <div key={key} className="flex justify-between">
                                            <span className="text-dark-text-secondary">{key}:</span>
                                            <span className="text-green-200">{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="italic text-dark-text-secondary">empty</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="text-sm font-medium text-red-400">Old Value:</span>
                          <div className="mt-1 p-2 bg-red-900/20 border border-red-800 rounded text-sm">
                            {typeof change.oldValue === 'object' && change.oldValue !== null 
                              ? JSON.stringify(change.oldValue, null, 2)
                              : change.oldValue || <span className="italic text-dark-text-secondary">empty</span>}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-green-400">New Value:</span>
                          <div className="mt-1 p-2 bg-green-900/20 border border-green-800 rounded text-sm">
                            {typeof change.newValue === 'object' && change.newValue !== null 
                              ? JSON.stringify(change.newValue, null, 2)
                              : change.newValue || <span className="italic text-dark-text-secondary">empty</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Notes Section */}
      <Section title="Notes">
        {String(log.type) === 'WEATHER_ALERT' || String(log.type) === 'WEATHER ALERT' ? (
          <div className="text-dark-text-primary whitespace-pre-line min-h-[2rem]">{renderForecastedMessage(merged.notes || '')}</div>
        ) : (
          <div className="text-dark-text-primary whitespace-pre-line min-h-[2rem]">{merged.notes || <span className="italic text-dark-text-secondary">N/A</span>}</div>
        )}
      </Section>

      {/* Raw Data Toggle (Client Component) */}
      <LogRawDataToggle log={log} />
    </div>
  );
} 