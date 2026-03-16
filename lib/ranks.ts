export const RANKS = [
  { name: "Local Talent",       min: 0,   max: 9,   color: "text-zinc-500",    desc: "You just showed up. Welcome to the card." },
  { name: "Jobber",             min: 10,  max: 24,  color: "text-zinc-400",    desc: "Taking the losses so the business can run." },
  { name: "Curtain Jerker",     min: 25,  max: 49,  color: "text-slate-400",   desc: "Opening the show. The crowd is still finding seats." },
  { name: "Mid-Carder",         min: 50,  max: 89,  color: "text-blue-400",    desc: "A solid presence. The backbone of any roster." },
  { name: "Upper Mid-Carder",   min: 90,  max: 139, color: "text-violet-400",  desc: "Always in the mix. Championship shot incoming." },
  { name: "Main Eventer",       min: 140, max: 199, color: "text-amber-400",   desc: "The lights shine brightest on you." },
  { name: "Champion",           min: 200, max: 299, color: "text-yellow-400",  desc: "Title around your waist. Undisputed." },
  { name: "Legend",             min: 300, max: 449, color: "text-primary",     desc: "Your name alone sells tickets." },
  { name: "Icon",               min: 450, max: 649, color: "text-primary",     desc: "Immortalised. The business is better because of you." },
  { name: "Hall of Famer",      min: 650, max: Infinity, color: "text-primary", desc: "The highest honour. Your plaque is in the rafters." },
];

// Each activity type is worth different points:
//   Match rating        = 1 pt  (quick action)
//   Review              = 3 pts (written effort)
//   Prediction          = 1 pt  (community engagement)
//   Approved submission = 5 pts (contributing to the database)
export const RANK_WEIGHTS = { rating: 1, review: 3, prediction: 1, submission: 5 };

export function calcRankScore(ratings: number, reviews: number, predictions: number, submissions = 0) {
  return ratings * RANK_WEIGHTS.rating
    + reviews * RANK_WEIGHTS.review
    + predictions * RANK_WEIGHTS.prediction
    + submissions * RANK_WEIGHTS.submission;
}

export function getRank(score: number) {
  return RANKS.find(r => score >= r.min && score <= r.max) ?? RANKS[0];
}
