import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <p className="text-8xl font-black italic uppercase tracking-tight text-primary">404</p>
          <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight">
            Page Not Found
          </h1>
          <p className="text-muted-foreground font-medium">
            Looks like this page took a bump. It doesn&apos;t exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black uppercase italic text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Back to Home
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center justify-center gap-2 bg-card/40 border border-white/10 text-foreground font-black uppercase italic text-sm px-6 py-3 rounded-xl hover:border-primary/30 hover:bg-card/60 transition-all"
          >
            Browse Events
          </Link>
        </div>
      </div>
    </div>
  );
}
