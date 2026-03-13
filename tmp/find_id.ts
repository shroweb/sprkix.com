import { prisma } from "../lib/prisma";

async function findId() {
  const id = "cmmnu1s0I000h9bfn0gmkwvjq";
  const models = [
    "User", "Event", "Match", "Review", "MatchRating", "FavoriteMatch",
    "MatchParticipant", "Wrestler", "WatchListItem", "Reply", "Follow",
    "Promotion", "PromotionAlias", "List", "ListItem", "Notification"
  ];
  
  for (const model of models) {
    try {
      const result = await (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)].findUnique({
        where: { id }
      });
      if (result) {
        console.log(`Found ID in model: ${model}`);
        console.log(result);
        return;
      }
    } catch (e) {
      // ignore
    }
  }
  console.log("ID not found in basic models.");
}

findId();
