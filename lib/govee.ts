import { GoveeDevice, GoveeReading } from '@prisma/client';

const GOVEE_API_BASE = 'https://openapi.api.govee.com/router/api/v1';

interface GoveeDeviceResponse {
  device: string;
  model: string;
  deviceName: string;
  controllable: boolean;
  retrievable: boolean;
  supportCmds: string[];
}

interface GoveeStateResponse {
  device: string;
  model: string;
  properties: {
    temperature: number;
    humidity: number;
    battery: number;
  }[];
}

export class GoveeService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    const response = await fetch(`${GOVEE_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Govee-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Govee API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getDevices(): Promise<GoveeDeviceResponse[]> {
    return this.request<{ data: { devices: GoveeDeviceResponse[] } }>('/devices')
      .then(response => response.data.devices);
  }

  async getDeviceState(device: string, model: string): Promise<GoveeStateResponse> {
    return this.request<{ data: GoveeStateResponse }>(`/devices/state?device=${device}&model=${model}`)
      .then(response => response.data);
  }

  async syncDeviceReadings(device: GoveeDevice): Promise<GoveeReading> {
    const state = await this.getDeviceState(device.deviceId, device.model);
    const reading = state.properties[0];

    return {
      id: '', // Will be set by Prisma
      deviceId: device.id,
      temperature: reading.temperature,
      humidity: reading.humidity,
      battery: reading.battery,
      timestamp: new Date(),
      createdAt: new Date(),
    };
  }

  async checkDeviceAlerts(device: GoveeDevice, reading: GoveeReading): Promise<{
    temperatureAlert?: { type: 'high' | 'low', value: number };
    humidityAlert?: { type: 'high' | 'low', value: number };
  }> {
    const alerts: any = {};

    if (device.minTemp !== null && reading.temperature < device.minTemp) {
      alerts.temperatureAlert = { type: 'low', value: reading.temperature };
    } else if (device.maxTemp !== null && reading.temperature > device.maxTemp) {
      alerts.temperatureAlert = { type: 'high', value: reading.temperature };
    }

    if (device.minHumidity !== null && reading.humidity < device.minHumidity) {
      alerts.humidityAlert = { type: 'low', value: reading.humidity };
    } else if (device.maxHumidity !== null && reading.humidity > device.maxHumidity) {
      alerts.humidityAlert = { type: 'high', value: reading.humidity };
    }

    return alerts;
  }
} 