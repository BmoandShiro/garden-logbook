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
          <h2 className="text-2xl font-bold text-emerald-300 mb-2">🔐 Secure Authentication</h2>
          <p className="text-dark-text-primary">
            Sign in securely with multiple options: Google OAuth, Discord OAuth, or email magic links with 6-digit codes. 
            Perfect for both personal use and team collaboration. All authentication is handled securely with NextAuth.js.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-emerald-300 mb-2">🌱 Plant Tracking</h2>
          <p className="text-dark-text-primary">
            Monitor growth stages, watering schedules, nutrient requirements, and health for each plant. 
            Easily log activities and view plant history. Track multiple gardens and rooms with detailed plant management.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-sky-300 mb-2">🌦️ Environmental Monitoring</h2>
          <p className="text-dark-text-primary">
            Record and analyze temperature, humidity, wind, and precipitation. Get automatic weather alerts 
            tailored to your plants' sensitivities and location. Integrate with Govee sensors for real-time monitoring and automated data collection.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-blue-300 mb-2">📡 Smart Sensor Integration</h2>
          <p className="text-dark-text-primary">
            Connect Govee temperature and humidity sensors for automated environmental monitoring. 
            Real-time data collection with automatic logging, battery level monitoring, and device management. 
            Perfect for maintaining optimal growing conditions in grow rooms, greenhouses, or outdoor gardens.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-yellow-300 mb-2">⚠️ Weather Alerts & Notifications</h2>
          <p className="text-dark-text-primary">
            Receive real-time and forecasted weather alerts for heat, frost, wind, drought, flood, and heavy rain. 
            Alerts are logged, color-coded, and shown in your dashboard, calendar, and notifications.
          </p>
          <div className="mt-4 bg-dark-bg-secondary rounded p-4">
            <h3 className="text-lg font-semibold text-yellow-200 mb-2">How to Read Weather Alerts</h3>
            <ul className="list-disc pl-6 text-dark-text-primary space-y-2">
              <li>
                <span className="font-bold text-garden-400">Forecasted Alerts:</span> Each forecasted alert shows the <span className="font-semibold">day label</span> (e.g., <span className="text-white">Friday Night</span>) and the <span className="font-semibold">value/unit</span> (e.g., <span className="text-red-400 font-semibold">80°F</span> for heat, <span className="text-blue-400 font-semibold">80%</span> for drought chance of rain, <span className="text-slate-400 font-semibold">12 mph</span> for wind). <br />
                <span className="block mt-1">• <span className="text-red-400 font-semibold">Heat</span>: High temperature forecast (e.g., <span className="text-white">Friday Night</span> <span className="text-red-400 font-semibold">80°F</span>)</span>
                <span className="block">• <span className="text-sky-300 font-semibold">Frost</span>: Low temperature forecast (e.g., <span className="text-white">Friday Night</span> <span className="text-sky-300 font-semibold">30°F</span>)</span>
                <span className="block">• <span className="text-orange-400 font-semibold">Drought</span>: Chance of rain (e.g., <span className="text-white">Friday Night</span> <span className="text-blue-400 font-semibold">80%</span>)</span>
                <span className="block">• <span className="text-slate-400 font-semibold">Wind</span>: Wind speed (e.g., <span className="text-white">Friday Night</span> <span className="text-slate-400 font-semibold">12 mph</span>)</span>
                <span className="block">• <span className="text-blue-700 font-semibold">Heavy Rain</span>: Precipitation (e.g., <span className="text-white">Friday Night</span> <span className="text-blue-700 font-semibold">2.1 in</span>)</span>
                <span className="block">• <span className="text-amber-700 font-semibold">Flood</span>: Flood risk (e.g., <span className="text-white">Friday Night</span> <span className="text-amber-700 font-semibold">Flood Warning</span>)</span>
                <span className="block mt-1 text-dark-text-secondary">Color coding helps you quickly identify the type and severity of each alert.</span>
              </li>
              <li>
                <span className="font-bold text-garden-400">Current Alerts:</span> These show the current weather conditions affecting your plants, grouped by alert type. Each type is color-coded (e.g., red for heat, blue for heavy rain).<br />
                <span className="block mt-1">• Example: <span className="text-red-400 font-semibold">Heat:</span> <span className="text-white">81°F</span></span>
                <span className="block">• Example: <span className="text-sky-300 font-semibold">Frost:</span> <span className="text-white">30°F</span></span>
                <span className="block">• Example: <span className="text-blue-700 font-semibold">Heavy Rain:</span> <span className="text-white">2.1 in</span></span>
                <span className="block mt-1 text-dark-text-secondary">If you see a current alert, consider taking action to protect your plants (e.g., cover for frost, move indoors for heat or wind).</span>
              </li>
              <li>
                <span className="font-bold text-garden-400">Tips:</span> Hover or tap on alerts for more details. Check your dashboard and calendar for a summary of all active and forecasted alerts. Adjust your plant sensitivities and notification preferences in your user settings for personalized alerts.</li>
            </ul>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-lime-300 mb-2">📅 Calendar & Logs</h2>
          <p className="text-dark-text-primary">
            View all your plant activities and weather events on a responsive calendar. Add custom notes, 
            see color-coded log types, and tap for details on mobile. Create custom log templates for different activities.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-pink-300 mb-2">🔔 Notifications & Preferences</h2>
          <p className="text-dark-text-primary">
            Get timely notifications for weather, tasks, and plant events. Customize your notification frequency 
            and weather alert preferences in your user settings.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-indigo-300 mb-2">📊 Dashboard Analytics</h2>
          <p className="text-dark-text-primary">
            See a summary of your gardens, active plants, species, strains, and all current/forecasted weather alerts. 
            Hover for alert expiration details and get insights into your gardening patterns.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-purple-300 mb-2">🏗️ Garden & Room Management</h2>
          <p className="text-dark-text-primary">
            Organize your plants into gardens and rooms with detailed management. Track equipment, 
            cleaning SOPs, and maintenance tasks. Perfect for commercial operations or large home gardens.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-orange-300 mb-2">🔧 Equipment & Maintenance</h2>
          <p className="text-dark-text-primary">
            Track equipment usage, maintenance schedules, and cleaning procedures. Create SOPs for 
            consistent operations and maintain detailed logs of all maintenance activities.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-cyan-300 mb-2">📱 Mobile-Friendly Design</h2>
          <p className="text-dark-text-primary">
            Fully responsive design that works perfectly on desktop, tablet, and mobile devices. 
            Touch-friendly interface for logging activities in the garden.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-red-300 mb-2">🚀 Self-Hosted & Private</h2>
          <p className="text-dark-text-primary">
            Complete control over your data with self-hosted deployment. Support for Docker Compose, 
            Kubernetes, and traditional hosting. Your garden data stays private and secure.
          </p>
        </section>
      </div>
      <div className="mt-12 flex gap-4">
        <Link href="/dashboard" className="px-4 py-2 rounded bg-garden-400 text-dark-bg-primary font-bold hover:bg-garden-500">Go to Dashboard</Link>
        <Link href="/" className="px-4 py-2 rounded bg-dark-bg-primary text-garden-400 font-bold border border-garden-400 hover:bg-dark-bg-hover">Back to Home</Link>
      </div>
    </div>
  );
} 