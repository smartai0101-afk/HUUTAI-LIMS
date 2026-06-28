/** Bohr-model shell capacities (2, 8, 8, 18, 18, 32). */
const SHELL_CAPACITIES = [2, 8, 8, 18, 18, 32] as const;

export function getBohrElectronShell(atomicNumber: number): number[] {
  if (atomicNumber < 1) return [];

  let remaining = atomicNumber;
  const shells: number[] = [];

  for (const capacity of SHELL_CAPACITIES) {
    if (remaining <= 0) break;
    const count = Math.min(remaining, capacity);
    shells.push(count);
    remaining -= count;
  }

  return shells;
}
