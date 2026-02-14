import React, { useState } from "react";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import AccuWeatherComponent from "./AccuWeatherComponent";
import OpenWeatherMapComponent from "./OpenWeatherMapComponent";
import "../styles/Weather.css";

const providers = [
  { label: "AccuWeather", value: "accuweather" },
  { label: "OpenWeatherMap", value: "openweathermap" },
];

const quickCities = ["Bogotá", "Medellín", "Cali", "Madrid", "Miami"];

const Weather = () => {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [city, setCity] = useState("");
  const [submittedCity, setSubmittedCity] = useState("");
  const [formError, setFormError] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();

    const normalizedCity = city.trim();

    if (!selectedProvider) {
      setFormError("Selecciona primero un servicio meteorológico.");
      return;
    }

    if (!normalizedCity) {
      setFormError("Ingresa una ciudad válida para buscar el clima.");
      return;
    }

    setFormError("");
    setSubmittedCity(normalizedCity);
  };

  const handleProviderChange = (value) => {
    setSelectedProvider(value);
    setCity("");
    setSubmittedCity("");
    setFormError("");
  };

  return (
    <div className="weather-page">
      <Card className="weather-shell">
        <div className="weather-header">
          <h2>Consulta del clima</h2>
          <p>
            Selecciona un proveedor, escribe una ciudad y obtén la información
            meteorológica más reciente.
          </p>
        </div>

        <form className="weather-form" onSubmit={handleSearch}>
          <Dropdown
            value={selectedProvider}
            options={providers}
            onChange={(event) => handleProviderChange(event.value)}
            placeholder="Selecciona un servicio meteorológico"
          />

          <div className="weather-input-group">
            <InputText
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Ej: Bogotá"
              disabled={!selectedProvider}
            />
            <Button
              label="Buscar"
              icon="pi pi-search"
              type="submit"
              disabled={!selectedProvider}
            />
          </div>

          <div className="weather-quick-cities">
            {quickCities.map((quickCity) => (
              <Button
                key={quickCity}
                type="button"
                label={quickCity}
                size="small"
                outlined
                onClick={() => {
                  setCity(quickCity);
                  setSubmittedCity(quickCity);
                  setFormError("");
                }}
                disabled={!selectedProvider}
              />
            ))}
          </div>

          {formError && <Message severity="warn" text={formError} />}
        </form>

        <Divider />

        <div className="weather-results">
          {selectedProvider === "accuweather" && (
            <AccuWeatherComponent city={submittedCity} key={`${selectedProvider}-${submittedCity}`} />
          )}

          {selectedProvider === "openweathermap" && (
            <OpenWeatherMapComponent city={submittedCity} key={`${selectedProvider}-${submittedCity}`} />
          )}
        </div>
      </Card>
    </div>
  );
};

export default Weather;
