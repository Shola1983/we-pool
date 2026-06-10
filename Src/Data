export const GROUPS = {
  A: ["USA", "Mexico", "Canada", "Uruguay"],
  B: ["Brazil", "Argentina", "Colombia", "Ecuador"],
  C: ["France", "England", "Portugal", "Netherlands"],
  D: ["Spain", "Germany", "Italy", "Belgium"],
  E: ["Morocco", "Senegal", "Nigeria", "Cameroon"],
  F: ["Japan", "South Korea", "Australia", "Saudi Arabia"],
  G: ["Serbia", "Croatia", "Poland", "Ukraine"],
  H: ["Switzerland", "Denmark", "Sweden", "Norway"],
};
export const FLAGS = {
  USA:"🇺🇸",Mexico:"🇲🇽",Canada:"🇨🇦",Uruguay:"🇺🇾",Brazil:"🇧🇷",Argentina:"🇦🇷",Colombia:"🇨🇴",Ecuador:"🇪🇨",France:"🇫🇷",England:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",Portugal:"🇵🇹",Netherlands:"🇳🇱",Spain:"🇪🇸",Germany:"🇩🇪",Italy:"🇮🇹",Belgium:"🇧🇪",Morocco:"🇲🇦",Senegal:"🇸🇳",Nigeria:"🇳🇬",Cameroon:"🇨🇲",Japan:"🇯🇵","South Korea":"🇰🇷",Australia:"🇦🇺","Saudi Arabia":"🇸🇦",Serbia:"🇷🇸",Croatia:"🇭🇷",Poland:"🇵🇱",Ukraine:"🇺🇦",Switzerland:"🇨🇭",Denmark:"🇩🇰",Sweden:"🇸🇪",Norway:"🇳🇴",
};
export const ALL_TEAMS = Object.values(GROUPS).flat();
export const SCORING = { groupFirst:5, groupSecond:3, groupThird:2, r32:5, qf:8, sf:12, final:15, champion:20 };
export const ADMIN_PASSWORD = "wc2026";
export function flag(t) { return FLAGS[t] || "🏳️"; }
export function emptyPicks() {
  const groups = {};
  Object.keys(GROUPS).forEach(g => { groups[g] = { first:"", second:"", third:"" }; });
  return { groups, bracket:{ r32:Array(16).fill(""), qf:Array(8).fill(""), sf:Array(4).fill(""), final:Array(2).fill(""), champion:"" } };
}
export function calcScore(picks, results) {
  if (!picks || !results) return 0;
  let score = 0;
  Object.keys(GROUPS).forEach(g => {
    const p = picks.groups?.[g]; const r = results.groups?.[g];
    if (!p || !r) return;
    if (p.first && p.first === r.first) score += SCORING.groupFirst;
    if (p.second && p.second === r.second) score += SCORING.groupSecond;
    if (p.third && p.third === r.third) score += SCORING.groupThird;
  });
  [["r32",SCORING.r32],["qf",SCORING.qf],["sf",SCORING.sf],["final",SCORING.final]].forEach(([key,pts]) => {
    const p = picks.bracket?.[key]||[]; const r = results.bracket?.[key]||[];
    p.forEach((team,i) => { if (team && team === r[i]) score += pts; });
  });
  if (picks.bracket?.champion && picks.bracket.champion === results.bracket?.champion) score += SCORING.champion;
  return score;
}
