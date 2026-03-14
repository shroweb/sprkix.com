import ImportQueueClient from "./ImportQueueClient";

export default function ImportQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase italic">Import Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste Cagematch event URLs to bulk-import events and match cards.
        </p>
      </div>
      <ImportQueueClient />
    </div>
  );
}
