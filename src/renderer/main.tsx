import { createRoot } from "react-dom/client";
import App from "./App";
import { disableConsoleInProduction } from "./utils/disableConsole";

disableConsoleInProduction();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = createRoot(rootElement);

root.render(<App />);
