import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const themeOptions = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function CheckTheme() {
  const selectedTheme = localStorage.getItem("theme");

  // If no theme is set or if the selected theme is not in our options, default to system
  if (
    !selectedTheme ||
    !themeOptions.find((themes) => themes.value === selectedTheme)
  ) {
    localStorage.setItem("theme", "system");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    document.body.classList.add(systemTheme);
    return "system";
  }

  if (selectedTheme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    document.body.classList.add(systemTheme);
    return "system";
  }

  document.body.classList.add(selectedTheme);
  return selectedTheme;
}

const ThemeChanger = () => {
  const [currentTheme, setCurrentTheme] = useState(CheckTheme());

  useEffect(() => {
    localStorage.setItem("theme", currentTheme);

    // Remove all theme classes
    document.body.classList.remove("light", "dark");

    if (currentTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      document.body.classList.add(systemTheme);
    } else {
      document.body.classList.add(currentTheme);
    }
  }, [currentTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (currentTheme === "system") {
        document.body.classList.remove("light", "dark");
        const systemTheme = mediaQuery.matches ? "dark" : "light";
        document.body.classList.add(systemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [currentTheme]);

  return (
    <label className="flex">
      Theme:
      <Select
        value={currentTheme}
        onValueChange={(value) => setCurrentTheme(value)}
      >
        <SelectTrigger className="ml-4 bg-[var(--higher-background)] rounded border border-[var(--border-color)] overflow-hidden w-32 text-center">
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent className="bg-[var(--higher-background)]">
          {themeOptions.map((themes) => (
            <SelectItem
              className="hover:bg-[var(--background)]"
              key={themes.value}
              value={themes.value}
            >
              {themes.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
};

export default ThemeChanger;
