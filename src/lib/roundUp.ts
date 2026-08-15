export function calculateRoundUp(amount: number): number {
  const roundedUp = Math.ceil(amount / 100) * 100;
  return Number((roundedUp - amount).toFixed(2));
}