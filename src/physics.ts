import type { Pin, GameConfig, Ring } from './types';

const MAX_SPEED = 20; // units per frame
const RESTITUTION = 0.5; // Collision elasticity

// Convert angle to radians (0° = up, positive = right)
function degToRad(degrees: number): number {
  return ((degrees - 90) * Math.PI) / 180;
}

// Calculate initial velocity for a throw (3D with pitch angle)
export function calculateThrowVelocity(
  power: number,
  angleDegrees: number,
  pitchDegrees: number = 0
): { vx: number; vy: number; vz: number } {
  const yawRad = degToRad(angleDegrees);
  const pitchRad = (pitchDegrees * Math.PI) / 180;
  const speed = power * MAX_SPEED;

  // Horizontal speed component (reduced by pitch)
  const horizontalSpeed = speed * Math.cos(pitchRad);
  // Vertical speed component (upward)
  const verticalSpeed = speed * Math.sin(pitchRad);

  return {
    vx: Math.cos(yawRad) * horizontalSpeed,
    vy: Math.sin(yawRad) * horizontalSpeed,
    vz: verticalSpeed,
  };
}

// Calculate starting position for a throw
export function getThrowStartPosition(canvasSize: number): { x: number; y: number } {
  return {
    x: canvasSize / 2,
    y: canvasSize - 30,
  };
}

// Calculate distance between two points
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate speed from velocity (2D)
export function speed(vx: number, vy: number): number {
  return Math.sqrt(vx * vx + vy * vy);
}

// Calculate speed from velocity (3D)
export function speed3D(vx: number, vy: number, vz: number): number {
  return Math.sqrt(vx * vx + vy * vy + vz * vz);
}

// Check collision between two pins (3D aware)
// Collision only happens when both pins are near ground level (z ~ 0)
export function checkCollision(
  pin1: Pin,
  pin2: Pin,
  pinRadius: number,
  pinHeight: number = 30,
  zThreshold: number = 25
): boolean {
  // Flying pin can only collide with standing pins if it's low enough
  // Check if moving pin's z is within the standing pin's height range
  const pin1InRange = pin1.z <= pinHeight + zThreshold;
  const pin2InRange = pin2.z <= pinHeight + zThreshold;

  if (!pin1InRange || !pin2InRange) {
    return false; // One pin is too high in the air
  }

  // If one pin is standing and the other is at z > standing height, no collision
  if (pin2.state === 'standing' && pin1.z > pinHeight) {
    return false;
  }
  if (pin1.state === 'standing' && pin2.z > pinHeight) {
    return false;
  }

  // Standard 2D distance check for horizontal collision
  const dist = distance(pin1.x, pin1.y, pin2.x, pin2.y);
  return dist < 2 * pinRadius;
}

// Apply elastic collision response between two pins (3D aware)
export function applyCollisionResponse(
  movingPin: Pin,
  staticPin: Pin
): { mvx: number; mvy: number; mvz: number; svx: number; svy: number; svz: number } {
  const dx = staticPin.x - movingPin.x;
  const dy = staticPin.y - movingPin.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return {
    mvx: movingPin.vx, mvy: movingPin.vy, mvz: movingPin.vz,
    svx: 0, svy: 0, svz: 0
  };

  // Normalize collision vector (in XY plane for horizontal collision)
  const nx = dx / dist;
  const ny = dy / dist;

  // Relative velocity in XY plane
  const dvx = movingPin.vx - staticPin.vx;
  const dvy = movingPin.vy - staticPin.vy;

  // Relative velocity along collision normal
  const dvn = dvx * nx + dvy * ny;

  // Don't resolve if velocities are separating
  if (dvn < 0) return {
    mvx: movingPin.vx, mvy: movingPin.vy, mvz: movingPin.vz,
    svx: staticPin.vx, svy: staticPin.vy, svz: staticPin.vz
  };

  // Collision impulse with restitution
  const impulse = dvn * (1 + RESTITUTION) / 2;

  // Transfer some vertical momentum to make collisions more dynamic
  const vzTransfer = movingPin.vz * 0.3;

  return {
    mvx: movingPin.vx - impulse * nx,
    mvy: movingPin.vy - impulse * ny,
    mvz: movingPin.vz * 0.7, // Lose some vertical momentum on collision
    svx: staticPin.vx + impulse * nx,
    svy: staticPin.vy + impulse * ny,
    svz: staticPin.vz + vzTransfer, // Static pin gets some upward bounce
  };
}

