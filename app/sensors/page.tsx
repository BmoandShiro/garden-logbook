import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GoveeDeviceList } from '@/components/sensors/GoveeDeviceList';
import { GoveeApiKeyForm } from '@/components/sensors/GoveeApiKeyForm';
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
      <h1 className="text-3xl font-bold mb-6">Sensors</h1>
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Govee Devices</CardTitle>
              <CardDescription>Manage your Govee devices and view their status.</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasApiKey ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>API Key Required</AlertTitle>
                  <AlertDescription>
                    Please add your Govee API key in the Settings tab to manage your devices.
                  </AlertDescription>
                </Alert>
              ) : (
                <GoveeDeviceList devices={devices} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Govee API Key</CardTitle>
              <CardDescription>Add or update your Govee API key to manage your devices.</CardDescription>
            </CardHeader>
            <CardContent>
              <GoveeApiKeyForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 