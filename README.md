# Garden Logbook 🌱

A comprehensive, self-hosted web application for tracking and managing garden activities, plant health, environmental monitoring, and maintenance tasks. Built for serious growers who want complete control over their data.

## 🌟 Key Features

### 🔐 Secure Authentication
Multiple sign-in options including email magic links with 6-digit codes, Google OAuth, GitHub OAuth, and Discord OAuth. All authentication is handled securely with NextAuth.js.

### 🌱 Plant Management
Track plants across multiple gardens and rooms with detailed growth monitoring, health tracking, and strain management.

### 📅 Activity Calendar
Visual calendar view showing all plant activities, weather events, and custom notes with mobile-friendly interface.

### 🌦️ Environmental Monitoring
Real-time weather tracking and alerts with Govee sensor integration for precise environmental control.

### 📊 Sensor Dashboard
Monitor environmental sensors with real-time readings, battery status, and zone integration.

### 🧮 Grow Calculators
Professional-grade calculators for CFM (airflow), Jack's 3-2-1 nutrients, and compost tea brewing.

### 🏗️ Garden Organization
Multi-garden and room management with zones, equipment tracking, and detailed organization.

### 📝 Activity Logging
Comprehensive logging system for watering, feeding, training, pest management, and plant health.

### ⚠️ Smart Alerts
Weather-based notifications for frost, heat, drought, and other conditions with customizable thresholds.

### 🔧 Equipment & Maintenance
Track equipment usage, maintenance schedules, and cleaning procedures with detailed SOPs.

### 📱 Mobile-Friendly
Fully responsive design optimized for use in the garden on any device.

### 📈 Analytics & Insights
Dashboard analytics showing garden overview, plant statistics, and environmental insights.

### 🌡️ Sensor Integration
Govee device integration for real-time temperature, humidity, and VPD monitoring.

---

## 🚀 Quick Start

### Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/garden-logbook.git
   cd garden-logbook
   ```

2. **Build and start the app:**
   ```bash
   sudo docker compose build
   sudo docker compose up -d
   ```

3. **Run database migrations:**
   ```bash
   sudo docker compose exec app npx prisma migrate deploy
   ```

4. **Access the app:**
   - Open http://localhost:3000 in your browser

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   ```bash
   npm run setup
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   - Open http://localhost:3000 in your browser

---

## 📋 Prerequisites

- **Node.js** (v18 or later)
- **PostgreSQL** (v14 or later)
- **Docker** (optional, for containerized deployment)
- **npm** or **yarn**

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/garden"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Email Provider (for magic links)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Govee API (optional, for sensor integration)
GOVEE_API_KEY_ENCRYPTION_KEY=your-encryption-key
```

See `.env.example` for a complete template.

---

## 🐳 Docker Deployment

### Production Deployment

1. **Build the images:**
   ```bash
   sudo docker compose build
   ```

2. **Start the services:**
   ```bash
   sudo docker compose up -d
   ```

3. **Check logs:**
   ```bash
   sudo docker compose logs -f app
   ```

### Kubernetes/k3s Deployment

1. **Build the Docker image:**
   ```bash
   sudo docker compose build
   ```

2. **Save the image to a tarball:**
   ```bash
   sudo docker save -o garden-logbook-app.tar garden-logbook-app:latest
   ```

3. **Import into k3s/containerd:**
   ```bash
   sudo ctr -n k8s.io images import garden-logbook-app.tar
   ```

4. **Apply Kubernetes manifests:**
   ```bash
   kubectl apply -f k8s/cronjob.yaml
   ```

---

## 🗄️ Database Management

### Create a Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Deploy Migrations (Production)
```bash
npx prisma migrate deploy
```

### Reset Database
```bash
npm run db:reset
```

### Backup Schema
```bash
npm run db:backup
```

### Check Migration Status
```bash
npm run check:migrations
```

---

## 🔐 Authentication Setup

### Email Authentication (Magic Links)

1. Configure SMTP settings in `.env`
2. For Gmail users:
   - Enable 2-factor authentication
   - Generate an app password
   - Use the app password in `EMAIL_SERVER_PASSWORD`

### OAuth Providers

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `https://your-domain.com/api/auth/callback/google`

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `https://your-domain.com/api/auth/callback/github`

#### Discord OAuth
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Add OAuth2 redirect URL: `https://your-domain.com/api/auth/callback/discord`

---

## 📱 Features in Detail

### Plant Management
- Track individual plants through all growth stages
- Monitor health and growth progress
- Strain database with detailed information
- Plant history and activity logs
- Multi-garden and room organization

### Grow Calculators
- **CFM Calculator**: Calculate proper ventilation requirements
- **Jacks 3-2-1 Calculator**: Advanced nutrient mixing with luxury uptake mode
- **Tea Brewer Calculator**: Compost tea recipes by growth stage

### Environmental Monitoring
- Real-time weather data integration
- Govee sensor support for temperature, humidity, and VPD
- Automatic alerts for weather events
- Historical data visualization

### Activity Logging
- Custom log templates
- Comprehensive activity tracking
- Watering, feeding, training logs
- Pest and disease management
- Equipment usage tracking

