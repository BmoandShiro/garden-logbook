# Garden Logbook 🌱

A comprehensive, self-hosted web application for tracking and managing garden activities, plant health, environmental monitoring, and maintenance tasks. Built for serious growers who want complete control over their data.

![Garden Logbook Dashboard](Images/SharpShot_20260121_162042.png)
*Main dashboard showing garden overview and quick statistics*

## 🌟 Key Features

### 🔐 Secure Authentication
Multiple sign-in options including email magic links with 6-digit codes, Google OAuth, GitHub OAuth, and Discord OAuth. All authentication is handled securely with NextAuth.js.

![Authentication Options](Images/SharpShot_20260121_163620.png)
*Flexible authentication options for secure access*

### 🌱 Plant Management
Track plants across multiple gardens and rooms with detailed growth monitoring, health tracking, and strain management.

![Plant Management](Images/SharpShot_20260121_163633.png)
*Comprehensive plant tracking with growth stages and health monitoring*

### 📅 Activity Calendar
Visual calendar view showing all plant activities, weather events, and custom notes with mobile-friendly interface.

![Activity Calendar](Images/SharpShot_20260121_163707.png)
*Interactive calendar view of all garden activities and events*

### 🌦️ Environmental Monitoring
Real-time weather tracking and alerts with Govee sensor integration for precise environmental control.

![Weather Monitoring](Images/SharpShot_20260121_163722.png)
*Real-time weather data and forecast integration*

### 📊 Sensor Dashboard
Monitor environmental sensors with real-time readings, battery status, and zone integration.

![Sensor Dashboard](Images/SharpShot_20260121_163852.png)
*Comprehensive sensor dashboard with device status and readings*

### 🧮 Grow Calculators
Professional-grade calculators for CFM (airflow), Jack's 3-2-1 nutrients, and compost tea brewing.

![CFM Calculator](Images/SharpShot_20260121_163907.png)
*CFM calculator for determining proper ventilation requirements*

![Jacks 3-2-1 Calculator](Images/SharpShot_20260121_163918.png)
*Advanced nutrient calculator with Jack's 3-2-1 formula and luxury uptake mode*

![Tea Brewer Calculator](Images/SharpShot_20260121_164138.png)
*Compost tea brewer calculator with growth stage-specific recipes*

### 🏗️ Garden Organization
Multi-garden and room management with zones, equipment tracking, and detailed organization.

![Garden Overview](Images/SharpShot_20260121_164205.png)
*Garden overview showing rooms, zones, and plant distribution*

![Room Management](Images/SharpShot_20260121_164306.png)
*Detailed room view with zones, equipment, and plant organization*

![Zone Details](Images/SharpShot_20260121_164342.png)
*Zone management with sensor integration and plant assignments*

### 📝 Activity Logging
Comprehensive logging system for watering, feeding, training, pest management, and plant health.

![Activity Logs](Images/SharpShot_20260121_164354.png)
*Detailed activity logging with custom templates and data entry*

![Log Entry Form](Images/SharpShot_20260121_164407.png)
*Customizable log entry forms with field validation*

### ⚠️ Smart Alerts
Weather-based notifications for frost, heat, drought, and other conditions with customizable thresholds.

![Weather Alerts](Images/SharpShot_20260121_164421.png)
*Weather alert system with customizable thresholds and notifications*

### 🔧 Equipment & Maintenance
Track equipment usage, maintenance schedules, and cleaning procedures with detailed SOPs.

![Equipment Management](Images/SharpShot_20260121_164641.png)
*Equipment tracking with maintenance schedules and SOPs*

### 📱 Mobile-Friendly
Fully responsive design optimized for use in the garden on any device.

![Mobile View](Images/SharpShot_20260121_172149.png)
*Mobile-optimized interface for garden use*

### 📈 Analytics & Insights
Dashboard analytics showing garden overview, plant statistics, and environmental insights.

![Dashboard Analytics](Images/SharpShot_20260121_172230.png)
*Comprehensive analytics dashboard with garden statistics*

![Plant Statistics](Images/SharpShot_20260121_172259.png)
*Detailed plant statistics and growth tracking*

### 🌡️ Sensor Integration
Govee device integration for real-time temperature, humidity, and VPD monitoring.

![Sensor Integration](Images/SharpShot_20260121_172432.png)
*Govee sensor integration with real-time readings*

![Sensor Charts](Images/SharpShot_20260121_172745.png)
*Historical sensor data visualization with charts*

![Sensor Settings](Images/SharpShot_20260121_172753.png)
*Sensor configuration and zone linking interface*

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

**Happy Gardening! 🌿**
