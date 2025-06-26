# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Generate Prisma client and ensure it's available
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV NEXT_TYPESCRIPT_COMPILE_ERRORS false
ENV ESLINT_SKIP_VALIDATION true
# Copy Prisma client to a known location
RUN cp -r node_modules/.prisma ./prisma-client
# Build the application
ARG GOVEE_API_KEY_ENCRYPTION_KEY
ENV GOVEE_API_KEY_ENCRYPTION_KEY=$GOVEE_API_KEY_ENCRYPTION_KEY
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1
ENV HUSKY=0

# Install cron and curl
RUN apk add --no-cache dcron curl bash

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma-client ./node_modules/.prisma

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy cron scripts and make them executable
COPY scripts/cron.sh /app/scripts/cron.sh
COPY scripts/cron-weather.sh /app/scripts/cron-weather.sh
COPY scripts/cron-sensors.sh /app/scripts/cron-sensors.sh
RUN chmod +x /app/scripts/cron.sh /app/scripts/cron-weather.sh /app/scripts/cron-sensors.sh

# Create cron jobs for different frequencies
RUN echo "0 0,4,8,12,16,20 * * * /app/scripts/cron-weather.sh >> /var/log/cron.log 2>&1" > /etc/crontabs/root && \
    echo "0 9 * * * /app/scripts/cron.sh >> /var/log/cron.log 2>&1" >> /etc/crontabs/root && \
    echo "*/15 * * * * /app/scripts/cron-sensors.sh >> /var/log/cron.log 2>&1" >> /etc/crontabs/root

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start cron daemon and the application
CMD ["sh", "-c", "crond -f -d 8 & npm start"] 