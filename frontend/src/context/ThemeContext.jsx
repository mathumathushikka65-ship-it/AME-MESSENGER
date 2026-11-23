import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const VALID_THEMES = ["Light", "Dark", "System"];

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem("ameTheme");
    return VALID_THEMES.includes(saved) ? saved : "Light";
  } catch {
    return "Light";
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Ignore invalid values (for example a bad value coming from the server)
  const setTheme = (value) => {
    if (VALID_THEMES.includes(value)) {
      setThemeState(value);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem("ameTheme", theme);
    } catch {
      // ignore storage errors
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const activeTheme =
        theme === "System" ? (mediaQuery.matches ? "Dark" : "Light") : theme;

      document.documentElement.setAttribute("data-theme", activeTheme.toLowerCase());
    };

    applyTheme();

    // Follow the computer's theme only while "System" is selected
    if (theme === "System") {
      mediaQuery.addEventListener("change", applyTheme);
    }

    return () => {
      mediaQuery.removeEventListener("change", applyTheme);
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);