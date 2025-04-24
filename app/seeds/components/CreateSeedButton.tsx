'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

export default function CreateSeedButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variety, setVariety] = useState('');
  const [strain, setStrain] = useState('');
  const [batch, setBatch] = useState('');
  const [breeder, setBreeder] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dateAcquired, setDateAcquired] = useState<Date>();
  const [dateHarvested, setDateHarvested] = useState<Date>();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/seeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variety,
          strain,
          batch,
          breeder,
          quantity: parseInt(quantity),
          dateAcquired,
          dateHarvested,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create seed');
      }

      toast.success('Seed added successfully');
      router.refresh();
      setIsOpen(false);
      setVariety('');
      setStrain('');
      setBatch('');
      setBreeder('');
      setQuantity('');
      setDateAcquired(undefined);
      setDateHarvested(undefined);
    } catch (error) {
      toast.error('Error adding seed');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Seed
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Seed</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variety">Seed Variety</Label>
              <Input
                id="variety"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="Enter seed variety"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strain">Strain</Label>
              <Input
                id="strain"
                value={strain}
                onChange={(e) => setStrain(e.target.value)}
                placeholder="Enter strain"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Input
                id="batch"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="Enter batch number/identifier"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breeder">Breeder</Label>
              <Input
                id="breeder"
                value={breeder}
                onChange={(e) => setBreeder(e.target.value)}
                placeholder="Enter breeder name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                max="999999"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date Acquired</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateAcquired && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateAcquired ? format(dateAcquired, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateAcquired}
                    onSelect={setDateAcquired}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date Harvested</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateHarvested && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateHarvested ? format(dateHarvested, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateHarvested}
                    onSelect={setDateHarvested}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100"
              >
                Add Seed
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 