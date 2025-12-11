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

  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState("");
  const [apiKeySuccess, setApiKeySuccess] = useState(false);

  useEffect(() => {
    window.electronAPI.getConfig().then((config) => {
      setGlobalShortcut(config.globalShortcut);
      setOpenaiApiKey(config.openaiApiKey || "");
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

  const handleApiKeySave = async () => {
    setApiKeyError("");
    setApiKeySuccess(false);

    if (!openaiApiKey.trim()) {
      setApiKeyError("API key cannot be empty");
      return;
    }

    const result = await window.electronAPI.setOpenAIApiKey(openaiApiKey.trim());
    if (result.success) {
      setIsEditingApiKey(false);
      setApiKeySuccess(true);
      setTimeout(() => setApiKeySuccess(false), 3000);
    } else {
      setApiKeyError(result.error || "Failed to save API key");
    }
  };

  const handleApiKeyCancel = async () => {
    setIsEditingApiKey(false);
    setApiKeyError("");
    const config = await window.electronAPI.getConfig();
    setOpenaiApiKey(config.openaiApiKey || "");
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

          <div className="setting-group">
            <h2>AI Features</h2>
            <div className="setting-item">
              <div className="setting-info">
                <label>OpenAI API Key</label>
                <p>Required for semantic search functionality</p>
                {apiKeyError && (
                  <p className="error-message">{apiKeyError}</p>
                )}
                {apiKeySuccess && (
                  <p className="success-message">API key saved successfully!</p>
                )}
              </div>
              <div className="shortcut-control">
                {isEditingApiKey ? (
                  <>
                    <input
                      type="password"
                      className="shortcut-input"
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      placeholder="sk-..."
                    />
                    <button
                      className="btn-primary"
                      onClick={handleApiKeySave}
                    >
                      Save
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={handleApiKeyCancel}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="shortcut-display">
                      {openaiApiKey ? "••••••••••••••••" : "Not configured"}
                    </span>
                    <button
                      className="btn-secondary"
                      onClick={() => setIsEditingApiKey(true)}
                    >
                      {openaiApiKey ? "Change" : "Add"}
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
