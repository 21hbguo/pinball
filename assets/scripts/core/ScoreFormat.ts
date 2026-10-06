export function formatScore(score: number, digits: number): string {
  const safe = Math.max(0, Math.floor(score));
  return safe.toString().padStart(Math.max(1, digits), '0');
}

export function formatBalls(balls: number): string {
  return Math.max(0, Math.floor(balls)).toString().padStart(3, '0');
}
