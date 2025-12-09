import "./Settings.css";

interface SettingsProps {
  onBack: () => void;
  isTransparent: boolean;
  onTransparencyChange: (value: boolean) => void;
}

export default function Settings({
  isTransparent,
  onTransparencyChange,
}: SettingsProps) {
  const handleTransparencyChange = (value: boolean) => {
    onTransparencyChange(value);
    window.electronAPI.setTransparency(value);
  };

  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="lg-dist">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.01"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
          </filter>
        </defs>
      </svg>
      <div className="settings">
        <header className="settings-header">
          <h1>Settings</h1>
        </header>
        <main className="settings-content">
          <div className="setting-group">
            <h2>Appearance</h2>
            <div className="setting-item">
              <div className="setting-info">
                <label>Window Transparency</label>
                <p>Enable transparent background with blur effect</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={isTransparent}
                  onChange={(e) => handleTransparencyChange(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
