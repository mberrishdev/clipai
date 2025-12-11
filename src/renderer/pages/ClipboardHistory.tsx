import { useState, useEffect, useRef, useCallback } from "react";
import type { ClipboardItem as ClipboardItemType } from "../../models/ClipboardItem";
import HistoryItemCard from "../components/ClipboardItem";
import "./ClipboardHistory.css";

interface ClipboardHistoryProps {
  onSettingsClick: () => void;
}

export default function ClipboardHistory({}: ClipboardHistoryProps) {
  const [history, setHistory] = useState<ClipboardItemType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    window.electronAPI.getClipboardHistory().then((items) => {
      console.log(`Initial history loaded: ${items.length} items`);
      setHistory(items);
    });

    window.electronAPI.onClipboardUpdate((item) => {
      setHistory((prev) => [item, ...prev]);
    });
  }, []);

  const loadMore = async () => {
    if (isLoading || !hasMore) {
      console.log(`loadMore blocked: isLoading=${isLoading}, hasMore=${hasMore}`);
      return;
    }

    console.log('loadMore: Fetching more items...');
    setIsLoading(true);
    try {
      const moreItems = await window.electronAPI.loadMoreHistory(20);
      console.log(`Loaded ${moreItems.length} more clipboard items`);
      if (moreItems.length === 0) {
        setHasMore(false);
      } else {
        setHistory((prev) => [...prev, ...moreItems]);
      }
    } catch (error) {
      console.error("Failed to load more items:", error);
    } finally {
      setIsLoading(false);
    }
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
            <>
              <div className="history-list">
                {history.map((item, index) => (
                  <HistoryItemCard
                    key={item.id || index}
                    item={item}
                    index={index}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="load-more-container">
                  <button
                    className="load-more-btn"
                    onClick={loadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
