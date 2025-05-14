import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-extrabold text-garden-400 mb-4">Learn More</h1>
      <p className="text-lg text-dark-text-secondary mb-8">
        Welcome to Garden Logbook! Here's a brief overview of the features you can use to optimize your gardening journey:
      </p>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-emerald-300 mb-2">🌱 Plant Tracking</h2>
          <p className="text-dark-text-primary">Monitor growth stages, watering schedules, nutrient requirements, and health for each plant. Easily log activities and view plant history.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-sky-300 mb-2">🌦️ Environmental Monitoring</h2>
          <p className="text-dark-text-primary">Record and analyze temperature, humidity, wind, and precipitation. Get automatic weather alerts tailored to your plants' sensitivities and location.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-yellow-300 mb-2">⚠️ Weather Alerts & Notifications</h2>
          <p className="text-dark-text-primary">Receive real-time and forecasted weather alerts for heat, frost, wind, drought, flood, and heavy rain. Alerts are logged, color-coded, and shown in your dashboard, calendar, and notifications.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-lime-300 mb-2">📅 Calendar & Logs</h2>
          <p className="text-dark-text-primary">View all your plant activities and weather events on a responsive calendar. Add custom notes, see color-coded log types, and tap for details on mobile.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-pink-300 mb-2">🔔 Notifications & Preferences</h2>
          <p className="text-dark-text-primary">Get timely notifications for weather, tasks, and plant events. Customize your notification frequency and weather alert preferences in your user settings.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-indigo-300 mb-2">📊 Dashboard Analytics</h2>
          <p className="text-dark-text-primary">See a summary of your gardens, active plants, species, strains, and all current/forecasted weather alerts. Hover for alert expiration details.</p>
        </section>
      </div>
      <div className="mt-12 flex gap-4">
        <Link href="/dashboard" className="px-4 py-2 rounded bg-garden-400 text-dark-bg-primary font-bold hover:bg-garden-500">Go to Dashboard</Link>
        <Link href="/" className="px-4 py-2 rounded bg-dark-bg-primary text-garden-400 font-bold border border-garden-400 hover:bg-dark-bg-hover">Back to Home</Link>
      </div>
    </div>
  );
} 