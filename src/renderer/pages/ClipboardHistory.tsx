import { useState, useEffect } from "react";
import type { ClipboardItem as ClipboardItemType } from "../../models/ClipboardItem";
import HistoryItemCard from "../components/ClipboardItem";
import "./ClipboardHistory.css";

interface ClipboardHistoryProps {}

export default function ClipboardHistory({}: ClipboardHistoryProps) {
  const [history, setHistory] = useState<ClipboardItemType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);

  const performSearch = async () => {
    console.log("Search triggered for:", searchQuery);

    if (searchQuery.trim()) {
      setIsLoading(true);
      try {
        console.log("Performing semantic search for:", searchQuery);
        const results = await window.electronAPI.semanticSearch(
          searchQuery,
          10
        );
        console.log(`Found ${results.length} results:`, results);
        setHistory(results);
      } catch (error) {
        console.error("Semantic search failed:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log("Empty query, reloading full history");
      const fullHistory = await window.electronAPI.getClipboardHistory();
      setHistory(fullHistory);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  useEffect(() => {
    window.electronAPI.getClipboardHistory().then((items) => {
      console.log(`Initial history loaded: ${items.length} items`);
      setHistory(items);
    });

    window.electronAPI.getConfig().then((config) => {
      setHasApiKey(!!config.openaiApiKey);
    });

    window.electronAPI.onClipboardUpdate((item) => {
      setHistory((prev) => [item, ...prev]);
    });
  }, []);

  const loadMore = async () => {
    if (isLoading || !hasMore) {
      console.log(
        `loadMore blocked: isLoading=${isLoading}, hasMore=${hasMore}`
      );
      return;
    }

    console.log("loadMore: Fetching more items...");
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
        <div className="search-container">
          <div className="search-wrapper">
            <svg
              className="search-icon"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder={
                hasApiKey
                  ? "Search with AI..."
                  : "Configure OpenAI API key in settings..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!hasApiKey}
            />
            {searchQuery && (
              <button
                className="clear-btn"
                onClick={async () => {
                  setSearchQuery("");
                  console.log("Search cleared, reloading full history");
                  const fullHistory =
                    await window.electronAPI.getClipboardHistory();
                  setHistory(fullHistory);
                }}
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
          {hasApiKey ? (
            <p className="search-hint">Press Enter to search</p>
          ) : (
            <p className="search-warning">
              OpenAI API key required. Configure in Settings to enable semantic
              search.
            </p>
          )}
        </div>
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
                    {isLoading ? "Loading..." : "Load More"}
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
