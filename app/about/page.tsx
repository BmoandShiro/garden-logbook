import Link from 'next/link';
import { 
  Shield, 
  Leaf, 
  CloudRain, 
  Thermometer, 
  Bell, 
  Calendar, 
  BarChart3, 
  Flower, 
  Wrench, 
  Smartphone, 
  Zap,
  ChevronRight
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark-bg-primary">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-dark-bg-secondary to-dark-bg-primary border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-garden-400 mb-6">
              Garden Logbook
            </h1>
            <p className="text-xl text-dark-text-secondary max-w-3xl mx-auto mb-8">
              The complete garden management platform for tracking plants, monitoring environments, 
              and optimizing your growing operations with professional-grade tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center px-6 py-3 rounded-lg bg-garden-500 hover:bg-garden-600 text-white font-semibold transition-colors"
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/" 
                className="inline-flex items-center px-6 py-3 rounded-lg bg-dark-bg-primary border border-dark-border hover:bg-dark-bg-secondary text-dark-text-primary font-semibold transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-dark-text-secondary mb-12 text-center">
            Welcome to Garden Logbook! Here's a comprehensive overview of the features you can use to optimize your gardening journey:
      </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Secure Authentication */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Secure Authentication</h2>
              </div>
              <p className="text-dark-text-secondary">
            Sign in securely with multiple options: Google OAuth, Discord OAuth, or email magic links with 6-digit codes. 
            Perfect for both personal use and team collaboration. All authentication is handled securely with NextAuth.js.
          </p>
            </div>

            {/* Plant Tracking */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <Leaf className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Plant Tracking</h2>
              </div>
              <p className="text-dark-text-secondary">
            Monitor growth stages, watering schedules, nutrient requirements, and health for each plant. 
            Easily log activities and view plant history. Track multiple gardens and rooms with detailed plant management.
          </p>
            </div>

            {/* Environmental Monitoring */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <CloudRain className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Environmental Monitoring</h2>
              </div>
              <p className="text-dark-text-secondary">
            Record and analyze temperature, humidity, wind, and precipitation. Get automatic weather alerts 
            tailored to your plants' sensitivities and location. Integrate with Govee sensors for real-time monitoring and automated data collection.
          </p>
            </div>

            {/* Smart Sensor Integration */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <Thermometer className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Smart Sensor Integration</h2>
              </div>
              <p className="text-dark-text-secondary">
            Connect Govee temperature and humidity sensors for automated environmental monitoring. 
            Real-time data collection with automatic logging, battery level monitoring, and device management. 
            Perfect for maintaining optimal growing conditions in grow rooms, greenhouses, or outdoor gardens.
          </p>
            </div>

            {/* Weather Alerts & Notifications */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <Bell className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Weather Alerts & Notifications</h2>
              </div>
              <p className="text-dark-text-secondary mb-4">
            Receive real-time and forecasted weather alerts for heat, frost, wind, drought, flood, and heavy rain. 
            Alerts are logged, color-coded, and shown in your dashboard, calendar, and notifications.
          </p>
              
              {/* Weather Alert Guide */}
              <div className="bg-dark-bg-primary rounded p-4 border border-dark-border">
                <h3 className="text-lg font-semibold text-garden-400 mb-3">How to Read Weather Alerts</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-garden-400">Forecasted Alerts:</span>
                    <p className="text-dark-text-secondary mt-1">
                      Each forecasted alert shows the day label (e.g., Friday Night) and the value/unit 
                      (e.g., 80°F for heat, 80% for drought chance of rain, 12 mph for wind).
                    </p>
                    <ul className="mt-2 space-y-1 text-dark-text-secondary">
                      <li>• <span className="text-red-400 font-semibold">Heat:</span> High temperature forecast</li>
                      <li>• <span className="text-sky-300 font-semibold">Frost:</span> Low temperature forecast</li>
                      <li>• <span className="text-orange-400 font-semibold">Drought:</span> Chance of rain</li>
                      <li>• <span className="text-slate-400 font-semibold">Wind:</span> Wind speed</li>
                      <li>• <span className="text-blue-700 font-semibold">Heavy Rain:</span> Precipitation</li>
                      <li>• <span className="text-amber-700 font-semibold">Flood:</span> Flood risk</li>
            </ul>
          </div>
                  <div>
                    <span className="font-semibold text-garden-400">Current Alerts:</span>
                    <p className="text-dark-text-secondary mt-1">
                      These show the current weather conditions affecting your plants, grouped by alert type. 
                      Each type is color-coded (e.g., red for heat, blue for heavy rain).
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-garden-400">Tips:</span>
                    <p className="text-dark-text-secondary mt-1">
                      Hover or tap on alerts for more details. Check your dashboard and calendar for a summary 
                      of all active and forecasted alerts. Adjust your plant sensitivities and notification preferences 
                      in your user settings for personalized alerts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar & Logs */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <Calendar className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Calendar & Logs</h2>
              </div>
              <p className="text-dark-text-secondary">
            View all your plant activities and weather events on a responsive calendar. Add custom notes, 
            see color-coded log types, and tap for details on mobile. Create custom log templates for different activities.
          </p>
            </div>

            {/* Notifications & Preferences */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <Bell className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Notifications & Preferences</h2>
              </div>
              <p className="text-dark-text-secondary">
            Get timely notifications for weather, tasks, and plant events. Customize your notification frequency 
            and weather alert preferences in your user settings.
          </p>
            </div>

            {/* Dashboard Analytics */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Dashboard Analytics</h2>
              </div>
              <p className="text-dark-text-secondary">
            See a summary of your gardens, active plants, species, strains, and all current/forecasted weather alerts. 
            Hover for alert expiration details and get insights into your gardening patterns.
          </p>
            </div>

            {/* Garden & Room Management */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <Flower className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Garden & Room Management</h2>
              </div>
              <p className="text-dark-text-secondary">
            Organize your plants into gardens and rooms with detailed management. Track equipment, 
            cleaning SOPs, and maintenance tasks. Perfect for commercial operations or large home gardens.
          </p>
            </div>

            {/* Equipment & Maintenance */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <Wrench className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Equipment & Maintenance</h2>
              </div>
              <p className="text-dark-text-secondary">
            Track equipment usage, maintenance schedules, and cleaning procedures. Create SOPs for 
            consistent operations and maintain detailed logs of all maintenance activities.
          </p>
            </div>

            {/* Mobile-Friendly Design */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <Smartphone className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Mobile-Friendly Design</h2>
              </div>
              <p className="text-dark-text-secondary">
            Fully responsive design that works perfectly on desktop, tablet, and mobile devices. 
            Touch-friendly interface for logging activities in the garden.
          </p>
            </div>

            {/* Self-Hosted & Private */}
            <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors">
              <div className="flex items-center mb-4">
                <Zap className="h-8 w-8 text-garden-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text-primary">Self-Hosted & Private</h2>
              </div>
              <p className="text-dark-text-secondary">
            Complete control over your data with self-hosted deployment. Support for Docker Compose, 
            Kubernetes, and traditional hosting. Your garden data stays private and secure.
          </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center px-6 py-3 rounded-lg bg-garden-500 hover:bg-garden-600 text-white font-semibold transition-colors"
              >
                Go to Dashboard
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/" 
                className="inline-flex items-center px-6 py-3 rounded-lg bg-dark-bg-primary border border-dark-border hover:bg-dark-bg-secondary text-dark-text-primary font-semibold transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
      </div>
      </div>
    </div>
  );
} 