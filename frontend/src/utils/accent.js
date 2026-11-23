export const ACCENT_COLORS = [
  { name: "Blue", value: "#2563eb" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Green", value: "#16a34a" },
  { name: "Teal", value: "#0d9488" },
  { name: "Orange", value: "#ea580c" },
  { name: "Pink", value: "#db2777" },
  { name: "Red", value: "#dc2626" },
  { name: "Slate", value: "#475569" },
];

const KEY = "ameAccent";

export const getSavedAccent = () => {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
};

// Pass a hex color to apply it, or "" to go back to the default
export const applyAccent = (color = getSavedAccent()) => {
  const root = document.documentElement;

  try {
    if (color) {
      root.style.setProperty("--ame-accent", color);
      root.style.setProperty("--primary-color", color);
      localStorage.setItem(KEY, color);
    } else {
      root.style.removeProperty("--ame-accent");
      root.style.removeProperty("--primary-color");
      localStorage.removeItem(KEY);
    }
  } catch {
    // ignore storage errors
  }
};