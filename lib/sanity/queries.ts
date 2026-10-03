export const missionsQuery = `*[_type == "mission" && reviewStatus == "approved" && defined(slug.current)] | order(order asc) {
  "slug": slug.current,
  title,
  summary,
  story,
  learningGoal,
  ageMin,
  ageMax,
  difficulty,
  topic,
  order,
  engine,
  startingCoins,
  goalAmount,
  needsRequired,
  successHeadline,
  practiceHeadline,
  lemonadeIntro,
  steps[]{
    id,
    title,
    prompt,
    income,
    incomeLabel,
    choices[]{
      id,
      label,
      detail,
      coinDelta,
      bonusCoins,
      tag,
      meetsNeed,
      feedbackTitle,
      feedbackBody
    }
  },
  supplies[]{ id, name, detail, cost, cups },
  prices[]{ price, customers, note },
  quiz[]{
    id,
    prompt,
    choices[]{ id, label, correct, explanation }
  },
  rewards{ xp, coins, badgeId, badgeName, badgeDescription }
}`;

export const lessonsQuery = `*[_type == "lesson" && reviewStatus == "approved" && defined(slug.current)] | order(order asc) {
  "slug": slug.current,
  title,
  summary,
  body,
  topic,
  difficulty,
  objectives,
  ageMin,
  ageMax,
  order,
  sections[]{ id, heading, body, illustration },
  quiz[]{
    id,
    prompt,
    choices[]{ id, label, correct, explanation }
  },
  passPercent,
  rewards{ coins, xp }
}`;
