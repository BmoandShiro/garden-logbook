import Link from 'next/link';
import { 
  Leaf, 
  Calculator, 
  Calendar, 
  CloudRain, 
  Database, 
  Bell, 
  BarChart3, 
  Settings, 
  Shield, 
  Smartphone, 
  Zap, 
  Thermometer, 
  Droplets, 
  Wind, 
  Flower, 
  FileText, 
  Users, 
  Wrench, 
  Sprout,
  Beaker,
  Coffee,
  ChevronRight
} from 'lucide-react';

export default function LearnMorePage() {
  const features = [
    {
      icon: <Leaf className="h-8 w-8" />,
      title: "Plant Management",
      description: "Track individual plants through all growth stages with detailed logs, health monitoring, and strain management.",
      features: ["Growth stage tracking", "Health monitoring", "Strain database", "Plant history", "Multi-garden support"]
    },
    {
      icon: <Calculator className="h-8 w-8" />,
      title: "Nutrient Calculators",
      description: "Professional Jack's 3-2-1 calculator with luxury uptake mode and integrated tea brewer for organic feeding.",
      features: ["Jack's 3-2-1 calculator", "Luxury uptake mode", "Tea brewer calculator", "PPM scaling", "Auto-logging"]
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Activity Calendar",
      description: "Visual calendar showing all plant activities, weather events, and custom notes with mobile-friendly interface.",
      features: ["Visual calendar", "Activity tracking", "Custom notes", "Mobile responsive", "Color-coded events"]
    },
    {
      icon: <CloudRain className="h-8 w-8" />,
      title: "Weather Monitoring",
      description: "Real-time weather tracking with automatic alerts for heat, frost, wind, and precipitation events.",
      features: ["Real-time weather", "Automatic alerts", "Forecast integration", "Location-based", "Alert logging"]
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: "Smart Notifications",
      description: "Customizable notifications for weather alerts, plant events, and maintenance reminders.",
      features: ["Weather alerts", "Plant reminders", "Custom preferences", "Email notifications", "In-app alerts"]
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Dashboard Analytics",
      description: "Comprehensive dashboard showing garden overview, plant statistics, and environmental insights.",
      features: ["Garden overview", "Plant statistics", "Environmental data", "Alert summaries", "Growth insights"]
    },
    {
      icon: <Flower className="h-8 w-8" />,
      title: "Garden Management",
      description: "Organize plants into gardens and rooms with detailed management for commercial and home operations.",
      features: ["Multi-garden support", "Room organization", "Zone management", "Equipment tracking", "SOP management"]
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Comprehensive Logging",
      description: "Detailed logging system for watering, feeding, training, pest management, and plant health.",
      features: ["Watering logs", "Nutrient tracking", "Training records", "Pest management", "Health monitoring"]
    },
    {
      icon: <Sprout className="h-8 w-8" />,
      title: "Seed Management",
      description: "Track seeds from germination through harvest with detailed strain information and growth history.",
      features: ["Seed tracking", "Strain database", "Germination logs", "Growth history", "Harvest records"]
    },
    {
      icon: <Wrench className="h-8 w-8" />,
      title: "Equipment & Maintenance",
      description: "Track equipment usage, maintenance schedules, and cleaning procedures with detailed SOPs.",
      features: ["Equipment tracking", "Maintenance schedules", "Cleaning SOPs", "Task management", "Usage logs"]
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Private",
      description: "Self-hosted solution with secure authentication and complete control over your garden data.",
      features: ["Self-hosted", "Secure auth", "Data privacy", "Docker support", "Team collaboration"]
    }
  ];

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

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-dark-text-primary mb-4">
            Professional Garden Management Features
          </h2>
          <p className="text-lg text-dark-text-secondary max-w-2xl mx-auto">
            Everything you need to track, monitor, and optimize your growing operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-dark-bg-secondary border border-dark-border rounded-lg p-6 hover:border-garden-500 transition-colors group"
            >
              <div className="flex items-center mb-4">
                <div className="text-garden-400 group-hover:text-garden-300 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-dark-text-primary ml-3">
                  {feature.title}
                </h3>
              </div>
              <p className="text-dark-text-secondary mb-4">
                {feature.description}
              </p>
              <ul className="space-y-2 mb-4">
                {feature.features.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center text-sm text-dark-text-secondary">
                    <div className="w-1.5 h-1.5 bg-garden-400 rounded-full mr-3 flex-shrink-0"></div>
                    {item}
                  </li>
                ))}
              </ul>
              
              {/* Example Display */}
              {/* Removed example display as per edit hint */}
            </div>
          ))}
        </div>
      </div>

      {/* Calculator Highlight Section */}
      <div className="bg-dark-bg-secondary border-t border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-text-primary mb-4">
              Professional Nutrient Calculators
            </h2>
            <p className="text-lg text-dark-text-secondary max-w-2xl mx-auto">
              Advanced calculators designed for serious growers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-dark-bg-primary border border-dark-border rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Calculator className="h-8 w-8 text-garden-400 mr-3" />
                <h3 className="text-xl font-semibold text-dark-text-primary">Jack's 3-2-1 Calculator</h3>
              </div>
              <p className="text-dark-text-secondary mb-4">
                Professional nutrient calculator with luxury uptake mode, symptom-based adjustments, 
                and automatic PPM scaling for optimal plant nutrition.
              </p>
              <ul className="space-y-2 text-sm text-dark-text-secondary mb-4">
                <li>• PPM-based calculations with 500/700 scale support</li>
                <li>• Luxury uptake mode for advanced feeding</li>
                <li>• Symptom-based nutrient adjustments</li>
                <li>• Automatic watering log integration</li>
                <li>• CO2 enrichment considerations</li>
              </ul>
              
              {/* Expanded Jacks 3-2-1 Details */}
              <div className="mt-6 p-4 bg-dark-bg-secondary rounded-lg border border-dark-border">
                <h4 className="text-lg font-semibold text-garden-400 mb-3">Advanced Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-dark-text-primary mb-2">Nutrient Management</h5>
                    <ul className="space-y-1 text-dark-text-secondary">
                      <li>• Stage-specific PPM targets</li>
                      <li>• pH range optimization</li>
                      <li>• Runoff analysis</li>
                      <li>• Deficiency/toxicity detection</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-dark-text-primary mb-2">Environmental Factors</h5>
                    <ul className="space-y-1 text-dark-text-secondary">
                      <li>• CO2 enrichment scaling</li>
                      <li>• Temperature adjustments</li>
                      <li>• Root size considerations</li>
                      <li>• Transition warnings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-dark-bg-primary border border-dark-border rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Coffee className="h-8 w-8 text-garden-400 mr-3" />
                <h3 className="text-xl font-semibold text-dark-text-primary">Tea Brewer Calculator</h3>
              </div>
              <p className="text-dark-text-secondary mb-4">
                Organic feeding calculator for compost tea brewing with stage-specific recipes 
                and temperature-based brew duration recommendations.
              </p>
              <ul className="space-y-2 text-sm text-dark-text-secondary">
                <li>• Stage-specific ingredient scaling</li>
                <li>• Temperature-based brew duration</li>
                <li>• Automatic log integration</li>
                <li>• Professional recipe management</li>
                <li>• Organic feeding optimization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-dark-bg-primary to-dark-bg-secondary border-t border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-dark-text-primary mb-4">
            Ready to Optimize Your Garden?
          </h2>
          <p className="text-lg text-dark-text-secondary mb-8 max-w-2xl mx-auto">
            Join growers who are already using Garden Logbook to track, monitor, and optimize their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/gardens" 
              className="inline-flex items-center px-8 py-4 rounded-lg bg-garden-500 hover:bg-garden-600 text-white font-semibold text-lg transition-colors"
            >
              Start Your Garden Log
              <ChevronRight className="ml-2 h-6 w-6" />
            </Link>
            <Link 
              href="/calc" 
              className="inline-flex items-center px-8 py-4 rounded-lg bg-dark-bg-primary border border-dark-border hover:bg-dark-bg-secondary text-dark-text-primary font-semibold text-lg transition-colors"
            >
              Try Calculators
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 