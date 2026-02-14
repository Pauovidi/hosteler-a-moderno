"use client";

import { useSearchParams } from "next/navigation";

export default function PresupuestoClient() {
  const sp = useSearchParams();

  // Ejemplo: const product = sp.get("product") || ""
  // ... tu lógica actual ...

  return (
    <div>
      {/* tu UI actual de presupuesto */}
    </div>
  );
}
