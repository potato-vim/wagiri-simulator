import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store';
import { getThrowStartPosition, calculateThrowVelocity } from '../physics';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const config = useGameStore((state) => state.config);
  const pins = useGameStore((state) => state.pins);
  const players = useGameStore((state) => state.players);
  const phase = useGameStore((state) => state.phase);
  const simulationStep = useGameStore((state) => state.simulationStep);
  const resolveThrow = useGameStore((state) => state.resolveThrow);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { canvasSize } = config;
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw rings (from outermost to innermost for proper layering)
    const sortedRings = [...config.rings].sort(
      (a, b) => b.outerRadius - a.outerRadius
    );

    sortedRings.forEach((ring, _idx) => {
      // Find original index for color variation
      const originalIdx = config.rings.indexOf(ring);
      const hue = 120 + originalIdx * 20; // Green variants
      const alpha = 0.3 + originalIdx * 0.1;

      ctx.beginPath();
      ctx.arc(centerX, centerY, ring.outerRadius, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, ring.innerRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = `hsla(${hue}, 60%, 40%, ${alpha})`;
      ctx.fill();

      // Ring border
      ctx.beginPath();
      ctx.arc(centerX, centerY, ring.outerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.6)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Points label
      const labelRadius = (ring.innerRadius + ring.outerRadius) / 2;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${ring.points}pt`, centerX + labelRadius * 0.7, centerY);
    });

    // Draw throw guide (idle phase only)
    if (phase === 'idle') {
      const start = getThrowStartPosition(canvasSize);
      const { vx, vy } = calculateThrowVelocity(
        config.throwPower,
        config.throwAngle,
        config.throwPitch
      );

      // Normalize and scale for display
      const length = 100 * config.throwPower;
      const magnitude = Math.sqrt(vx * vx + vy * vy);
      const dirX = magnitude > 0 ? (vx / magnitude) * length : 0;
      const dirY = magnitude > 0 ? (vy / magnitude) * length : 0;

      // Draw horizontal trajectory line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(start.x + dirX, start.y + dirY);
      ctx.strokeStyle = '#ff9500';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw vertical (pitch) indicator - arc showing upward angle
      if (config.throwPitch > 0) {
        const pitchRad = (config.throwPitch * Math.PI) / 180;

        // Draw arc from horizontal to pitch angle
        ctx.beginPath();
        ctx.arc(start.x, start.y, 20, -Math.PI / 2, -Math.PI / 2 - pitchRad, true);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw pitch angle label
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${config.throwPitch}°↑`, start.x + 25, start.y - 10);
      }

      // Start indicator
      ctx.beginPath();
      ctx.arc(start.x, start.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ff9500';
      ctx.fill();
    }

    // Draw pins - sort by z to draw lower pins first (painter's algorithm)
    const sortedPins = [...pins].sort((a, b) => a.z - b.z);

    sortedPins.forEach((pin) => {
      const playerColor = players[pin.playerId - 1].color;

      // Calculate visual offset based on z (height)
      // Higher z means the pin appears higher on screen (subtract from y)
      const visualY = pin.y - pin.z * 0.8;

      // Scale effect: pins higher in the air appear slightly smaller (perspective)
      const zScale = 1 - pin.z * 0.002;
      const effectiveRadius = config.pinRadius * Math.max(0.5, zScale);

      // Draw shadow on ground (always at pin.x, pin.y position)
      if (pin.z > 1) {
        ctx.save();
        ctx.translate(pin.x, pin.y);
        // Shadow gets smaller and more transparent as pin goes higher
        const shadowScale = Math.max(0.3, 1 - pin.z * 0.01);
        const shadowAlpha = Math.max(0.1, 0.4 - pin.z * 0.005);
        ctx.scale(shadowScale * 1.2, shadowScale * 0.4);
        ctx.beginPath();
        ctx.arc(0, 0, config.pinRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.fill();
        ctx.restore();
      }

      if (pin.state === 'fallen') {
        // Fallen pin: semi-transparent ellipse/shadow
        ctx.save();
        ctx.translate(pin.x, visualY);
        ctx.scale(1.3, 0.6);
        ctx.beginPath();
        ctx.arc(0, 0, effectiveRadius, 0, Math.PI * 2);
        ctx.fillStyle = playerColor + '80'; // 50% alpha
        ctx.fill();
        ctx.restore();
      } else {
        // Standing pin: solid circle with white border
        ctx.beginPath();
        ctx.arc(pin.x, visualY, effectiveRadius, 0, Math.PI * 2);
        ctx.fillStyle = playerColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Moving indicator with height info
      if (pin.isMoving) {
        ctx.beginPath();
        ctx.arc(pin.x, visualY, effectiveRadius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = pin.z > 5 ? '#00ff88' : '#ffd700'; // Green when airborne
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Show height indicator when airborne
        if (pin.z > 5) {
          ctx.fillStyle = '#00ff88';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`↑${Math.round(pin.z)}`, pin.x, visualY - effectiveRadius - 8);
        }
      }

      // Player indicator inside pin
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(10 * zScale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${pin.playerId}`, pin.x, visualY);
    });
  }, [config, pins, players, phase]);

  // Animation loop for simulation
  useEffect(() => {
    if (phase === 'simulating') {
      const animate = () => {
        const isStillMoving = simulationStep();
        draw();

        if (isStillMoving) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Transition to resolve
          resolveThrow();
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      // Just draw when not simulating
      draw();
    }
  }, [phase, simulationStep, resolveThrow, draw]);

  // Redraw when config or pins change (outside simulation)
  useEffect(() => {
    if (phase !== 'simulating') {
      draw();
    }
  }, [config, pins, phase, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={config.canvasSize}
      height={config.canvasSize}
      style={{
        border: '2px solid #4a4a6a',
        borderRadius: '8px',
        backgroundColor: '#1a1a2e',
      }}
    />
  );
}
