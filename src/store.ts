import { create } from 'zustand';
import type {
  Pin,
  Player,
  GameConfig,
  GamePhase,
  EventLogEntry,
  ThrowRuntime,
  Ring,
} from './types';
import { DEFAULT_CONFIG, DEFAULT_PLAYERS } from './types';
import { Mulberry32 } from './utils/random';
import {
  calculateThrowVelocity,
  getThrowStartPosition,
  checkCollision,
  applyCollisionResponse,
  findRing,
  applyBoundaryReflection,
  isOutOfBounds,
  speed,
  calculateStandProbability,
  calculateKnockProbability,
  applyGravity,
  applyGroundBounce,
  isGrounded,
} from './physics';

interface GameStore {
  // State
  config: GameConfig;
  players: [Player, Player];
  pins: Pin[];
  currentPlayerId: 1 | 2;
  phase: GamePhase;
  eventLog: EventLogEntry[];
  runtime: ThrowRuntime;
  rng: Mulberry32;

  // Actions
  updateConfig: (partial: Partial<GameConfig>) => void;
  updateRing: (index: number, ring: Partial<Ring>) => void;
  addRing: () => void;
  removeRing: (index: number) => void;
  setThrowParams: (angle: number, power: number) => void;
  throwPin: () => void;
  simulationStep: () => boolean; // Returns true if still simulating
  resolveThrow: () => void;
  nextTurn: () => void;
  reset: () => void;
}

function createInitialRuntime(): ThrowRuntime {
  return {
    thrownPinId: null,
    collisionCount: 0,
    knockedIds: new Set(),
    collidedWith: new Set(),
    impactSpeeds: new Map(),
  };
}

