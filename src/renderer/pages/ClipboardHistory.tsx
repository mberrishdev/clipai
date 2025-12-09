import { useState, useEffect } from "react";
import type { ClipboardItem as ClipboardItemType } from "../../models/ClipboardItem";
import HistoryItemCard from "../components/ClipboardItem";
import "./ClipboardHistory.css";

interface ClipboardHistoryProps {
  onSettingsClick: () => void;
}

export default function ClipboardHistory({}: ClipboardHistoryProps) {
  const [history, setHistory] = useState<ClipboardItemType[]>([]);

  useEffect(() => {
    window.electronAPI.getClipboardHistory().then(setHistory);

    window.electronAPI.onClipboardUpdate((item) => {
      setHistory((prev) => [item, ...prev]);
    });
  }, []);

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
                <HistoryItemCard
                  key={index}
                  item={item}
                  index={index}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
