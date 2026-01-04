import { GameCanvas } from './components/GameCanvas';
import { Controls } from './components/Controls';
import { Scoreboard } from './components/Scoreboard';
import { SettingsPanel } from './components/SettingsPanel';

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f1a',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          color: '#fff',
          marginBottom: '20px',
          fontSize: '24px',
        }}
      >
        Wagiri Pin Throw Game Simulator
      </h1>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Settings Panel */}
        <SettingsPanel />

        {/* Center: Game Canvas and Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <GameCanvas />
          <Controls />
        </div>

        {/* Right: Scoreboard */}
        <Scoreboard />
      </div>
    </div>
  );
}

export default App;
