import { useState, useEffect, useCallback } from "react";
import "./Settings.css";

interface SettingsProps {
  isTransparent: boolean;
  onTransparencyChange: (value: boolean) => void;
}

function keyEventToAccelerator(e: KeyboardEvent): string {
  const parts: string[] = [];

  if (e.metaKey || e.ctrlKey) parts.push("CommandOrControl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");

  const key = e.key;

  if (["Control", "Shift", "Alt", "Meta"].includes(key)) {
    return "";
  }

  const keyMap: Record<string, string> = {
    " ": "Space",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Escape: "Escape",
    Enter: "Enter",
    Backspace: "Backspace",
    Delete: "Delete",
    Tab: "Tab",
  };

  const mappedKey = keyMap[key] || key.toUpperCase();
  parts.push(mappedKey);

  return parts.join("+");
}

function formatShortcutDisplay(shortcut: string): string {
  return shortcut
    .replace("CommandOrControl", "⌘/Ctrl")
    .replace("Shift", "⇧")
    .replace("Alt", "⌥")
    .replace(/\+/g, " + ");
}

export default function Settings({
  isTransparent,
  onTransparencyChange,
}: SettingsProps) {
  const [globalShortcut, setGlobalShortcut] = useState(
    "CommandOrControl+Shift+V"
  );
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);
  const [recordedShortcut, setRecordedShortcut] = useState("");
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

  // Handle keyboard capture for shortcut recording
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecordingShortcut) return;

      e.preventDefault();
      e.stopPropagation();

      const accelerator = keyEventToAccelerator(e);
      if (accelerator) {
        setRecordedShortcut(accelerator);
      }
    },
    [isRecordingShortcut]
  );

  useEffect(() => {
    if (isRecordingShortcut) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isRecordingShortcut, handleKeyDown]);

  const handleTransparencyChange = (value: boolean) => {
    onTransparencyChange(value);
    window.electronAPI.setTransparency(value);
  };

  const startRecording = () => {
    setIsRecordingShortcut(true);
    setRecordedShortcut("");
    setShortcutError("");
  };

  const handleShortcutSave = async () => {
    if (!recordedShortcut) {
      setShortcutError("Please press a key combination");
      return;
    }

    setShortcutError("");
    const result = await window.electronAPI.setGlobalShortcut(recordedShortcut);
    if (result.success) {
      setGlobalShortcut(recordedShortcut);
      setIsRecordingShortcut(false);
      setRecordedShortcut("");
    } else {
      setShortcutError(result.error || "Failed to register shortcut");
    }
  };

  const handleShortcutCancel = () => {
    setIsRecordingShortcut(false);
    setRecordedShortcut("");
    setShortcutError("");
  };

  const handleApiKeySave = async () => {
    setApiKeyError("");
    setApiKeySuccess(false);

    if (!openaiApiKey.trim()) {
      setApiKeyError("API key cannot be empty");
      return;
    }

    const result = await window.electronAPI.setOpenAIApiKey(
      openaiApiKey.trim()
    );
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
                {isRecordingShortcut ? (
                  <>
                    <div
                      className={`shortcut-recorder ${
                        recordedShortcut ? "has-value" : ""
                      }`}
                    >
                      {recordedShortcut ? (
                        <span className="recorded-keys">
                          {formatShortcutDisplay(recordedShortcut)}
                        </span>
                      ) : (
                        <span className="recording-prompt">
                          <span className="pulse-dot"></span>
                          Press keys...
                        </span>
                      )}
                    </div>
                    <button
                      className="btn-primary"
                      onClick={handleShortcutSave}
                      disabled={!recordedShortcut}
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
                    <span className="shortcut-display">
                      {formatShortcutDisplay(globalShortcut)}
                    </span>
                    <button className="btn-secondary" onClick={startRecording}>
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
                {apiKeyError && <p className="error-message">{apiKeyError}</p>}
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
                    <button className="btn-primary" onClick={handleApiKeySave}>
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
