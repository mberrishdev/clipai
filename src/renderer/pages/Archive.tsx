import { useState, useEffect, useRef } from "react";
import type { ClipboardItem as ClipboardItemType } from "../../models/ClipboardItem";
import HistoryItemCard from "../components/ClipboardItem";
import "./ClipboardHistory.css";

export default function Archive() {
  const [archivedHistory, setArchivedHistory] = useState<ClipboardItemType[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [hasMoreArchive, setHasMoreArchive] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load archived items
  const loadArchivedItems = async (limit: number = 50, offset: number = 0) => {
    setIsLoadingArchive(true);
    try {
      const items = await window.electronAPI.getArchivedHistory(limit, offset);
      if (offset === 0) {
        setArchivedHistory(items);
      } else {
        setArchivedHistory((prev) => [...prev, ...items]);
      }
      if (items.length === 0) {
        setHasMoreArchive(false);
      }
    } catch (error) {
      console.error("Failed to load archived items:", error);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  // Handle unarchive
  const handleUnarchive = async (id: number) => {
    const result = await window.electronAPI.unarchiveItem(id);
    if (result.success) {
      // Remove from archived list
      setArchivedHistory((prev) => prev.filter((item) => item.id !== id));
    } else {
      alert("Failed to unarchive item: " + result.error);
    }
  };

  // Handle delete archived
  const handleDeleteArchived = async (id: number) => {
    if (window.confirm("Permanently delete this archived item?")) {
      const result = await window.electronAPI.deleteArchivedItem(id);
      if (result.success) {
        setArchivedHistory((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("Failed to delete archived item: " + result.error);
      }
    }
  };

  // Perform semantic search in archive
  const performSearch = async () => {
    if (searchQuery.trim()) {
      setIsLoadingArchive(true);
      try {
        const results = await window.electronAPI.semanticSearchArchive(
          searchQuery,
          10
        );
        setArchivedHistory(results);
      } catch (error) {
        console.error("Archive semantic search failed:", error);
      } finally {
        setIsLoadingArchive(false);
      }
    } else {
      // Reload full archive
      loadArchivedItems();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  useEffect(() => {
    loadArchivedItems();

    window.electronAPI.getConfig().then((config) => {
      setHasApiKey(!!config.openaiApiKey);
    });
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in search input
      if (document.activeElement === searchInputRef.current && e.key !== "Escape") {
        return;
      }

      switch (e.key) {
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
        case ",":
          if (document.activeElement !== searchInputRef.current) {
            e.preventDefault();
            window.electronAPI.navigate("settings");
          }
          break;
        case "h":
        case "H":
          if (document.activeElement !== searchInputRef.current) {
            e.preventDefault();
            window.electronAPI.navigate("history");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
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
          <h1>Archive</h1>
        </header>
        {hasApiKey && (
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
                placeholder="Search archive with AI... (press / to focus)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {searchQuery && (
                <button
                  className="clear-btn"
                  onClick={() => {
                    setSearchQuery("");
                    loadArchivedItems();
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
            <p className="search-hint">
              Press Enter to search • , Settings • H History
            </p>
          </div>
        )}
        {!hasApiKey && (
          <div className="search-container">
            <p className="search-hint">
              , Settings • H History
            </p>
          </div>
        )}
        <main className="content">
          {archivedHistory.length === 0 ? (
            <div className="empty-state">
              <p>No archived items yet</p>
              <p className="hint">
                Items older than your retention period will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="history-list">
                {archivedHistory.map((item, index) => (
                  <HistoryItemCard
                    key={item.id || index}
                    item={item}
                    index={index}
                    isSelected={false}
                    onSelect={() => {}}
                    showArchiveActions={true}
                    onUnarchive={() => handleUnarchive(item.id!)}
                    onDelete={() => handleDeleteArchived(item.id!)}
                  />
                ))}
              </div>
              {hasMoreArchive && (
                <div className="load-more-container">
                  <button
                    className="load-more-btn"
                    onClick={() =>
                      loadArchivedItems(50, archivedHistory.length)
                    }
                    disabled={isLoadingArchive}
                  >
                    {isLoadingArchive ? "Loading..." : "Load More"}
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