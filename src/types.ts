// Pin state and data
export interface Pin {
  id: string;
  playerId: 1 | 2;
  x: number;
  y: number;
  z: number;       // Height (0 = ground level)
  vx: number;
  vy: number;
  vz: number;      // Vertical velocity (positive = upward)
  state: 'standing' | 'fallen';
  isMoving: boolean;
}

// Ring configuration
export interface Ring {
  innerRadius: number;
  outerRadius: number;
  points: number;
}

// Player data
export interface Player {
  id: 1 | 2;
  name: string;
  score: number;
  color: string;
}

// Game configuration
export interface GameConfig {
  ringCount: number;
  rings: Ring[];
  outsideScore: number;
  pinRadius: number;
  pinHeight: number;           // Height of standing pin (for collision detection)
  friction: number;
  stopThreshold: number;
  baseStandProb: number;
  baseKnockProb: number;
  impactSpeedFactor: number;
  ringBonusEnabled: boolean;
  collisionPenaltyEnabled: boolean;
  maxPinsOnBoard: number;
  seed: number;
  canvasSize: number;
  throwPower: number;
  throwAngle: number;          // Horizontal angle (yaw): -60 to +60 degrees
  throwPitch: number;          // Vertical angle (pitch): 0 to 45 degrees (0 = horizontal, 45 = upward)
  gravity: number;             // Gravity acceleration (units per frame^2)
  groundRestitution: number;   // Bounce coefficient when hitting ground (0-1)
  collisionZThreshold: number; // Max z-difference for collision detection
}

// Event log entry
export interface EventLogEntry {
  id: string;
  text: string;
  deltaP1: number;
  deltaP2: number;
  ts: number;
}

// Runtime state for current throw
export interface ThrowRuntime {
  thrownPinId: string | null;
  collisionCount: number;
  knockedIds: Set<string>;
  collidedWith: Set<string>; // Track pins we've already collided with for knock judgment
  impactSpeeds: Map<string, number>; // Track impact speed per knocked pin
}

// Game phase
export type GamePhase = 'idle' | 'simulating' | 'resolving' | 'turnEnd';

// Default configuration
export const DEFAULT_CONFIG: GameConfig = {
  ringCount: 3,
  rings: [
    { innerRadius: 0, outerRadius: 50, points: 3 },    // Center ring
    { innerRadius: 50, outerRadius: 100, points: 2 },  // Middle ring
    { innerRadius: 100, outerRadius: 150, points: 1 }, // Outer ring
  ],
  outsideScore: 0,
  pinRadius: 10,
  pinHeight: 30,              // Pin height for collision detection
  friction: 0.98,
  stopThreshold: 0.5,
  baseStandProb: 0.5,
  baseKnockProb: 0.3,
  impactSpeedFactor: 0.05,
  ringBonusEnabled: true,
  collisionPenaltyEnabled: true,
  maxPinsOnBoard: 20,
  seed: 12345,
  canvasSize: 500,
  throwPower: 0.5,
  throwAngle: 0,
  throwPitch: 15,             // Default 15 degrees upward
  gravity: 0.5,               // Gravity acceleration
  groundRestitution: 0.3,     // 30% bounce on ground
  collisionZThreshold: 25,    // Collide if z difference < 25 units
};

// Default players
export const DEFAULT_PLAYERS: [Player, Player] = [
  { id: 1, name: 'Player 1', score: 0, color: '#3b82f6' }, // Blue
  { id: 2, name: 'Player 2', score: 0, color: '#ef4444' }, // Red
];
