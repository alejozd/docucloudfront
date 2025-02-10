import "./App.css";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar"; // Importa tu componente Navbark
import Home from "./Home"; // Importa tu componente Home
import Clientes from "./Clientes"; // Importa tu componente Clientes
import Contactos from "./Contactos"; // Importa tu componente Contacto
import Productos from "./Productos"; // Importa tu componente Productos
import Contactar from "./Contactar";
import Weather from "./Weather"; // Importa tu componente Weather
import AsociarClienteContacto from "./AsociarClienteContacto";
import SerialReportes from "./SerialReportes";
import WorkTimeCalculator from "./WorkTimeCalculator";
import RegistroSolicitudesPage from "./RegistroSolicitudesPage";
import BatteryStatus from "./BatteryStatus";
import "primereact/resources/themes/lara-light-blue/theme.css";
// import "primereact/resources/themes/lara-dark-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/primereact.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="content">
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/contactos" element={<Contactos />} />
            <Route path="/contactar" element={<Contactar />} />
            <Route path="/weather" element={<Weather />} />
            <Route
              path="/AsociarClienteContacto"
              element={<AsociarClienteContacto />}
            />
            <Route path="/SerialReportes" element={<SerialReportes />} />
            <Route
              path="/WorkTimeCalculator"
              element={<WorkTimeCalculator />}
            />
            <Route
              path="/RegistroSolicitudesPage"
              element={<RegistroSolicitudesPage />}
            />
            <Route path="/BatteryStatus" element={<BatteryStatus />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
