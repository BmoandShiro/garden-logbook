'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

export function GoveeApiKeyForm() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/sensors/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save API key');
      }

      setSuccess(true);
      setApiKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#23272b] border border-[#23282c] text-white">
      <CardHeader>
        <CardTitle>Govee API Key</CardTitle>
        <CardDescription>Add or update your Govee API key to manage your devices.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your Govee API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            className="bg-[#181c1f] border-[#23282c] text-emerald-100"
          />
          {error && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <h5 className="font-medium">Error</h5>
              </div>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-green-800">
              <h5 className="font-medium">Success</h5>
              <p className="mt-1 text-sm">API key saved successfully.</p>
            </div>
          )}
          <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-garden-500">
            {loading ? 'Saving...' : 'Save API Key'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 