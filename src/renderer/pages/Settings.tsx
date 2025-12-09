import { useState, useEffect } from "react";
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
  const [globalShortcut, setGlobalShortcut] = useState(
    "CommandOrControl+Shift+V"
  );
  const [isEditingShortcut, setIsEditingShortcut] = useState(false);
  const [shortcutError, setShortcutError] = useState("");

  useEffect(() => {
    window.electronAPI.getConfig().then((config) => {
      setGlobalShortcut(config.globalShortcut);
    });
  }, []);

  const handleTransparencyChange = (value: boolean) => {
    onTransparencyChange(value);
    window.electronAPI.setTransparency(value);
  };

  const handleShortcutSave = async () => {
    setShortcutError("");
    const result = await window.electronAPI.setGlobalShortcut(globalShortcut);
    if (result.success) {
      setIsEditingShortcut(false);
    } else {
      setShortcutError(result.error || "Failed to register shortcut");
    }
  };

  const handleShortcutCancel = async () => {
    setIsEditingShortcut(false);
    setShortcutError("");
    const config = await window.electronAPI.getConfig();
    setGlobalShortcut(config.globalShortcut);
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

          <div className="setting-group">
            <h2>Keyboard Shortcuts</h2>
            <div className="setting-item">
              <div className="setting-info">
                <label>Global Shortcut</label>
                <p>Show/hide clipboard history from anywhere</p>
                {shortcutError && (
                  <p className="error-message">{shortcutError}</p>
                )}
              </div>
              <div className="shortcut-control">
                {isEditingShortcut ? (
                  <>
                    <input
                      type="text"
                      className="shortcut-input"
                      value={globalShortcut}
                      onChange={(e) => setGlobalShortcut(e.target.value)}
                      placeholder="e.g., CommandOrControl+Shift+V"
                    />
                    <button
                      className="btn-primary"
                      onClick={handleShortcutSave}
                    >
                      Save
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={handleShortcutCancel}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="shortcut-display">{globalShortcut}</span>
                    <button
                      className="btn-secondary"
                      onClick={() => setIsEditingShortcut(true)}
                    >
                      Change
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
