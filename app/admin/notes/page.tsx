import { prisma } from "@lib/prisma";
import AdminNotesClient from "./AdminNotesClient";

export default async function NotesPage() {
  const config = await prisma.siteConfig.findUnique({
    where: { key: 'admin_notes' }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight uppercase italic italic">Admin Scratchpad</h1>
        <p className="text-muted-foreground text-sm mt-1">Shared notes for the foundation team.</p>
      </div>

      <AdminNotesClient initialNotes={config?.value ?? ""} />
    </div>
  );
}
