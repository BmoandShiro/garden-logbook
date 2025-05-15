"use client";
import { ReactNode } from "react";

export function OwnerOnly({ userEmail, children }: { userEmail?: string | null, children: ReactNode }) {
  if (userEmail !== "bmostradingpost@gmail.com") return null;
  return <>{children}</>;
} 