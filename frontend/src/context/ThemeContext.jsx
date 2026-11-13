
import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("ameTheme") || "Light";
  });

  useEffect(() => {
    localStorage.setItem("ameTheme", theme);

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const applyTheme = () => {
      let activeTheme = theme;

      if (theme === "System") {
        activeTheme = mediaQuery.matches ? "Dark" : "Light";
      }

      document.documentElement.setAttribute(
        "data-theme",
        activeTheme.toLowerCase()
      );
    };

    applyTheme();

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

export const useTheme = () => {
  return useContext(ThemeContext);
};
