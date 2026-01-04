import { useGameStore } from '../store';

export function Scoreboard() {
  const players = useGameStore((state) => state.players);
  const currentPlayerId = useGameStore((state) => state.currentPlayerId);
  const phase = useGameStore((state) => state.phase);
  const eventLog = useGameStore((state) => state.eventLog);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#2a2a4a',
        borderRadius: '8px',
        minWidth: '280px',
        maxWidth: '320px',
      }}
    >
      <h3 style={{ margin: 0, color: '#fff', textAlign: 'center' }}>
        Scoreboard
      </h3>

      {/* Player Scores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {players.map((player) => (
          <div
            key={player.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              backgroundColor:
                currentPlayerId === player.id ? player.color + '40' : '#1a1a2e',
              borderRadius: '6px',
              border:
                currentPlayerId === player.id
                  ? `2px solid ${player.color}`
                  : '2px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: player.color,
                }}
              />
              <span style={{ color: '#fff', fontWeight: 'bold' }}>
                {player.name}
              </span>
            </div>
            <span
              style={{
                color: player.color,
                fontWeight: 'bold',
                fontSize: '20px',
              }}
            >
              {player.score}
            </span>
          </div>
        ))}
      </div>

      {/* Phase indicator */}
      <div
        style={{
          textAlign: 'center',
          padding: '8px',
          backgroundColor: '#1a1a2e',
          borderRadius: '4px',
        }}
      >
        <span style={{ color: '#888', fontSize: '12px' }}>Phase: </span>
        <span
          style={{
            color:
              phase === 'idle'
                ? '#22c55e'
                : phase === 'simulating'
                  ? '#fbbf24'
                  : phase === 'resolving'
                    ? '#f97316'
                    : '#3b82f6',
            fontWeight: 'bold',
          }}
        >
          {phase}
        </span>
      </div>

      {/* Event Log */}
      <div style={{ marginTop: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#aaa', fontSize: '14px' }}>
          Event Log
        </h4>
        <div
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {eventLog.length === 0 ? (
            <div style={{ color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
              No events yet
            </div>
          ) : (
            [...eventLog].reverse().map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: '8px',
                  backgroundColor: '#1a1a2e',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
              >
                <div style={{ color: '#ddd', marginBottom: '4px' }}>
                  {entry.text}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span
                    style={{
                      color:
                        entry.deltaP1 > 0
                          ? '#22c55e'
                          : entry.deltaP1 < 0
                            ? '#ef4444'
                            : '#888',
                    }}
                  >
                    P1: {entry.deltaP1 >= 0 ? '+' : ''}
                    {entry.deltaP1}
                  </span>
                  <span
                    style={{
                      color:
                        entry.deltaP2 > 0
                          ? '#22c55e'
                          : entry.deltaP2 < 0
                            ? '#ef4444'
                            : '#888',
                    }}
                  >
                    P2: {entry.deltaP2 >= 0 ? '+' : ''}
                    {entry.deltaP2}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
