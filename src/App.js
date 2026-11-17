import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toast } from "primereact/toast";
import { DarkModeProvider } from "./hooks/useDarkMode";
import Navbar from "././components/layout/Navbar";
import Home from "././pages/Home";
import ProtectedRoute from "././components/features/ProtectedRoute";
import "././styles/App.css";
// Los estilos de las paginas se cargan de forma global: varias paginas reutilizan
// clases de otra (p. ej. RegistroSolicitudesPage usa clientes-* de Clientes.css) y
// con el code splitting por rutas esas hojas ya no llegaban a todas.
import "./styles/AsociarClienteContacto.css";
import "./styles/AudioPlayer.css";
import "./styles/BatteryStatus.css";
import "./styles/ClienteDialog.css";
import "./styles/Clientes.css";
import "./styles/Contactar.css";
import "./styles/Contactos.css";
import "./styles/ErpClave.css";
import "./styles/Home.css";
import "./styles/legacy-grid.css";
import "./styles/Login.css";
import "./styles/OpenWeatherMapComponent.css";
import "./styles/SalesDashboard.css";
import "./styles/TomaTensionDashboard.css";
import "./styles/VideoPlayer.css";
import "./styles/VideosPage.css";
import "./styles/Weather.css";
import "./styles/WorkTimeCalculator.css";
import "./styles/ZamAirDashboard.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
// El tema oscuro va al final a proposito: sin !important necesita ir despues del
// tema de PrimeReact y de las utilidades para ganar en igualdad de especificidad.
import "./styles/darkMode.css";

// Las demas paginas se cargan bajo demanda: el bundle inicial solo trae el inicio.
const Clientes = lazy(() => import("./pages/Clientes"));
const Contactos = lazy(() => import("./pages/Contactos"));
const Productos = lazy(() => import("./pages/Productos"));
const Contactar = lazy(() => import("./pages/Contactar"));
const Weather = lazy(() => import("./pages/Weather"));
const AsociarClienteContacto = lazy(() => import("./pages/AsociarClienteContacto"));
const SerialReportes = lazy(() => import("./pages/protected/SerialReportes"));
const WorkTimeCalculator = lazy(() => import("./pages/tools/WorkTimeCalculator"));
const RegistroSolicitudesPage = lazy(() => import("./pages/RegistroSolicitudesPage"));
const BatteryStatus = lazy(() => import("./pages/tools/BatteryStatus"));
const VideosPage = lazy(() => import("./pages/videos/VideosPage"));
const AudiosYouTubePage = lazy(() => import("./pages/audios-youtube/AudiosYouTubePage"));
const SalesDashboard = lazy(() => import("./pages/SalesDashboard"));
const TomaTensionDashboard = lazy(() => import("./pages/TomaTensionDashboard"));
const Login = lazy(() => import("./pages/protected/Login"));
const AutorizacionPage = lazy(() => import("./pages/protected/AutorizacionPage"));
const PurchaseBridge = lazy(() => import("./pages/protected/PurchaseBridge"));
const ErpClave = lazy(() => import("./pages/protected/ErpClave"));
const ZamAirDashboard = lazy(() => import("./components/ZamAirDashboard"));

// Función para obtener la fecha de expiración del token JWT
const getTokenExpiration = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decodifica el payload
    return payload.exp ? payload.exp * 1000 : null; // Convierte a milisegundos
  } catch (error) {
    return null;
  }
};

function App() {
  const toastRef = useRef(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedToken = sessionStorage.getItem("jwtToken");
    return !!storedToken;
  });

  const [jwtToken, setJwtToken] = useState(
    () => sessionStorage.getItem("jwtToken") || "",
  );

  useEffect(() => {
    const expirationTime = getTokenExpiration(jwtToken);
    if (!expirationTime) return;

    const currentTime = Date.now();
    const timeUntilLogout = expirationTime - currentTime;

    if (timeUntilLogout > 0) {
      const logoutTimer = setTimeout(() => handleLogout(), timeUntilLogout);
      return () => clearTimeout(logoutTimer); // Limpia el timeout si el componente se desmonta
    } else {
      handleLogout();
    }
  }, [jwtToken]);

  const handleAuthenticate = (token) => {
    setIsAuthenticated(true);
    setJwtToken(token);
    sessionStorage.setItem("jwtToken", token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setJwtToken("");
    sessionStorage.removeItem("jwtToken");
    toastRef.current?.show({
      severity: "warn",
      summary: "Sesión expirada",
      detail: "Por favor, inicia sesión nuevamente.",
      life: 3500,
    });
  };

  return (
    <DarkModeProvider>
      <Router>
        <div className="App">
          <Toast ref={toastRef} />
          <Navbar onLogout={handleLogout} />
          <main className="content">
            <Suspense
              fallback={
                <div className="app-cargando" role="status" aria-live="polite">
                  <i className="pi pi-spin pi-spinner" aria-hidden="true" />
                  <span>Cargando…</span>
                </div>
              }
            >
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/contactos" element={<Contactos />} />
              <Route path="/contactar" element={<Contactar />} />
              <Route path="/weather" element={<Weather />} />
              <Route
                path="/AsociarClienteContacto"
                element={<AsociarClienteContacto />}
              />
              <Route
                path="/WorkTimeCalculator"
                element={<WorkTimeCalculator />}
              />
              <Route
                path="/RegistroSolicitudesPage"
                element={<RegistroSolicitudesPage />}
              />
              <Route path="/BatteryStatus" element={<BatteryStatus />} />
              <Route path="/VideosPage" element={<VideosPage />} />
              <Route path="/audios-youtube" element={<AudiosYouTubePage />} />
              <Route path="/SalesDashboard" element={<SalesDashboard />} />
              <Route
                path="/toma-tension-dashboard"
                element={<TomaTensionDashboard />}
              />
              {/* Ruta de autenticación */}
              <Route
                path="/login"
                element={<Login onLogin={handleAuthenticate} />}
              />

              {/* Rutas protegidas */}
              <Route
                path="/SerialReportes"
                element={
                  <ProtectedRoute
                    isAuthenticated={isAuthenticated}
                    jwtToken={jwtToken}
                  >
                    <SerialReportes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/purchase-bridge"
                element={
                  <ProtectedRoute
                    isAuthenticated={isAuthenticated}
                    jwtToken={jwtToken}
                  >
                    <PurchaseBridge />
                  </ProtectedRoute>
                }
              />
              <Route path="/AutorizacionPage" element={<AutorizacionPage />} />
              <Route
                path="/ErpClave"
                element={
                  <ProtectedRoute
                    isAuthenticated={isAuthenticated}
                    jwtToken={jwtToken}
                  >
                    <ErpClave />
                  </ProtectedRoute>
                }
              />
              <Route path="/zam-air" element={<ZamAirDashboard />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;
