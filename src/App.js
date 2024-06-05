import "./App.css";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar"; // Importa tu componente Navbar
import Home from "./Home"; // Importa tu componente Home
import Clientes from "./Clientes"; // Importa tu componente Clientes
import Contacto from "./Contacto"; // Importa tu componente Contacto
import Productos from "./Productos"; // Importa tu componente Productos
import Weather from "./Weather"; // Importa tu componente Weather
import "primereact/resources/themes/lara-light-blue/theme.css";
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
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/weather" element={<Weather />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
