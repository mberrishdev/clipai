import { useState, useEffect } from 'react';
import './ClipboardHistory.css';

interface ClipboardHistoryProps {
  onSettingsClick: () => void;
}

export default function ClipboardHistory({ onSettingsClick }: ClipboardHistoryProps) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    window.electronAPI.getClipboardHistory().then(setHistory);

    window.electronAPI.onClipboardUpdate((text) => {
      setHistory(prev => [text, ...prev]);
    });
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>📋 Clipboard History</h1>
        <button className="settings-btn" onClick={onSettingsClick}>⚙️</button>
      </header>
      <main className="content">
        {history.length === 0 ? (
          <div className="empty-state">
            <p>No clipboard items yet</p>
            <p className="hint">Copy some text to get started</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <div className="item-number">{index + 1}</div>
                <div className="item-content">{item}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
