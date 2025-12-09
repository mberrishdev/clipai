import { useState, useEffect } from "react";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/github-dark.css";
import {
  detectContentType,
  type DetectedContent,
} from "../utils/contentDetector";
import "./ClipboardItem.css";

hljs.registerLanguage("json", json);

interface ClipboardItemProps {
  item: {
    type: "text" | "image";
    text?: string;
    image?: string;
    timestamp: number;
  };
  index: number;
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

export default function HistoryItemCard({ item, index }: ClipboardItemProps) {
  const [detected, setDetected] = useState<DetectedContent | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (item.type === "text" && item.text) {
      setDetected(detectContentType(item.text));
    }
  }, [item]);

  const handleCopy = async () => {
    if (item.type === "text" && item.text) {
      await navigator.clipboard.writeText(item.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (item.type === "image" && item.image) {
      const response = await fetch(item.image);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new (window as any).ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyFormatted = async () => {
    if (detected?.formatted) {
      await navigator.clipboard.writeText(detected.formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleURLClick = async (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    try {
      await window.electronAPI.openExternalURL(url);
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  if (item.type === "image") {
    return (
      <div className="history-item">
        <div className="item-number">{index + 1}</div>
        <div className="item-content">
          <div className="item-header">
            <span className="content-badge content-badge--image">image</span>
            <div className="item-actions">
              <button
                className="action-btn"
                onClick={handleCopy}
                title="Copy image"
              >
                {copied ? "✓" : "Copy"}
              </button>
            </div>
          </div>
          <img
            src={item.image}
            alt="Clipboard"
            className="item-image"
          />
          <div className="item-timestamp">
            {formatTimestamp(item.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  if (!detected || !item.text) return null;

  const shouldTruncate = item.text.length > 200;
  const displayText =
    !isExpanded && shouldTruncate ? item.text.slice(0, 200) + "..." : item.text;

  const displayFormatted =
    detected.formatted &&
    (!isExpanded && shouldTruncate
      ? detected.formatted.slice(0, 200) + "..."
      : detected.formatted);

  return (
    <div className="history-item">
      <div className="item-number">{index + 1}</div>
      <div className="item-content">
        <div className="item-header">
          <span className={`content-badge content-badge--${detected.type}`}>
            {detected.type}
          </span>
          <div className="item-actions">
            <button
              className="action-btn"
              onClick={handleCopy}
              title="Copy raw"
            >
              {copied ? "✓" : "Copy"}
            </button>
            {detected.formatted && (
              <button
                className="action-btn"
                onClick={handleCopyFormatted}
                title="Copy formatted"
              >
                Copy Formatted
              </button>
            )}
          </div>
        </div>

        {detected.type === "json" && detected.formatted ? (
          <pre className="item-code">
            <code
              dangerouslySetInnerHTML={{
                __html: hljs.highlight(displayFormatted || "", {
                  language: "json",
                }).value,
              }}
            />
          </pre>
        ) : detected.type === "color" ? (
          <div className="item-color-preview">
            <div
              className="color-swatch"
              style={{ backgroundColor: item.text.trim() }}
            />
            <span className="item-text">{displayText}</span>
          </div>
        ) : detected.type === "url" && item.text ? (
          <a
            href={item.text.trim()}
            onClick={(e) => handleURLClick(e, item.text!.trim())}
            className="item-link"
          >
            {displayText}
          </a>
        ) : (
          <div className="item-text">{displayText}</div>
        )}

        {shouldTruncate && (
          <button
            className="show-more-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}

        <div className="item-timestamp">{formatTimestamp(item.timestamp)}</div>
      </div>
    </div>
  );
}
