import { useState, useEffect } from "react";
import type { ClipboardItem } from "../../models/ClipboardItem";
import "./ClipboardHistory.css";

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

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function ClipboardHistory({}: ClipboardHistoryProps) {
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    window.electronAPI.getClipboardHistory().then(setHistory);

    window.electronAPI.onClipboardUpdate((item) => {
      setHistory((prev) => [item, ...prev]);
    });
  }, []);

  const handleCopyToClipboard = async (text: string) => {
    await window.electronAPI.copyToClipboard(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
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
      <div className="app">
        <header className="header">
          <h1>Clipboard History</h1>
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
                    <div className="item-timestamp">
                      {formatTimestamp(item.timestamp)}
                    </div>
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopyToClipboard(item.text)}
                    title="Copy to clipboard"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.5 2C5.5 1.17157 6.17157 0.5 7 0.5H12C12.8284 0.5 13.5 1.17157 13.5 2V10C13.5 10.8284 12.8284 11.5 12 11.5H11.5V13C11.5 13.8284 10.8284 14.5 10 14.5H4C3.17157 14.5 2.5 13.8284 2.5 13V5C2.5 4.17157 3.17157 3.5 4 3.5H5.5V2Z"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
        {showToast && (
          <div className="toast">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.5 4L6 11.5L2.5 8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Copied to clipboard!
          </div>
        )}
      </div>
    </>
  );
}
