import { describe, it, expect } from "vitest"
import { assignTeams } from "../lib/match-teams"

describe("assignTeams", () => {
  it("singles", () => {
    const r = assignTeams("Cody Rhodes defeats Roman Reigns (20:00)", ["Cody Rhodes", "Roman Reigns"])
    expect(r.teams).toEqual([1, 2]); expect(r.winners).toEqual([true, false])
  })
  it("tag match groups partners", () => {
    const r = assignTeams("The Usos (Jey Uso & Jimmy Uso) defeat A & B (w/ Manager) (12:00)", ["Jey Uso", "Jimmy Uso", "A", "B"])
    expect(r.teams).toEqual([1, 1, 2, 2]); expect(r.winners).toEqual([true, true, false, false])
  })
  it("three-team match", () => {
    const r = assignTeams("A & B defeat C & D vs. E & F", ["A", "B", "C", "D", "E", "F"])
    expect(r.teams).toEqual([1, 1, 2, 2, 3, 3])
  })
  it("triple threat", () => {
    const r = assignTeams("A defeats B vs. C", ["A", "B", "C"])
    expect(r.teams).toEqual([1, 2, 3])
  })
  it("draw has no winners", () => {
    const r = assignTeams("A vs. B (Time Limit Draw)", ["A", "B"])
    expect(r.teams).toEqual([1, 2]); expect(r.winners).toEqual([false, false])
  })
  it("battle royal is every man for himself", () => {
    const r = assignTeams("Battle Royal: A defeats B, C, D", ["A", "B", "C", "D"])
    expect(r.teams).toEqual([1, 2, 3, 4]); expect(r.winners[0]).toBe(true)
  })
})
