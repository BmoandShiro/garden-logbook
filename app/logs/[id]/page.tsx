import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { format } from 'date-fns';

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

export default async function LogDetailsPage({ params }: { params: { id: string } }) {
  const log = await getLog(params.id);
  if (!log) return notFound();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-dark-bg-primary rounded-lg shadow p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2 text-garden-400">{log.type.replace(/_/g, ' ')} Log</h1>
        <p className="text-dark-text-secondary mb-4">{format(new Date(log.logDate), 'PPP p')}</p>
        <div className="space-y-2">
          <FieldRow label="Stage" value={log.stage} />
          <FieldRow label="Notes" value={log.notes} />
          <FieldRow label="Plant" value={log.plant?.name} />
          <FieldRow label="Garden" value={log.garden?.name} />
          <FieldRow label="Room" value={log.room?.name} />
          <FieldRow label="Zone" value={log.zone?.name} />
          <FieldRow label="Water Amount" value={log.waterAmount ? `${log.waterAmount} ${log.waterUnit || ''}` : undefined} />
          <FieldRow label="Source Water pH" value={log.sourceWaterPh} />
          <FieldRow label="Nutrient Water pH" value={log.nutrientWaterPh} />
          <FieldRow label="Source Water PPM" value={log.sourceWaterPpm} />
          <FieldRow label="Nutrient Water PPM" value={log.nutrientWaterPpm} />
          <FieldRow label="PPM Scale" value={log.ppmScale} />
          <FieldRow label="Nutrient Line" value={log.nutrientLine} />
          <FieldRow label="Temperature" value={log.temperature} />
          <FieldRow label="Humidity" value={log.humidity} />
        </div>
      </div>
      <div className="bg-dark-bg-primary rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2 text-garden-400">All Log Data</h2>
        <pre className="text-dark-text-primary text-sm overflow-x-auto">
          {JSON.stringify(log, null, 2)}
        </pre>
      </div>
    </div>
  );
} 