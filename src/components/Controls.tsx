import { useGameStore } from '../store';

export function Controls() {
  const config = useGameStore((state) => state.config);
  const phase = useGameStore((state) => state.phase);
  const currentPlayerId = useGameStore((state) => state.currentPlayerId);
  const players = useGameStore((state) => state.players);

  const setThrowParams = useGameStore((state) => state.setThrowParams);
  const updateConfig = useGameStore((state) => state.updateConfig);
  const throwPin = useGameStore((state) => state.throwPin);
  const nextTurn = useGameStore((state) => state.nextTurn);
  const reset = useGameStore((state) => state.reset);

  const isIdle = phase === 'idle';
  const isTurnEnd = phase === 'turnEnd';
  const currentPlayer = players[currentPlayerId - 1];

  const handleAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThrowParams(Number(e.target.value), config.throwPower);
  };

  const handlePowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThrowParams(config.throwAngle, Number(e.target.value));
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ throwPitch: Number(e.target.value) });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#2a2a4a',
        borderRadius: '8px',
        minWidth: '300px',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          color: currentPlayer.color,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        {currentPlayer.name}'s Turn
      </div>

      {/* Angle Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ color: '#aaa', fontSize: '12px' }}>
          Angle: {config.throwAngle.toFixed(0)}°
        </label>
        <input
          type="range"
          min={-60}
          max={60}
          step={1}
          value={config.throwAngle}
          onChange={handleAngleChange}
          disabled={!isIdle}
          style={{ width: '100%' }}
        />
      </div>

      {/* Power Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ color: '#aaa', fontSize: '12px' }}>
          Power: {(config.throwPower * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.01}
          value={config.throwPower}
          onChange={handlePowerChange}
          disabled={!isIdle}
          style={{ width: '100%' }}
        />
      </div>

      {/* Pitch Slider (vertical angle) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ color: '#00ff88', fontSize: '12px' }}>
          Pitch: {config.throwPitch.toFixed(0)}° (vertical)
        </label>
        <input
          type="range"
          min={0}
          max={45}
          step={1}
          value={config.throwPitch}
          onChange={handlePitchChange}
          disabled={!isIdle}
          style={{ width: '100%' }}
        />
        <div style={{ color: '#666', fontSize: '10px' }}>
          0° = flat | 45° = high arc
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={throwPin}
          disabled={!isIdle}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: isIdle ? '#22c55e' : '#555',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: isIdle ? 'pointer' : 'not-allowed',
          }}
        >
          Throw!
        </button>

        <button
          onClick={nextTurn}
          disabled={!isTurnEnd}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: isTurnEnd ? '#3b82f6' : '#555',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: isTurnEnd ? 'pointer' : 'not-allowed',
          }}
        >
          Next Turn
        </button>

        <button
          onClick={reset}
          style={{
            padding: '12px 16px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      {/* Phase indicator */}
      <div
        style={{
          textAlign: 'center',
          color: '#888',
          fontSize: '12px',
          marginTop: '4px',
        }}
      >
        Phase: <span style={{ color: '#fff' }}>{phase}</span>
      </div>
    </div>
  );
}
