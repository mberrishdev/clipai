import { useState, useEffect } from "react";
import ClipboardHistory from "./pages/ClipboardHistory";
import Settings from "./pages/Settings";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"history" | "settings">(
    "history"
  );
  const [isTransparent, setIsTransparent] = useState(false);

  useEffect(() => {
    window.electronAPI.onNavigate((page) => {
      setCurrentPage(page as "history" | "settings");
    });
  }, []);

  useEffect(() => {
    document.body.className = isTransparent ? "transparent" : "opaque";
  }, [isTransparent]);

  return (
    <>
      {currentPage === "history" && <ClipboardHistory />}
      {currentPage === "settings" && (
        <Settings
          isTransparent={isTransparent}
          onTransparencyChange={setIsTransparent}
        />
      )}
    </>
  );
}
