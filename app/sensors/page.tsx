import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GoveeDeviceList } from '@/components/sensors/GoveeDeviceList';
import { GoveeApiKeyForm } from '@/components/sensors/GoveeApiKeyForm';
import { ZoneManagement } from '@/components/sensors/ZoneManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default async function SensorsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const [devices, user] = await Promise.all([
    prisma.goveeDevice.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { encryptedGoveeApiKey: true },
    }),
  ]);

  const hasApiKey = !!user?.encryptedGoveeApiKey;

  return (
    <div className="container mx-auto py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-emerald-100">Sensors</h1>
      </div>
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="px-4 py-8 sm:px-0">
          <div className="rounded-lg bg-dark-bg-secondary p-6 shadow-lg ring-1 ring-dark-border">
            <h2 className="text-lg font-bold text-white mb-2">Govee Devices</h2>
            <p className="text-dark-text-secondary mb-4">Manage your Govee devices and view their status.</p>
            <Tabs defaultValue="devices" className="space-y-4">
              <TabsList>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="devices">
                {hasApiKey ? (
                  <GoveeDeviceList devices={devices} />
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>API Key Required</AlertTitle>
                    <AlertDescription>
                      Please add your Govee API key in the Settings tab to manage your devices.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
              <TabsContent value="settings">
                <div className="space-y-6">
                  <GoveeApiKeyForm />
                  {hasApiKey && <ZoneManagement userId={session.user.id} />}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
} 