function generatePinId(): string {
  return `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  config: { ...DEFAULT_CONFIG },
  players: [{ ...DEFAULT_PLAYERS[0] }, { ...DEFAULT_PLAYERS[1] }],
  pins: [],
  currentPlayerId: 1,
  phase: 'idle',
  eventLog: [],
  runtime: createInitialRuntime(),
  rng: new Mulberry32(DEFAULT_CONFIG.seed),

  // Update config
  updateConfig: (partial) => {
    set((state) => ({
      config: { ...state.config, ...partial },
    }));
  },

  // Update a specific ring
  updateRing: (index, ringUpdate) => {
    set((state) => {
      const newRings = [...state.config.rings];
      if (index >= 0 && index < newRings.length) {
        newRings[index] = { ...newRings[index], ...ringUpdate };
      }
      return {
        config: { ...state.config, rings: newRings, ringCount: newRings.length },
      };
    });
  },

  // Add a new ring
  addRing: () => {
    set((state) => {
      const rings = state.config.rings;
      const lastRing = rings[rings.length - 1];
      const newRing: Ring = {
        innerRadius: lastRing ? lastRing.outerRadius : 0,
        outerRadius: lastRing ? lastRing.outerRadius + 50 : 50,
        points: 1,
      };
      const newRings = [...rings, newRing];
      return {
        config: { ...state.config, rings: newRings, ringCount: newRings.length },
      };
    });
  },

  // Remove a ring
  removeRing: (index) => {
    set((state) => {
      if (state.config.rings.length <= 1) return state;
      const newRings = state.config.rings.filter((_, i) => i !== index);
      return {
        config: { ...state.config, rings: newRings, ringCount: newRings.length },
      };
    });
  },

  // Set throw parameters
  setThrowParams: (angle, power) => {
    set((state) => ({
      config: { ...state.config, throwAngle: angle, throwPower: power },
    }));
  },

  // Throw a pin
  throwPin: () => {
    const { config, currentPlayerId, pins, phase } = get();
    if (phase !== 'idle') return;

    const { x, y } = getThrowStartPosition(config.canvasSize);
    const { vx, vy, vz } = calculateThrowVelocity(
      config.throwPower,
      config.throwAngle,
      config.throwPitch
    );

    const newPin: Pin = {
      id: generatePinId(),
      playerId: currentPlayerId,
      x,
      y,
      z: 0,  // Start at ground level
      vx,
      vy,
      vz,    // Initial vertical velocity from pitch angle
      state: 'standing',
      isMoving: true,
    };

    // Remove oldest pins if over limit
    let newPins = [...pins];
    while (newPins.length >= config.maxPinsOnBoard) {
      newPins.shift();
    }
    newPins.push(newPin);

    set({
      pins: newPins,
      phase: 'simulating',
      runtime: {
        ...createInitialRuntime(),
        thrownPinId: newPin.id,
      },
    });
  },

  // Single simulation step - simulates ALL moving pins for chain reactions
  simulationStep: () => {
    const state = get();
    if (state.phase !== 'simulating') return false;

    const { config, pins, runtime, rng } = state;
    const thrownPin = pins.find((p) => p.id === runtime.thrownPinId);

    // Check if any pin is still moving
    const anyPinMoving = pins.some((p) => p.isMoving);
    if (!anyPinMoving) {
      // Transition to resolving
      set({ phase: 'resolving' });
      return false;
    }

    // Clone pins for update
    const newPins = pins.map((p) => ({ ...p }));
    let newRuntime = { ...runtime };

    // Process ALL pins that are moving (including chain reactions)
    for (let i = 0; i < newPins.length; i++) {
      const pin = newPins[i];
      if (!pin.isMoving) continue;

      // Apply gravity (affects vz)
      pin.vz = applyGravity(pin.vz, config.gravity);

      // Apply horizontal friction (only when grounded or low)
      if (isGrounded(pin.z, pin.vz)) {
        pin.vx *= config.friction;
        pin.vy *= config.friction;
      } else {
        // Air friction (less friction in air)
        pin.vx *= 0.995;
        pin.vy *= 0.995;
      }

      // Collision detection with other pins
      for (let j = 0; j < newPins.length; j++) {
        if (i === j) continue;
        const otherPin = newPins[j];

        if (checkCollision(pin, otherPin, config.pinRadius, config.pinHeight, config.collisionZThreshold)) {
          // Calculate impact speed before response
          const impactSpeed = speed(
            pin.vx - otherPin.vx,
            pin.vy - otherPin.vy
          );

          // Apply collision response (3D)
          const response = applyCollisionResponse(pin, otherPin);
          pin.vx = response.mvx;
          pin.vy = response.mvy;
          pin.vz = response.mvz;
          otherPin.vx = response.svx;
          otherPin.vy = response.svy;
          otherPin.vz = response.svz;

          // Mark the other pin as moving for chain reaction (billiard effect)
          if (speed(otherPin.vx, otherPin.vy) > config.stopThreshold) {
            otherPin.isMoving = true;
          }

          // Track collision for scoring (only for the thrown pin)
          if (pin.id === runtime.thrownPinId) {
            newRuntime.collisionCount++;

            // Only judge knock once per target pin, and only for opponent pins
            if (!newRuntime.collidedWith.has(otherPin.id)) {
              newRuntime.collidedWith = new Set(newRuntime.collidedWith).add(otherPin.id);

              // Knock probability check - only knock opponent pins
              if (otherPin.playerId !== thrownPin?.playerId) {
                const knockProb = calculateKnockProbability(config, impactSpeed);
                if (rng.chance(knockProb) && otherPin.state === 'standing') {
                  // Mark as knocked
                  otherPin.state = 'fallen';
                  newRuntime.knockedIds = new Set(newRuntime.knockedIds).add(otherPin.id);
                  newRuntime.impactSpeeds = new Map(newRuntime.impactSpeeds).set(
                    otherPin.id,
                    impactSpeed
                  );
                }
              }
            }
          }
        }
      }

      // Update position (3D)
      pin.x += pin.vx;
      pin.y += pin.vy;
      pin.z += pin.vz;

      // Ground bounce handling
      const groundResult = applyGroundBounce(pin.z, pin.vz, config.groundRestitution);
      pin.z = groundResult.z;
      pin.vz = groundResult.vz;

      // Boundary check
      if (isOutOfBounds(pin, config)) {
        const reflected = applyBoundaryReflection(pin, config);
        pin.x = reflected.x;
        pin.y = reflected.y;
        pin.vx = reflected.vx;
        pin.vy = reflected.vy;
      }

      // Stop check - pin stops when grounded AND horizontal speed is low
      const horizontalSpeed = speed(pin.vx, pin.vy);
      if (isGrounded(pin.z, pin.vz) && horizontalSpeed < config.stopThreshold) {
        pin.vx = 0;
        pin.vy = 0;
        pin.vz = 0;
        pin.z = 0;
        pin.isMoving = false;
      }
    }

    set({ pins: newPins, runtime: newRuntime });

    // Return true if any pin is still moving
    return newPins.some((p) => p.isMoving);
  },

  // Resolve throw - calculate scores
  resolveThrow: () => {
    const state = get();
    if (state.phase !== 'resolving') return;

    const { config, pins, runtime, rng, currentPlayerId, players } = state;
    const thrownPin = pins.find((p) => p.id === runtime.thrownPinId);

    if (!thrownPin) {
      set({ phase: 'turnEnd' });
      return;
    }

    // Determine standing/fallen for thrown pin
    const thrownRingInfo = findRing(thrownPin.x, thrownPin.y, config);
    const standProb = calculateStandProbability(
      config,
      thrownRingInfo.ringIndex,
      runtime.collisionCount
    );

    const newPins = pins.map((p) => ({ ...p }));
    const thrownPinRef = newPins.find((p) => p.id === runtime.thrownPinId)!;

    const isStanding = rng.chance(standProb);
    thrownPinRef.state = isStanding ? 'standing' : 'fallen';

    // Calculate scores
    let deltaP1 = 0;
    let deltaP2 = 0;
    const logTexts: string[] = [];

    // Landing score for thrown pin
    const landingMultiplier = isStanding ? 2 : 1;
    const landingScore = landingMultiplier * thrownRingInfo.points;

    if (currentPlayerId === 1) {
      deltaP1 += landingScore;
    } else {
      deltaP2 += landingScore;
    }

    const ringName =
      thrownRingInfo.ringIndex >= 0
        ? `Ring ${thrownRingInfo.ringIndex + 1}`
        : 'Outside';
    const stateStr = isStanding ? 'standing' : 'fallen';
    logTexts.push(
      `Pin landed ${stateStr} in ${ringName} (${thrownRingInfo.points}pts): +${landingScore}`
    );

    // Knockdown bonuses and penalties
    runtime.knockedIds.forEach((knockedId) => {
      const knockedPin = pins.find((p) => p.id === knockedId);
      if (!knockedPin) return;

      const knockedRingInfo = findRing(knockedPin.x, knockedPin.y, config);

      // We stored original state before knock - it was standing (we only knock standing pins)
      const originalWasStanding = true; // We only added to knockedIds if state was 'standing'
      const lossMultiplier = originalWasStanding ? 2 : 1;
      const opponentLoss = lossMultiplier * knockedRingInfo.points;

      // Bonus for knocker
      const bonusMultiplier = isStanding ? 4 : 2;
      const knockBonus = bonusMultiplier * knockedRingInfo.points;

      if (currentPlayerId === 1) {
        deltaP1 += knockBonus;
        deltaP2 -= opponentLoss;
      } else {
        deltaP2 += knockBonus;
        deltaP1 -= opponentLoss;
      }

      const knockedRingName =
        knockedRingInfo.ringIndex >= 0
          ? `Ring ${knockedRingInfo.ringIndex + 1}`
          : 'Outside';
      logTexts.push(
        `Knocked P${knockedPin.playerId} pin in ${knockedRingName}: +${knockBonus} bonus, opponent -${opponentLoss}`
      );
    });

    // Update players
    const newPlayers: [Player, Player] = [
      { ...players[0], score: players[0].score + deltaP1 },
      { ...players[1], score: players[1].score + deltaP2 },
    ];

    // Create event log entry
    const newEvent: EventLogEntry = {
      id: generateEventId(),
      text: logTexts.join(' | '),
      deltaP1,
      deltaP2,
      ts: Date.now(),
    };

    set({
      pins: newPins,
      players: newPlayers,
      eventLog: [...state.eventLog, newEvent],
      phase: 'turnEnd',
    });
  },

  // Next turn
  nextTurn: () => {
    const { phase, currentPlayerId } = get();
    if (phase !== 'turnEnd') return;

    set({
      currentPlayerId: currentPlayerId === 1 ? 2 : 1,
      phase: 'idle',
      runtime: createInitialRuntime(),
    });
  },

  // Reset game
  reset: () => {
    const { config } = get();
    set({
      players: [{ ...DEFAULT_PLAYERS[0] }, { ...DEFAULT_PLAYERS[1] }],
      pins: [],
      currentPlayerId: 1,
      phase: 'idle',
      eventLog: [],
      runtime: createInitialRuntime(),
      rng: new Mulberry32(config.seed),
    });
  },
}));