### Garden Organization
- Multiple gardens support
- Room and zone management
- Equipment tracking
- Maintenance schedules
- Cleaning SOPs

---

## 🛠️ Development

### Project Structure
```
garden-logbook/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── gardens/           # Garden pages
│   ├── calc/              # Calculator pages
│   ├── sensors/           # Sensor management
│   └── ...
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/                # Database schema and migrations
└── public/                # Static assets
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run setup` - Initial setup script
- `npm run db:reset` - Reset database
- `npm run db:backup` - Backup schema
- `npm run check:migrations` - Check migration status

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify database exists
sudo -u postgres psql -l

# Create database if missing
sudo -u postgres createdb garden
```

### Migration Issues
```bash
# Reset and reapply migrations
npm run db:reset
npx prisma migrate deploy
```

### Docker Issues
```bash
# View logs
sudo docker compose logs -f app

# Restart services
sudo docker compose restart

# Rebuild containers
sudo docker compose build --no-cache
sudo docker compose up -d
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Prisma](https://www.prisma.io/)
- UI components with [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

## 📸 Screenshots

![Sign In Page](Images/SharpShot_20260121_162042.png)
*Secure authentication with multiple sign-in options: Google OAuth, GitHub OAuth, and Discord OAuth*

![Weather Monitoring](Images/SharpShot_20260121_163620.png)
*Weather page showing real-time weather status for multiple gardens with active alerts and forecast information*

![Sensor Charts](Images/SharpShot_20260121_163633.png)
*Environmental monitoring dashboard with time-series graphs for Temperature (°F), Humidity (%), and VPD (kPa) with adjustable date ranges*

![Calculator Overview](Images/SharpShot_20260121_163707.png)
*Professional Nutrient Calculators page showcasing Jack's 3-2-1 Calculator and Tea Brewer Calculator features*

![Equipment Management](Images/SharpShot_20260121_163722.png)
*Equipment detail page showing RO System information, maintenance tasks, and equipment logs*

![Tea Brewer Calculator](Images/SharpShot_20260121_163852.png)
*Tea Brewer Calculator interface with growth stage selection, brew size input, water temperature settings, and calculated recipe amounts*

![My Gardens](Images/SharpShot_20260121_163907.png)
*My Gardens page displaying garden cards with room counts, member information, and recent activity logs*

![Activity Calendar](Images/SharpShot_20260121_163918.png)
*Calendar view for January 2026 showing weather alerts and plant activities with day-by-day event tracking*

![Sensor Dashboard](Images/SharpShot_20260121_164138.png)
*Sensor Dashboard showing total sensors, linked zones, active zones, total readings, and recent sensor activity with zone status*

![CFM Calculator](Images/SharpShot_20260121_164205.png)
*CFM Calculator for calculating proper ventilation requirements with room dimensions, exchange intervals, and carbon filter options*

![Govee Device Management](Images/SharpShot_20260121_164306.png)
*Govee Device Management page showing device status, online/offline indicators, temperature, humidity, and VPD readings*

![Jacks 3-2-1 Calculator](Images/SharpShot_20260121_164342.png)
*Jacks 3-2-1 Calculator showing nutrient mix calculations for Vegetative stage with Part A, Part B, and Epsom Salt amounts*

![Nutrient pH Ranges](Images/SharpShot_20260121_164354.png)
*Nutrient Uptake pH Ranges settings with CO2 enrichment toggles, PPM scale options, solution volume inputs, and symptom-based adjustments*

![Notifications](Images/SharpShot_20260121_164407.png)
*Notifications page displaying forecasted weather alerts with detailed conditions for specific zones and plants*

![Jacks Calculator Table](Images/SharpShot_20260121_164421.png)
*Jacks 3-2-1 Calculator main view showing nutrient schedule table for all growth stages from Propagation to Flush*

![Garden Detail View](Images/SharpShot_20260121_164641.png)
*BMO garden detail page showing rooms/plots, plant counts, members, and comprehensive activity logs with timestamps*

![Room Management](Images/SharpShot_20260121_172149.png)
*Room detail view (Yard) showing equipment, cleaning SOPs, maintenance tasks, and zone management with activity logs*

![Garage Room View](Images/SharpShot_20260121_172230.png)
*Garage room view displaying equipment list, cleaning SOPs, maintenance tasks, and available zones (Foyer, Main Room, Tent)*

![Zone Detail View](Images/SharpShot_20260121_172259.png)
*Main Room zone detail view showing zone statistics, weather alert settings, and equipment list with maintenance task warnings*

![Feature Overview](Images/SharpShot_20260121_172432.png)
*Professional Garden Management Features overview page showcasing all 11 key features with descriptions and sub-features*

![Log Entries](Images/SharpShot_20260121_172745.png)
*Log Entries page with advanced search and filtering options, displaying sensor alerts and activity logs with detailed timestamps*

![Dashboard](Images/SharpShot_20260121_172753.png)
*Main Dashboard showing plant statistics, weather alerts summary, garden overview, and recent activity*

---

**Happy Gardening! 🌿**
