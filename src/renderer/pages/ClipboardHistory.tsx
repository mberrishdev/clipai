import { useState, useEffect, useCallback, useRef } from "react";
import type { ClipboardItem as ClipboardItemType } from "../../models/ClipboardItem";
import HistoryItemCard from "../components/ClipboardItem";
import { detectContentType } from "../utils/contentDetector";
import "./ClipboardHistory.css";

interface ClipboardHistoryProps {}

export default function ClipboardHistory({}: ClipboardHistoryProps) {
  const [history, setHistory] = useState<ClipboardItemType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const performSearch = async () => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      try {
        const results = await window.electronAPI.semanticSearch(
          searchQuery,
          10
        );
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

  const copySelectedItem = useCallback(async () => {
    const item = history[selectedIndex];
    if (!item) return;

    if (item.type === "text" && item.text) {
      await navigator.clipboard.writeText(item.text);
    } else if (item.type === "image" && item.image) {
      const response = await fetch(item.image);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new (window as any).ClipboardItem({ [blob.type]: blob }),
      ]);
    }
  }, [history, selectedIndex]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in search input
      if (
        document.activeElement === searchInputRef.current &&
        e.key !== "Escape" &&
        e.key !== "ArrowDown" &&
        e.key !== "ArrowUp"
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, history.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          if (document.activeElement !== searchInputRef.current) {
            e.preventDefault();
            const item = history[selectedIndex];
            if (item?.type === "text" && item.text) {
              const detected = detectContentType(item.text);
              if (detected.type === "url") {
                window.electronAPI.openExternalURL(item.text.trim());
                return;
              }
            }
            copySelectedItem();
          }
          break;
        case "c":
        case "C":
          if (document.activeElement !== searchInputRef.current) {
            e.preventDefault();
            copySelectedItem();
          }
          break;
        case "Escape":
          e.preventDefault();
          searchInputRef.current?.blur();
          break;
        case "/":
          if (document.activeElement !== searchInputRef.current) {
            e.preventDefault();
            searchInputRef.current?.focus();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [history.length, copySelectedItem]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  // Reset selection when history changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [history.length]);

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
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder={
                hasApiKey
                  ? "Search with AI... (press / to focus)"
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
            <p className="search-hint">
              Press Enter to search • ↑↓ Navigate • Enter/C to copy • / to
              search
            </p>
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
              <div className="history-list" ref={listRef}>
                {history.map((item, index) => (
                  <HistoryItemCard
                    key={item.id || index}
                    item={item}
                    index={index}
                    isSelected={index === selectedIndex}
                    onSelect={() => setSelectedIndex(index)}
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
