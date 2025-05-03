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
      <span className="text-dark-text-primary">{value ?? <span className="italic text-dark-text-secondary">N/A</span>}</span>
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

      {/* Notes Section */}
      <Section title="Notes">
        <div className="text-dark-text-primary whitespace-pre-line min-h-[2rem]">{merged.notes || <span className="italic text-dark-text-secondary">N/A</span>}</div>
      </Section>

      {/* Raw Data Toggle (Client Component) */}
      <LogRawDataToggle log={log} />
    </div>
  );
} 