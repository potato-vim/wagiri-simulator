import { useGameStore } from '../store';

export function SettingsPanel() {
  const config = useGameStore((state) => state.config);
  const phase = useGameStore((state) => state.phase);
  const updateConfig = useGameStore((state) => state.updateConfig);
  const updateRing = useGameStore((state) => state.updateRing);
  const addRing = useGameStore((state) => state.addRing);
  const removeRing = useGameStore((state) => state.removeRing);
  const reset = useGameStore((state) => state.reset);

  const isIdle = phase === 'idle';

  const handleNumberChange = (
    key: keyof typeof config,
    value: string,
    min?: number,
    max?: number
  ) => {
    let num = parseFloat(value);
    if (isNaN(num)) return;
    if (min !== undefined) num = Math.max(min, num);
    if (max !== undefined) num = Math.min(max, num);
    updateConfig({ [key]: num });
  };

  const handleBooleanChange = (key: keyof typeof config, value: boolean) => {
    updateConfig({ [key]: value });
  };

  const inputStyle: React.CSSProperties = {
    width: '60px',
    padding: '4px 6px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #4a4a6a',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
  };

  const labelStyle: React.CSSProperties = {
    color: '#aaa',
    fontSize: '11px',
    display: 'block',
    marginBottom: '2px',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #3a3a5a',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        backgroundColor: '#2a2a4a',
        borderRadius: '8px',
        minWidth: '240px',
        maxWidth: '280px',
        maxHeight: '600px',
        overflowY: 'auto',
        fontSize: '12px',
      }}
    >
      <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '14px' }}>
        Settings
      </h3>

      {/* Seed */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Random Seed</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            value={config.seed}
            onChange={(e) => handleNumberChange('seed', e.target.value, 0)}
            disabled={!isIdle}
            style={{ ...inputStyle, width: '80px' }}
          />
          <button
            onClick={() => {
              updateConfig({ seed: Math.floor(Math.random() * 100000) });
              reset();
            }}
            disabled={!isIdle}
            style={{
              padding: '4px 8px',
              backgroundColor: isIdle ? '#4a4a6a' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: isIdle ? 'pointer' : 'not-allowed',
            }}
          >
            Randomize
          </button>
        </div>
      </div>

      {/* Rings */}
      <div style={sectionStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <label style={{ ...labelStyle, marginBottom: 0 }}>
            Rings ({config.rings.length})
          </label>
          <button
            onClick={addRing}
            disabled={!isIdle}
            style={{
              padding: '2px 8px',
              backgroundColor: isIdle ? '#22c55e' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: isIdle ? 'pointer' : 'not-allowed',
            }}
          >
            + Add
          </button>
        </div>

        {config.rings.map((ring, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              marginBottom: '6px',
              padding: '6px',
              backgroundColor: '#1a1a2e',
              borderRadius: '4px',
            }}
          >
            <span style={{ color: '#888', fontSize: '10px', width: '20px' }}>
              #{idx + 1}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '2px' }}>
                <input
                  type="number"
                  value={ring.innerRadius}
                  onChange={(e) =>
                    updateRing(idx, { innerRadius: parseFloat(e.target.value) || 0 })
                  }
                  disabled={!isIdle}
                  style={{ ...inputStyle, width: '40px' }}
                  title="Inner radius"
                />
                <span style={{ color: '#666' }}>-</span>
                <input
                  type="number"
                  value={ring.outerRadius}
                  onChange={(e) =>
                    updateRing(idx, { outerRadius: parseFloat(e.target.value) || 0 })
                  }
                  disabled={!isIdle}
                  style={{ ...inputStyle, width: '40px' }}
                  title="Outer radius"
                />
                <input
                  type="number"
                  value={ring.points}
                  onChange={(e) =>
                    updateRing(idx, { points: parseInt(e.target.value) || 0 })
                  }
                  disabled={!isIdle}
                  style={{ ...inputStyle, width: '30px' }}
                  title="Points"
                />
                <span style={{ color: '#888', fontSize: '10px' }}>pts</span>
              </div>
            </div>
            {config.rings.length > 1 && (
              <button
                onClick={() => removeRing(idx)}
                disabled={!isIdle}
                style={{
                  padding: '2px 6px',
                  backgroundColor: isIdle ? '#ef4444' : '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: isIdle ? 'pointer' : 'not-allowed',
                }}
              >
                X
              </button>
            )}
          </div>
        ))}

        <div style={{ marginTop: '4px' }}>
          <label style={labelStyle}>Outside Score</label>
          <input
            type="number"
            value={config.outsideScore}
            onChange={(e) => handleNumberChange('outsideScore', e.target.value)}
            disabled={!isIdle}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Physics */}
      <div style={sectionStyle}>
        <label style={{ ...labelStyle, fontWeight: 'bold', marginBottom: '8px' }}>
          Physics
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={labelStyle}>Pin Radius</label>
            <input
              type="number"
              value={config.pinRadius}
              onChange={(e) => handleNumberChange('pinRadius', e.target.value, 5, 30)}
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Pin Height</label>
            <input
              type="number"
              value={config.pinHeight}
              onChange={(e) => handleNumberChange('pinHeight', e.target.value, 10, 60)}
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Friction</label>
            <input
              type="number"
              step="0.01"
              value={config.friction}
              onChange={(e) =>
                handleNumberChange('friction', e.target.value, 0.9, 0.999)
              }
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Stop Threshold</label>
            <input
              type="number"
              step="0.1"
              value={config.stopThreshold}
              onChange={(e) =>
                handleNumberChange('stopThreshold', e.target.value, 0.1, 2)
              }
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Max Pins</label>
            <input
              type="number"
              value={config.maxPinsOnBoard}
              onChange={(e) =>
                handleNumberChange('maxPinsOnBoard', e.target.value, 1, 50)
              }
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* 3D Physics */}
      <div style={sectionStyle}>
        <label style={{ ...labelStyle, fontWeight: 'bold', marginBottom: '8px', color: '#00ff88' }}>
          3D Physics
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={labelStyle}>Gravity</label>
            <input
              type="number"
              step="0.1"
              value={config.gravity}
              onChange={(e) => handleNumberChange('gravity', e.target.value, 0.1, 2)}
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Ground Bounce</label>
            <input
              type="number"
              step="0.1"
              value={config.groundRestitution}
              onChange={(e) =>
                handleNumberChange('groundRestitution', e.target.value, 0, 0.9)
              }
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Collision Z Range</label>
            <input
              type="number"
              value={config.collisionZThreshold}
              onChange={(e) =>
                handleNumberChange('collisionZThreshold', e.target.value, 5, 50)
              }
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Default Pitch</label>
            <input
              type="number"
              value={config.throwPitch}
              onChange={(e) => handleNumberChange('throwPitch', e.target.value, 0, 45)}
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ marginTop: '4px', color: '#666', fontSize: '10px' }}>
          Pins collide only when near ground (z &lt; threshold)
        </div>
      </div>

      {/* Probabilities */}
      <div style={sectionStyle}>
        <label style={{ ...labelStyle, fontWeight: 'bold', marginBottom: '8px' }}>
          Probabilities
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={labelStyle}>Base Stand</label>
            <input
              type="number"
              step="0.05"
              value={config.baseStandProb}
              onChange={(e) =>
                handleNumberChange('baseStandProb', e.target.value, 0, 1)
              }
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Base Knock</label>
            <input
              type="number"
              step="0.05"
              value={config.baseKnockProb}
              onChange={(e) =>
                handleNumberChange('baseKnockProb', e.target.value, 0, 1)
              }
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Impact Factor</label>
            <input
              type="number"
              step="0.01"
              value={config.impactSpeedFactor}
              onChange={(e) =>
                handleNumberChange('impactSpeedFactor', e.target.value, 0, 0.2)
              }
              disabled={!isIdle}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={config.ringBonusEnabled}
              onChange={(e) =>
                handleBooleanChange('ringBonusEnabled', e.target.checked)
              }
              disabled={!isIdle}
            />
            <span style={{ color: '#ccc', fontSize: '11px' }}>
              Ring Bonus (+10% stand per inner ring)
            </span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={config.collisionPenaltyEnabled}
              onChange={(e) =>
                handleBooleanChange('collisionPenaltyEnabled', e.target.checked)
              }
              disabled={!isIdle}
            />
            <span style={{ color: '#ccc', fontSize: '11px' }}>
              Collision Penalty (-15% stand per hit)
            </span>
          </label>
        </div>
      </div>

      {/* Canvas */}
      <div>
        <label style={labelStyle}>Canvas Size</label>
        <input
          type="number"
          value={config.canvasSize}
          onChange={(e) => handleNumberChange('canvasSize', e.target.value, 300, 800)}
          disabled={!isIdle}
          style={inputStyle}
        />
      </div>
    </div>
  );
}
