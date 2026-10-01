export function formatCoins(amount: number): string {
  const abs = Math.abs(amount);
  const unit = abs === 1 ? "game coin" : "game coins";
  return `${amount} ${unit}`;
}

export function formatSignedCoins(amount: number): string {
  if (amount > 0) return `+${formatCoins(amount)}`;
  if (amount < 0) return `−${formatCoins(Math.abs(amount))}`;
  return formatCoins(0);
}

export function difficultyLabel(difficulty: string): string {
  if (difficulty === "easy") return "Easy";
  if (difficulty === "medium") return "Medium";
  if (difficulty === "hard") return "Hard";
  return difficulty;
}
