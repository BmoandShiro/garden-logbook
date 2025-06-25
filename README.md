# Garden Logbook 🌱

A comprehensive, self-hosted web application for tracking and managing garden activities, plant health, environmental monitoring, and maintenance tasks.

## 🌟 Key Features

- **🔐 Secure Authentication**: Multiple sign-in options (Email magic links with 6-digit codes, Google OAuth, GitHub OAuth, Discord OAuth)
- **🌱 Plant Management**: Track plants across multiple gardens and rooms with detailed growth monitoring
- **🌦️ Environmental Monitoring**: Real-time weather tracking and alerts with Govee sensor integration
- **📅 Activity Logging**: Comprehensive calendar view with custom log templates and activity tracking
- **⚠️ Smart Alerts**: Weather-based notifications for frost, heat, drought, and other conditions
- **🏗️ Garden Organization**: Multi-garden and room management with equipment tracking
- **🔧 Maintenance Tracking**: Equipment maintenance, cleaning SOPs, and task management
- **📱 Mobile-Friendly**: Fully responsive design for use in the garden
- **🚀 Self-Hosted**: Complete data privacy with Docker, Kubernetes, or traditional hosting support

## 🚀 Quick Start

Choose your deployment method:

| Use Case                | Section to Read         |
|------------------------|------------------------|
| Run in Docker Compose  | General Use            |
| Deploy to Kubernetes/k3s | General Use (Kubernetes) |
| Local development/coding | Development            |
| Database migrations    | Development            |

---

# General Use

## Docker Compose (Production or Local)

1. **Build and start the app:**
   ```bash
   sudo docker compose build
   sudo docker compose up -d
   ```
2. **Access the app:**
   - http://localhost:3000 (or your server's IP)

3. **Run database migrations (if needed):**
   ```bash
   sudo docker compose exec app npx prisma migrate deploy
   ```

---

## Kubernetes/k3s Deployment

### For k3s (or any cluster using containerd):

1. **Build the Docker image locally:**
   ```bash
   sudo docker compose build
   ```
2. **Save the image to a tarball:**
   ```bash
   sudo docker save -o garden-logbook-cron.tar garden-logbook-cron:latest
   ```
3. **Import the image into k3s/containerd:**
   ```bash
   sudo ctr -n k8s.io images import garden-logbook-cron.tar
   ```
4. **Apply the Kubernetes manifest:**
   ```bash
   kubectl apply -f k8s/cronjob.yaml
   ```
5. **(Optional) For app image:**
   - Repeat the above steps for `garden-logbook-app.tar` if you update the main app image.

**Note:** If your cluster is remote or multi-node, push your image to a registry and update the manifest's `image:` field accordingly.

---

# Development

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up the database:**
   ```bash
   npm run db:setup
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Access the app:**
   - http://localhost:3000

## Database Migration Workflow

- **Create a new migration:**
  ```bash
  npx prisma migrate dev --name <migration-name>
  ```
- **Deploy migrations (production):**
  ```bash
  npx prisma migrate deploy
  ```

## Running Tests

- (Add your test instructions here if you have tests)

---

# Kubernetes CronJob: Updating the Image

Whenever you change code for the cron job (e.g., `cron-kube.ts`):

1. **Rebuild the Docker image:**
   ```bash
   sudo docker compose build
   ```
2. **Save the new image to a tarball:**
   ```bash
   sudo docker save -o garden-logbook-cron.tar garden-logbook-cron:latest
   ```
3. **Import the tarball into k3s/containerd:**
   ```bash
   sudo ctr -n k8s.io images import garden-logbook-cron.tar
   ```
4. **Re-apply the manifest if you changed the image or command:**
   ```bash
   kubectl apply -f k8s/cronjob.yaml
   ```

---

# Troubleshooting

- See the original troubleshooting section below for common issues with Node.js, PostgreSQL, and Docker.
- For k3s image issues, make sure you import the tarball after every code change.

---

# Original Documentation

<!-- Keep the rest of your original README content here, such as detailed setup for Arch Linux, environment variables, etc. -->

---

Happy gardening! 🌿

## Table of Contents
- [What You'll Need](#what-youll-need)
- [Setting Up Arch Linux](#setting-up-arch-linux)
- [Installing Required Software](#installing-required-software)
- [Setting Up the Application](#setting-up-the-application)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [Database Migration Workflow](#database-migration-workflow)
- [Authentication Setup](#authentication-setup)
- [Kubernetes Deployment (K3s, Minikube, etc.)](#kubernetes-deployment-k3s-minikube-etc)

## What You'll Need

1. A computer running Arch Linux
2. Basic knowledge of using a terminal
3. An internet connection
4. About 30 minutes of time

## Setting Up Arch Linux

If you're new to Arch Linux, here are the basic steps to get started:

1. **Install Arch Linux**
   - Follow the [official installation guide](https://wiki.archlinux.org/title/Installation_guide)
   - Or use an installer like [archinstall](https://wiki.archlinux.org/title/Archinstall)

2. **Update Your System**
   ```bash
   sudo pacman -Syu
   ```

3. **Install Basic Tools**
   ```bash
   sudo pacman -S git base-devel
   ```

## Installing Required Software

1. **Install Node.js and npm**
   ```bash
   sudo pacman -S nodejs npm
   ```

2. **Install PostgreSQL**
   ```bash
   sudo pacman -S postgresql
   ```

3. **Start and Enable PostgreSQL**
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

4. **Set Up PostgreSQL User**
   ```bash
   sudo -u postgres psql
   ```
   In the PostgreSQL prompt:
   ```sql
   ALTER USER postgres WITH PASSWORD 'postgres';
   \q
   ```

## Setting Up the Application

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/garden-logbook.git
   cd garden-logbook
   ```

