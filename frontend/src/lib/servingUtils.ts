// Small utility to parse and format amounts similar to backend ServingCalculator

export function parseAmount(amountStr: string | number | undefined): number {
  if (!amountStr && amountStr !== 0) return 0;
  let s = String(amountStr).trim().toLowerCase();
  if (!s) return 0;

  // Handle mixed numbers like "1 1/2"
  if (s.includes(' ')) {
    const parts = s.split(' ').filter(Boolean);
    if (parts.length === 2 && parts[1].includes('/')) {
      const whole = Number(parts[0]);
      try {
        const frac = parts[1].split('/');
        const num = Number(frac[0]);
        const den = Number(frac[1]);
        if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
          return whole + num / den;
        }
      } catch (e) {
        // fallback
      }
    }
  }

  // Handle simple fraction like "1/2"
  if (s.includes('/')) {
    try {
      const frac = s.split('/');
      const num = Number(frac[0]);
      const den = Number(frac[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    } catch (e) {
      return 0;
    }
  }

  // Decimal or integer
  const val = Number(s);
  if (!isNaN(val)) return val;

  return 0;
}

export function formatAmount(amount: number): string {
  if (!amount) return '0';
  if (Number.isInteger(amount)) return String(amount);

  // Known fraction approximations
  const commonFractions: { [k: number]: string } = {
    0.125: '1/8', 0.25: '1/4', 0.333: '1/3', 0.5: '1/2',
    0.666: '2/3', 0.75: '3/4', 0.875: '7/8'
  };

  for (const decStr in commonFractions) {
    const dec = Number(decStr);
    if (Math.abs(amount - dec) < 0.01) return commonFractions[decStr as any];
  }

  return String(Math.round(amount * 10) / 10);
}
