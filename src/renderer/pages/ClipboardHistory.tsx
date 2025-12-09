import { useState, useEffect } from 'react';
import type { ClipboardItem } from '../../models/ClipboardItem';
import './ClipboardHistory.css';

interface ClipboardHistoryProps {
  onSettingsClick: () => void;
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function ClipboardHistory({ onSettingsClick }: ClipboardHistoryProps) {
  const [history, setHistory] = useState<ClipboardItem[]>([]);

  useEffect(() => {
    window.electronAPI.getClipboardHistory().then(setHistory);

    window.electronAPI.onClipboardUpdate((item) => {
      setHistory(prev => [item, ...prev]);
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
                <div className="item-content">
                  <div className="item-text">{item.text}</div>
                  <div className="item-timestamp">{formatTimestamp(item.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