2. **Run the Setup Script**
   ```bash
   npm run setup
   ```
   This script will:
   - Install all required software
   - Set up the database
   - Create necessary tables
   - Create an admin user

3. **Configure Environment Variables**
   The setup script will create a `.env` file. You may need to edit it:
   ```bash
   nano .env
   ```
   Make sure these values are correct:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/garden_logbook"
   ```

## Running the Application

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Access the Application**
   - Open your web browser
   - Go to http://localhost:3000

3. **Login**
   - Email: admin@example.com
   - Password: admin123
   - ⚠️ Change these credentials immediately after first login!

## Troubleshooting

### Common Issues and Solutions

1. **PostgreSQL Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   
   # If not running, start it
   sudo systemctl start postgresql
   
   # Create the database if it doesn't exist
   sudo -u postgres createdb garden_logbook
   ```

2. **Node.js Version Issues**
   ```bash
   # Check your Node.js version
   node --version
   
   # If it's too old, update it
   sudo pacman -Syu nodejs
   ```

3. **Dependency Installation Failed**
   ```bash
   # Try installing with legacy peer deps
   npm install --legacy-peer-deps
   ```

4. **Database Migration Failed**
   ```bash
   # Reset the database
   npm run db:reset
   ```

### Getting Help

If you encounter any issues:
1. Check the error messages in the terminal
2. Look for similar issues in the [GitHub Issues](https://github.com/yourusername/garden-logbook/issues)
3. Ask for help in the project's discussion forum

## Next Steps

Once you have the application running:
1. Explore the features
2. Add your garden data
3. Customize the application to your needs
4. Consider contributing to the project

## Need More Help?

- Check out the [Arch Linux Wiki](https://wiki.archlinux.org/)
- Visit the [Node.js documentation](https://nodejs.org/en/docs/)
- Read the [PostgreSQL documentation](https://www.postgresql.org/docs/)
- Join our community forum for support

Happy gardening! 🌿

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- npm or yarn

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/garden-logbook.git
   cd garden-logbook
   ```

2. Run the setup script:
   ```bash
   npm run setup
   ```
   This will:
   - Install all dependencies
   - Set up the database
   - Create necessary tables
   - Seed initial data
   - Create an admin user

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the application at http://localhost:3000

## Manual Setup (if needed)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and other settings
   ```

3. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. Seed the database (optional):
   ```bash
   npm run db:seed
   ```

## Database Management

- Reset database: `npm run db:reset`
- Backup schema: `npm run db:backup`
- Check migration status: `npm run check:migrations`
- Validate Prisma schema: `npm run validate:prisma`

## Development

- Start development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`
- Lint code: `npm run lint`

## Default Admin Credentials

- Email: admin@example.com
- Password: admin123

**Note:** Change these credentials after first login for security.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Migration Workflow

### Before Committing Changes

1. **Check Migration Status**
   ```bash
   npm run check:migrations
   ```
   This will ensure your database schema is up to date.

2. **Create New Migrations**
   If you've made changes to the database schema:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

3. **Commit Process**
   The pre-commit hook will automatically:
   - Check migration status
   - Validate the Prisma schema
   - Prevent commits if migrations are pending

### Best Practices

1. **Always Create Migrations**
   - Never modify the database schema without creating a migration
   - Use descriptive names for migrations (e.g., `add_user_roles`)

2. **Testing Migrations**
   - Test migrations locally before pushing
   - Use `npm run db:reset` to test from scratch

3. **Backup Strategy**
   - Regularly backup your schema:
     ```bash
     npm run db:backup
     ```
   - Keep migration files in version control
   - Document any manual steps needed for migrations

4. **Team Collaboration**
   - Pull latest changes before creating new migrations
   - Resolve any migration conflicts before pushing
   - Communicate about database changes with the team

### Troubleshooting Migrations

1. **Migration Conflicts**
   ```bash
   # Reset the database
   npm run db:reset
   
   # Apply all migrations
   npx prisma migrate deploy
   ```

2. **Schema Validation Failed**
   ```bash
   # Validate the schema
   npm run validate:prisma
   
   # Fix any issues in schema.prisma
   ```

3. **Pending Migrations**
   ```bash
   # Check status
   npm run check:migrations
   
   # Apply pending migrations
   npx prisma migrate dev
   ```

## Complete Workflow Walkthrough

This section provides a step-by-step guide for the complete development cycle, from making changes to setting up on a fresh machine.

### Scenario: Adding a New Feature with Database Changes

#### 1. Starting Development (Current Machine)

```bash
# 1. Pull latest changes
git pull origin main

# 2. Start development server
npm run dev
```

#### 2. Making Database Changes

```bash
# 1. Modify your schema in prisma/schema.prisma
# For example, adding a new field to a model

# 2. Create a new migration
npx prisma migrate dev --name add_new_field

# 3. The migration will:
#    - Create a new migration file
#    - Apply the migration to your local database
#    - Regenerate the Prisma Client
```

#### 3. Testing Your Changes

```bash
# 1. Test your changes locally
# 2. If needed, reset the database to test from scratch
npm run db:reset
```

#### 4. Preparing to Commit

```bash
# 1. Check migration status
npm run check:migrations

# 2. Backup your schema (good practice)
npm run db:backup

# 3. Stage your changes
git add .
```

#### 5. Committing Changes

```bash
# 1. Try to commit
git commit -m "feat: add new field to model"

# The pre-commit hook will automatically:
# - Check migration status
# - Validate Prisma schema
# - Prevent commit if checks fail
```

#### 6. Pushing Changes

```bash
# 1. Push your changes
git push origin your-branch

# 2. Create a pull request if working in a team
```

### Scenario: Setting Up on a Fresh Machine

#### 1. Initial Setup (Fresh Arch Linux Installation)

```bash
# 1. Install required system packages
sudo pacman -Syu
sudo pacman -S nodejs npm postgresql git

# 2. Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Set up PostgreSQL user
sudo -u postgres psql
# In PostgreSQL prompt:
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

#### 2. Cloning and Setting Up the Project

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/garden-logbook.git
cd garden-logbook

# 2. Run the setup script
npm run setup
# This will:
# - Install dependencies
# - Set up the database
# - Run all migrations
# - Create an admin user
```

#### 3. Verifying the Setup

```bash
# 1. Check migration status
npm run check:migrations
# Should show: "Database schema is up to date"

# 2. Start the development server
npm run dev

# 3. Access the application
# Open http://localhost:3000 in your browser
```

### Common Scenarios and Solutions

#### 1. Migration Conflicts

```bash
# If you get migration conflicts after pulling:
npm run db:reset
npx prisma migrate deploy
```

#### 2. Schema Validation Failed

```bash
# If the schema validation fails:
npm run validate:prisma
# Fix any issues in schema.prisma
npx prisma generate
```

#### 3. Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify database exists
sudo -u postgres psql -l

# Create database if missing
sudo -u postgres createdb garden_logbook
```

#### 4. Pre-commit Hook Failing

```bash
# If the pre-commit hook fails:
# 1. Check migration status
npm run check:migrations

# 2. Apply any pending migrations
npx prisma migrate dev

# 3. Validate schema
npm run validate:prisma
```

### Best Practices Checklist

Before committing:
- [ ] Run `npm run check:migrations`
- [ ] Test your changes locally
- [ ] Backup your schema with `npm run db:backup`
- [ ] Ensure all migrations are applied

Before pushing:
- [ ] Pull latest changes
- [ ] Resolve any conflicts
- [ ] Run the test suite (if available)
- [ ] Verify the application works

On a fresh machine:
- [ ] Install all system prerequisites
- [ ] Start PostgreSQL service
- [ ] Run the setup script
- [ ] Verify migration status
- [ ] Test the application

### Troubleshooting Guide

#### Database Issues

1. **Can't connect to database**
   ```bash
   # Check PostgreSQL service
   sudo systemctl status postgresql
   
   # Verify database exists
   sudo -u postgres psql -l
   
   # Check connection string in .env
   cat .env | grep DATABASE_URL
   ```

2. **Migration failed**
   ```bash
   # Reset the database
   npm run db:reset
   
   # Try applying migrations again
   npx prisma migrate deploy
   ```

3. **Schema out of sync**
   ```bash
   # Pull latest schema
   npx prisma db pull
   
   # Generate new migration
   npx prisma migrate dev --name sync_schema
   ```

#### Development Environment Issues

1. **Node.js version mismatch**
   ```bash
   # Check current version
   node --version
   
   # Update Node.js
   sudo pacman -Syu nodejs
   ```

2. **Dependencies issues**
   ```bash
   # Clean install
   rm -rf node_modules
   npm install
   
   # If still issues
   npm install --legacy-peer-deps
   ```

3. **Git hooks not working**
   ```bash
   # Reinstall husky
   npm uninstall husky
   npm install --save-dev husky
   npx husky init
   ```

Remember to:
- Always create migrations for schema changes
- Test migrations locally before pushing
- Keep your schema backups up to date
- Communicate database changes with your team

## GitHub Desktop Workflow with Database Management

### Before Using GitHub Desktop

1. **Check Database Status**
   ```bash
   # Run this in your terminal before opening GitHub Desktop
   npm run check:migrations
   ```

2. **Backup Current Database State**
   ```bash
   # Create a backup of your current schema
   npm run db:backup
   ```

3. **Verify All Migrations Are Committed**
   ```bash
   # Check if all migration files are in git
   git status prisma/migrations/
   ```

### Using GitHub Desktop

1. **Before Committing**
   - Open GitHub Desktop
   - Review your changes
   - Make sure `prisma/migrations/` folder is included in the changes
   - Check that `.env` is NOT included (should be in .gitignore)

2. **Commit Message Format**
   ```
   feat: your feature description
   - Added new migration: prisma/migrations/YYYYMMDDHHMMSS_your_migration
   - Updated schema.prisma
   ```

3. **After Committing**
   ```bash
   # Verify the commit was successful
   git log -1
   ```

### Pulling Changes on Another Machine

1. **Before Pulling**
   ```bash
   # Backup current database state
   npm run db:backup
   ```

2. **Using GitHub Desktop to Pull**
   - Pull the changes
   - Watch for any merge conflicts in:
     - `prisma/schema.prisma`
     - `prisma/migrations/` folder

3. **After Pulling**
   ```bash
   # Install any new dependencies
   npm install

   # Apply new migrations
   npx prisma migrate deploy

   # Verify database is up to date
   npm run check:migrations
   ```

### Common Issues and Solutions

1. **Migration Files Missing After Pull**
   ```bash
   # Check if migrations are in the commit
   git log --name-status | grep migration

   # If missing, you may need to:
   git checkout origin/main -- prisma/migrations/
   ```

2. **Database Out of Sync**
   ```bash
   # Reset and reapply all migrations
   npm run db:reset
   npx prisma migrate deploy
   ```

3. **Schema Conflicts**
   ```bash
   # If you have local schema changes:
   # 1. Backup your current schema
   npm run db:backup

   # 2. Reset to the pulled version
   git checkout origin/main -- prisma/schema.prisma

   # 3. Create a new migration for your changes
   npx prisma migrate dev --name merge_changes
   ```

### Best Practices for GitHub Desktop Users

1. **Always Check These Before Committing**:
   - [ ] Migration files are included
   - [ ] `.env` is NOT included
   - [ ] Schema changes are properly migrated
   - [ ] Database is up to date

2. **Before Pulling**:
   - [ ] Backup current database
   - [ ] Check for local uncommitted changes
   - [ ] Note any local schema changes

3. **After Pulling**:
   - [ ] Run database checks
   - [ ] Apply new migrations
   - [ ] Verify application works

### Quick Reference for Terminal Commands

```bash
# Before committing
npm run check:migrations
npm run db:backup

# After pulling
npm install
npx prisma migrate deploy

# If something goes wrong
npm run db:reset
npx prisma migrate deploy
```

Remember:
- Always keep migration files in sync with schema changes
- Never commit `.env` file
- Backup your database before major changes
- Test the application after pulling changes

## Authentication Setup

Garden Logbook supports multiple authentication methods for secure access:

### 1. Email Authentication (Magic Links + 6-Digit Codes)

**Features:**
- Magic link authentication via email
- 6-digit code entry for easy mobile access
- Secure token-based verification
- 24-hour expiration for security

**Setup:**
1. Configure your SMTP settings in `.env` (see `.env.example`):
   ```
   EMAIL_SERVER_HOST=smtp.gmail.com
   EMAIL_SERVER_PORT=465
   EMAIL_SERVER_USER=your-email@gmail.com
   EMAIL_SERVER_PASSWORD=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

2. For Gmail users:
   - Enable 2-factor authentication
   - Generate an app password
   - Use the app password in `EMAIL_SERVER_PASSWORD`

3. Users can sign in by:
   - Clicking the magic link in their email, OR
   - Entering the 6-digit code shown in the email

### 2. OAuth Providers (Google, GitHub, Discord)

**Google OAuth Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create or edit an OAuth 2.0 Client ID
3. Add your domain as an authorized redirect URI:
   ```
   https://your-domain.com/api/auth/callback/google
   ```
4. Copy your client ID and secret to `.env`

**GitHub OAuth Setup:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set the callback URL to:
   ```
   https://your-domain.com/api/auth/callback/github
   ```
4. Copy your client ID and secret to `.env`

**Discord OAuth Setup:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Add OAuth2 redirect URL:
   ```
   https://your-domain.com/api/auth/callback/discord
   ```
4. Copy your client ID and secret to `.env`

### 3. Environment Variables

Add these to your `.env` file:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here

# Email Provider (for magic links and codes)
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
```

### Security Notes

- Keep your `.env` file private and add it to `.gitignore`
- Use strong, unique secrets for `NEXTAUTH_SECRET`
- For production, use environment-specific OAuth credentials
- Email authentication works out of the box for self-hosters
- OAuth providers require domain-specific setup

---

## Example .env

See `.env.example` for a template. Never commit your real `.env` to version control!

## Kubernetes Deployment (K3s, Minikube, etc.)

This project includes Kubernetes manifests in the `k8s/` directory for easy deployment of the cron job and (optionally) other services.

### Deploying the Cron Job

1. **Build your Docker image:**
   ```bash
   docker build -t garden-logbook-cron:latest -f Dockerfile.cron .
   ```

2. **Import the image into K3s (if running locally):**
   ```bash
   sudo k3s ctr images import garden-logbook-cron.tar
   # Or save and import if needed:
   # docker save -o garden-logbook-cron.tar garden-logbook-cron:latest
   # sudo k3s ctr images import garden-logbook-cron.tar
   ```

3. **Apply the Kubernetes manifest:**
   ```bash
   kubectl apply -f k8s/cronjob.yaml
   ```

4. **Check status:**
   ```bash
   kubectl get cronjobs
   kubectl get jobs
   kubectl get pods
   ```

5. **View logs for a job pod:**
   ```bash
   kubectl logs <pod-name>
   ```

### Notes
- The cron job will run every 4 hours (UTC) by default.
- You can edit the schedule in `k8s/cronjob.yaml`.
- If you are migrating from Docker, disable or remove the Docker-based cron job to avoid duplicate runs.
- You can add more manifests (e.g., for the main app) to the `k8s/` directory as needed.

---
