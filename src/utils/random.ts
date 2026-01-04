// Mulberry32 PRNG - deterministic random number generator
export class Mulberry32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0; // Ensure unsigned 32-bit
  }

  // Get internal state for serialization
  getState(): number {
    return this.state;
  }

  // Set internal state for deserialization
  setState(state: number): void {
    this.state = state >>> 0;
  }

  // Generate next random number in [0, 1)
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Generate random number in range [min, max)
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Generate random integer in range [min, max]
  randInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // Generate boolean with given probability
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}
