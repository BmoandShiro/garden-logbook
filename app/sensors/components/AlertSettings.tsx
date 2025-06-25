"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AlertSettingsProps {
  userId: string;
}

export function AlertSettings({ userId }: AlertSettingsProps) {
  const [settings, setSettings] = useState({
    enabled: false,
    temperatureMin: 15,
    temperatureMax: 30,
    humidityMin: 40,
    humidityMax: 70,
    checkInterval: 15,
  });

  const handleSave = async () => {
    try {
      const response = await fetch("/api/sensors/alerts/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, ...settings }),
      });

      if (!response.ok) {
        throw new Error("Failed to save alert settings");
      }

      toast.success("Alert settings saved successfully");
    } catch (error) {
      toast.error("Failed to save alert settings");
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Settings</CardTitle>
        <CardDescription>Configure when you want to be notified about sensor readings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Alerts</Label>
            <p className="text-sm text-dark-text-secondary">
              Receive notifications when sensor readings are outside the specified ranges
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Temperature Range (°C)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.temperatureMin}
                onChange={(e) =>
                  setSettings({ ...settings, temperatureMin: parseInt(e.target.value) })
                }
                min={-10}
                max={50}
              />
              <span>to</span>
              <Input
                type="number"
                value={settings.temperatureMax}
                onChange={(e) =>
                  setSettings({ ...settings, temperatureMax: parseInt(e.target.value) })
                }
                min={-10}
                max={50}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Humidity Range (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.humidityMin}
                onChange={(e) =>
                  setSettings({ ...settings, humidityMin: parseInt(e.target.value) })
                }
                min={0}
                max={100}
              />
              <span>to</span>
              <Input
                type="number"
                value={settings.humidityMax}
                onChange={(e) =>
                  setSettings({ ...settings, humidityMax: parseInt(e.target.value) })
                }
                min={0}
                max={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Check Interval (minutes)</Label>
            <Input
              type="number"
              value={settings.checkInterval}
              onChange={(e) =>
                setSettings({ ...settings, checkInterval: parseInt(e.target.value) })
              }
              min={1}
              max={60}
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
} 