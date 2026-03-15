"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, X, BarChart2, Calendar, Globe } from "lucide-react";

type PollOption = {
  id: string;
  text: string;
  order: number;
  _count: { votes: number };
};

type Poll = {
  id: string;
  question: string;
  isActive: boolean;
  eventId: string | null;
  event?: { id: string; title: string; slug: string } | null;
  createdAt: string;
  options: PollOption[];
  _count: { votes: number };
};

type EventSummary = { id: string; title: string; slug: string; date: string };

type Props = {
  initialPolls: Poll[];
  events: EventSummary[];
};

export default function AdminPollsClient({ initialPolls, events }: Props) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New poll form state
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isActive, setIsActive] = useState(false);
  const [eventId, setEventId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  async function createPoll() {
    const cleanOptions = options.filter((o) => o.trim());
    if (!question.trim()) return setError("Question is required.");
    if (cleanOptions.length < 2) return setError("At least 2 options are required.");

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          options: cleanOptions,
          isActive,
          eventId: eventId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create poll");

      // Attach event info locally
      const eventInfo = eventId ? events.find((e) => e.id === eventId) : null;
      const newPoll = { ...data.poll, event: eventInfo || null };

      setPolls((prev) => {
        // If activating homepage poll, deactivate other homepage polls
        const updated =
          isActive && !eventId
            ? prev.map((p) => (!p.eventId ? { ...p, isActive: false } : p))
            : prev;
        return [newPoll, ...updated];
      });
      setQuestion("");
      setOptions(["", ""]);
      setIsActive(false);
      setEventId("");
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(poll: Poll) {
    setLoading(true);
    setError(null);
    try {
      const newState = !poll.isActive;
      const res = await fetch(`/api/admin/polls/${poll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update poll");

      setPolls((prev) =>
        prev.map((p) => {
          // Only deactivate other polls in same scope
          if (newState && p.id !== poll.id && p.eventId === poll.eventId)
            return { ...p, isActive: false };
          if (p.id === poll.id) return { ...p, isActive: newState };
          return p;
        })
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deletePoll(pollId: string) {
    if (!confirm("Delete this poll and all its votes?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/polls/${pollId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete poll");
      }
      setPolls((prev) => prev.filter((p) => p.id !== pollId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function addOption() {
    if (options.length < 6) setOptions([...options, ""]);
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  }

  function updateOption(i: number, val: string) {
    const updated = [...options];
    updated[i] = val;
    setOptions(updated);
  }

  const eventPolls = polls.filter((p) => p.eventId);
  const homePolls = polls.filter((p) => !p.eventId);
  const selectedEvent = eventId ? events.find((e) => e.id === eventId) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-primary" />
            Community Polls
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage homepage polls and event-specific polls.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Poll
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Create Poll Form */}
      {showForm && (
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg">New Poll</h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Assign to event */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Assign to Event <span className="font-medium normal-case">(optional — leave blank for homepage)</span>
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/40 bg-white"
            >
              <option value="">🌐 Homepage poll</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({new Date(ev.date).getFullYear()})
                </option>
              ))}
            </select>
            {selectedEvent && (
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Will appear in the Poll tab on the event page
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Who was the best wrestler of 2024?"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Options
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/40"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button
                onClick={addOption}
                className="text-xs font-black uppercase tracking-wider text-primary hover:underline"
              >
                + Add Option
              </button>
            )}
          </div>

          {!eventId && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-bold">Set as active homepage poll</span>
            </label>
          )}

          <button
            onClick={createPoll}
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Poll"}
          </button>
        </div>
      )}

      {/* Event Polls */}
      {eventPolls.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Event Polls ({eventPolls.length})</h2>
          </div>
          {eventPolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} onToggle={toggleActive} onDelete={deletePoll} loading={loading} />
          ))}
        </div>
      )}

      {/* Homepage Polls */}
      <div className="space-y-4">
        {eventPolls.length > 0 && (
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Homepage Polls ({homePolls.length})</h2>
          </div>
        )}
        {homePolls.length === 0 && eventPolls.length === 0 ? (
          <div className="bg-white border border-dashed border-border rounded-2xl p-16 text-center">
            <BarChart2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium text-sm">
              No polls yet. Create one to get started.
            </p>
          </div>
        ) : homePolls.length === 0 ? null : (
          homePolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} onToggle={toggleActive} onDelete={deletePoll} loading={loading} />
          ))
        )}
      </div>
    </div>
  );
}

function PollCard({
  poll,
  onToggle,
  onDelete,
  loading,
}: {
  poll: Poll;
  onToggle: (p: Poll) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                poll.isActive
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}
            >
              {poll.isActive ? "Active" : "Inactive"}
            </span>
            {poll.event && (
              <Link
                href={`/events/${poll.event.slug}`}
                target="_blank"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                <Calendar className="w-2.5 h-2.5" />
                {poll.event.title.replace(/–\s*\d{4}.*$/, "").trim()}
              </Link>
            )}
            <span className="text-[10px] text-muted-foreground font-bold">
              {poll._count.votes} votes total
            </span>
          </div>
          <h3 className="font-black text-base italic">{poll.question}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggle(poll)}
            disabled={loading}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all disabled:opacity-50 ${
              poll.isActive
                ? "border-slate-300 text-slate-600 hover:border-slate-400"
                : "border-green-300 text-green-700 hover:bg-green-50"
            }`}
          >
            {poll.isActive ? "Deactivate" : "Set Active"}
          </button>
          <button
            onClick={() => onDelete(poll.id)}
            disabled={loading}
            className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Options with vote bars */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const pct =
            poll._count.votes > 0
              ? Math.round((opt._count.votes / poll._count.votes) * 100)
              : 0;
          return (
            <div key={opt.id} className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span>{opt.text}</span>
                <span className="text-muted-foreground">
                  {opt._count.votes} ({pct}%)
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
