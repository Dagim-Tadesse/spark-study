import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root");
const root = createRoot(rootEl!);

root.render(<App />);

// Remove the splash element once the app has mounted to avoid a white flash
function removeSplash() {
	const splash = document.getElementById("splash");
	if (!splash) return;
	splash.classList.add("splash-fade");
	setTimeout(() => {
		splash.remove();
	}, 350);
}

// Run after paint so the app has a chance to render first frame
requestAnimationFrame(() => requestAnimationFrame(removeSplash));