// Apply gravity to a pin
export function applyGravity(vz: number, gravity: number): number {
  return vz - gravity;
}

// Handle ground bounce (when z <= 0)
export function applyGroundBounce(
  z: number,
  vz: number,
  restitution: number
): { z: number; vz: number; bounced: boolean } {
  if (z <= 0 && vz < 0) {
    // Bounce with energy loss
    const newVz = -vz * restitution;
    // If bounce is too small, stop vertical movement
    if (Math.abs(newVz) < 0.5) {
      return { z: 0, vz: 0, bounced: true };
    }
    return { z: 0, vz: newVz, bounced: true };
  }
  return { z, vz, bounced: false };
}

// Check if a pin is grounded (on the floor and not moving vertically significantly)
export function isGrounded(z: number, vz: number): boolean {
  return z <= 0.1 && Math.abs(vz) < 0.5;
}

// Find which ring a position belongs to
export function findRing(
  x: number,
  y: number,
  config: GameConfig
): { ringIndex: number; ring: Ring | null; points: number } {
  const centerX = config.canvasSize / 2;
  const centerY = config.canvasSize / 2;
  const dist = distance(x, y, centerX, centerY);

  // Binary search through rings (sorted by radius)
  for (let i = 0; i < config.rings.length; i++) {
    const ring = config.rings[i];
    if (dist >= ring.innerRadius && dist < ring.outerRadius) {
      return { ringIndex: i, ring, points: ring.points };
    }
  }

  // Outside all rings
  return { ringIndex: -1, ring: null, points: config.outsideScore };
}

// Get maximum outer radius of all rings
export function getMaxRingRadius(config: GameConfig): number {
  if (config.rings.length === 0) return 0;
  return Math.max(...config.rings.map(r => r.outerRadius));
}

// Check if pin is out of bounds
export function isOutOfBounds(pin: Pin, config: GameConfig): boolean {
  const centerX = config.canvasSize / 2;
  const centerY = config.canvasSize / 2;
  const maxRadius = getMaxRingRadius(config) + 50;
  const dist = distance(pin.x, pin.y, centerX, centerY);
  return dist > maxRadius;
}

// Apply boundary reflection
export function applyBoundaryReflection(
  pin: Pin,
  config: GameConfig
): { x: number; y: number; vx: number; vy: number } {
  const centerX = config.canvasSize / 2;
  const centerY = config.canvasSize / 2;
  const maxRadius = getMaxRingRadius(config) + 50;

  const dx = pin.x - centerX;
  const dy = pin.y - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= maxRadius) {
    return { x: pin.x, y: pin.y, vx: pin.vx, vy: pin.vy };
  }

  // Normalize and reflect
  const nx = dx / dist;
  const ny = dy / dist;

  // Clamp position to boundary
  const newX = centerX + nx * maxRadius;
  const newY = centerY + ny * maxRadius;

  // Reflect velocity with 50% speed loss
  const dot = pin.vx * nx + pin.vy * ny;
  const newVx = (pin.vx - 2 * dot * nx) * 0.5;
  const newVy = (pin.vy - 2 * dot * ny) * 0.5;

  return { x: newX, y: newY, vx: newVx, vy: newVy };
}

// Calculate stand probability based on config and conditions
export function calculateStandProbability(
  config: GameConfig,
  ringIndex: number,
  collisionCount: number
): number {
  let prob = config.baseStandProb;

  // Ring bonus (center = highest bonus)
  if (config.ringBonusEnabled && ringIndex >= 0) {
    const ringCount = config.rings.length;
    // Outermost ring = +10%, next = +20%, center = +30%, etc.
    const bonusPercent = (ringCount - ringIndex) * 0.1;
    prob += bonusPercent;
  }

  // Collision penalty
  if (config.collisionPenaltyEnabled) {
    prob -= 0.15 * collisionCount;
  }

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, prob));
}

// Calculate knock probability
export function calculateKnockProbability(
  config: GameConfig,
  impactSpeed: number
): number {
  let prob = config.baseKnockProb + config.impactSpeedFactor * impactSpeed;
  return Math.max(0, Math.min(1, prob));
}
