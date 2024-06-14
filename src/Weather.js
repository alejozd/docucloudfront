import React, { useState } from "react"; //
import AccuWeatherComponent from "./AccuWeatherComponent";
import OpenWeatherMapComponent from "./OpenWeatherMapComponent";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";

const Weather = () => {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [city, setCity] = useState("");
  const [submittedCity, setSubmittedCity] = useState("");

  const providers = [
    { label: "AccuWeather", value: "accuweather" },
    { label: "OpenWeatherMap", value: "openweathermap" },
  ];

  const handleSearch = (event) => {
    event.preventDefault();
    setSubmittedCity(city);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch(event);
    }
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
        <form onSubmit={handleSearch}>
          <div className="p-d-flex p-jc-center p-mb-3">
            <Dropdown
              value={selectedProvider}
              options={providers}
              onChange={(e) => {
                setSelectedProvider(e.value);
                setCity(""); // Limpiar la ciudad al cambiar de proveedor
              }}
              placeholder="Selecciona un servicio meteorológico"
              style={{ width: "320px", marginBottom: "1rem" }}
            />
          </div>
          {selectedProvider && (
            <div className="p-inputgroup p-mb-5 p-d-flex p-jc-center">
              <InputText
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ingrese el nombre de la ciudad"
                style={{ marginRight: "0.5em", flex: 1 }}
                onKeyPress={handleKeyPress}
                disabled={!selectedProvider} // Deshabilitar si no hay proveedor seleccionado
              />
              <Button
                label="Buscar"
                icon="pi pi-search"
                type="submit"
                severity="info"
                disabled={!selectedProvider} // Deshabilitar si no hay proveedor seleccionado
              />
            </div>
          )}
        </form>
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
