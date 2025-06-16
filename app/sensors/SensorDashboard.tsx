"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeySection } from "./components/ApiKeySection";
import { DeviceList } from "./components/DeviceList";
import { AlertSettings } from "./components/AlertSettings";

interface Garden {
  id: string;
  name: string;
  description: string | null;
  plants: { id: string; name: string; }[];
  rooms: { id: string; name: string; }[];
  zones: { id: string; name: string; }[];
}

interface GoveeDevice {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  isOnline: boolean;
  lastState: any;
  lastStateAt: Date | null;
  linkedEntity: any;
}

interface SensorDashboardProps {
  gardens: Garden[];
  devices: GoveeDevice[];
  userId: string;
  userEmail: string;
}

export function SensorDashboard({ gardens, devices, userId, userEmail }: SensorDashboardProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-6">
          <ApiKeySection userId={userId} />
          <DeviceList devices={devices} gardens={gardens} userId={userId} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertSettings userId={userId} />
        </TabsContent>

        <TabsContent value="settings">
          <div className="text-center py-6">
            <p className="text-dark-text-secondary">Settings coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 