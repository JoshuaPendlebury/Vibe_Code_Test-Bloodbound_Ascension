import "./styles/main.css";
import { GameUI } from "./ui/GameUI";

const root = document.querySelector<HTMLElement>("#app");
if (root) new GameUI(root).start();
