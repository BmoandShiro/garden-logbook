import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { GoveeService } from "@/lib/govee";

interface GoveeApiKeyInputProps {
  apiKey: string | null;
  onSave: (apiKey: string) => Promise<void>;
  isCreator: boolean;
}

export function GoveeApiKeyInput({ apiKey, onSave, isCreator }: GoveeApiKeyInputProps) {
  const [key, setKey] = useState(apiKey || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCreator) {
    return null;
  }

  const handleSave = async () => {
    try {
      setIsValidating(true);
      setError(null);

      // Validate API key by making a test request
      const goveeService = new GoveeService(key);
      await goveeService.getDevices();

      await onSave(key);
      setIsEditing(false);
    } catch (error) {
      setError('Invalid API key. Please check and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-2">
        <Label>Govee API Key</Label>
        <div className="flex items-center space-x-2">
          <Input
            type="password"
            value={key ? '••••••••••••••••' : ''}
            disabled
            placeholder="No API key set"
          />
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Govee API Key</Label>
      <div className="space-y-2">
        <Input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter your Govee API key"
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setKey(apiKey || '');
              setError(null);
            }}
            disabled={isValidating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isValidating}
          >
            {isValidating ? 'Validating...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
} 