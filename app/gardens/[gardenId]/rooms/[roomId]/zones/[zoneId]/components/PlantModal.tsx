"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PlantForm, { PlantFormValues } from '../plants/[plantId]/components/PlantForm';

export default function PlantModal({
  open,
  setOpen,
  title,
  initialValues,
  submitButtonLabel,
  onSubmit,
  isSubmitting,
  error,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  initialValues: PlantFormValues;
  submitButtonLabel: string;
  onSubmit: (values: PlantFormValues) => void;
  isSubmitting: boolean;
  error?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-emerald-100 font-bold">{title}</DialogTitle>
        </DialogHeader>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <PlantForm
          initialValues={initialValues}
          onSubmit={onSubmit}
          onCancel={() => setOpen(false)}
          submitButtonLabel={submitButtonLabel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
} 