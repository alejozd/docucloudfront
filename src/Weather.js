import React, { useState } from "react";
import AccuWeatherComponent from "./AccuWeatherComponent";
import OpenWeatherMapComponent from "./OpenWeatherMapComponent";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
// import "./Weather.css";

const Weather = () => {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [city, setCity] = useState("");
  const [submittedCity, setSubmittedCity] = useState("");

  const providers = [
    { label: "AccuWeather", value: "accuweather" },
    { label: "OpenWeatherMap", value: "openweathermap" },
  ];

  const handleSearch = () => {
    setSubmittedCity(city);
  };

  return (
    <div>
      <Card
        className="p-shadow-5"
        style={{ maxWidth: "800px", margin: "0 auto" }}
      >
        <h2
          className="p-text-center"
          style={{
            color: "#007ad9",
            marginBottom: "1rem",
            marginTop: "-2rem",
          }}
        >
          Consulta del Clima
        </h2>
        <div className="p-d-flex p-jc-center p-mb-3">
          <Dropdown
            value={selectedProvider}
            options={providers}
            onChange={(e) => setSelectedProvider(e.value)}
            placeholder="Selecciona un servicio meteorológico"
            style={{ width: "320px", marginBottom: "1rem" }}
          />
        </div>
        <div className="p-inputgroup p-mb-5 p-d-flex p-jc-center">
          <InputText
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ingrese el nombre de la ciudad"
            style={{ marginRight: "0.5em", flex: 1 }}
          />
          <Button label="Buscar" icon="pi pi-search" onClick={handleSearch} />
        </div>
        <Divider />
        {selectedProvider === "accuweather" && (
          <AccuWeatherComponent city={submittedCity} />
        )}
        {selectedProvider === "openweathermap" && (
          <OpenWeatherMapComponent city={submittedCity} />
        )}
      </Card>
    </div>
  );
};

export default Weather;
