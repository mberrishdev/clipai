import './Settings.css';

interface SettingsProps {
  onBack: () => void;
  isTransparent: boolean;
  onTransparencyChange: (value: boolean) => void;
}

export default function Settings({ onBack, isTransparent, onTransparencyChange }: SettingsProps) {
  const handleTransparencyChange = (value: boolean) => {
    onTransparencyChange(value);
    window.electronAPI.setTransparency(value);
  };

  return (
    <div className="settings">
      <header className="settings-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>⚙️ Settings</h1>
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
  );
}
