import React, { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext();

const STORAGE_KEY = "app_dark_mode";

// Preferencia del sistema, usada mientras el usuario no elija manualmente.
const sistemaOscuro = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const leerPreferenciaGuardada = () => {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    return guardado === null ? null : guardado === "true";
  } catch {
    return null;
  }
};

export const DarkModeProvider = ({ children }) => {
  const guardado = leerPreferenciaGuardada();
  const [hasOverride, setHasOverride] = useState(guardado !== null);
  const [isDarkMode, setIsDarkMode] = useState(
    guardado === null ? sistemaOscuro() : guardado
  );

  // Se aplica en <html> y en <body>: el primero controla color-scheme (controles
  // nativos, scrollbars y el canvas del viewport); el segundo mantiene los estilos
  // existentes basados en body.dark-mode.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark-mode", isDarkMode);
    document.body.classList.toggle("dark-mode", isDarkMode);
    root.style.colorScheme = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  // Sin eleccion manual del usuario, sigue los cambios de tema del sistema.
  useEffect(() => {
    if (hasOverride || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => setIsDarkMode(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [hasOverride]);

  const toggleDarkMode = () => {
    const siguiente = !isDarkMode;
    setIsDarkMode(siguiente);
    setHasOverride(true);
    try {
      localStorage.setItem(STORAGE_KEY, String(siguiente));
    } catch {
      /* almacenamiento no disponible: el tema funciona igual en esta sesion */
    }
  };

  // Vuelve a seguir la preferencia del sistema (borra la eleccion manual).
  const useSystemTheme = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sin almacenamiento */
    }
    setHasOverride(false);
    setIsDarkMode(sistemaOscuro());
  };

  return (
    <DarkModeContext.Provider
      value={{ isDarkMode, toggleDarkMode, useSystemTheme, hasOverride }}
    >
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
};
