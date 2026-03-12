import { prisma } from "@lib/prisma";
import MaintenanceClient from "./MaintenanceClient";

export default async function MaintenancePage() {
  const config = await prisma.siteConfig.findUnique({
    where: { key: 'maintenance_mode' }
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase italic text-center">System Control</h1>
        <p className="text-muted-foreground text-sm mt-1 text-center">Emergency switches and platform state management.</p>
      </div>
      <MaintenanceClient initialMode={config?.value === 'true'} />
    </div>
  );
}
