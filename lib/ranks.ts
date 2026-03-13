export const RANKS = [
  { name: "Local Talent",       min: 0,   max: 4,   color: "text-zinc-500",    desc: "You just showed up. Welcome to the card." },
  { name: "Jobber",             min: 5,   max: 14,  color: "text-zinc-400",    desc: "Taking the losses so the business can run." },
  { name: "Curtain Jerker",     min: 15,  max: 29,  color: "text-slate-400",   desc: "Opening the show. The crowd is still finding seats." },
  { name: "Mid-Carder",         min: 30,  max: 49,  color: "text-blue-400",    desc: "A solid presence. The backbone of any roster." },
  { name: "Upper Mid-Carder",   min: 50,  max: 74,  color: "text-violet-400",  desc: "Always in the mix. Championship shot incoming." },
  { name: "Main Eventer",       min: 75,  max: 99,  color: "text-amber-400",   desc: "The lights shine brightest on you." },
  { name: "Champion",           min: 100, max: 149, color: "text-yellow-400",  desc: "Title around your waist. Undisputed." },
  { name: "Legend",             min: 150, max: 224, color: "text-primary",     desc: "Your name alone sells tickets." },
  { name: "Icon",               min: 225, max: 324, color: "text-primary",     desc: "Immortalised. The business is better because of you." },
  { name: "Hall of Famer",      min: 325, max: Infinity, color: "text-primary", desc: "The highest honour. Your plaque is in the rafters." },
];

export function getRank(total: number) {
  return RANKS.find(r => total >= r.min && total <= r.max) ?? RANKS[0];
}
