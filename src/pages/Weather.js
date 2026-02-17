import React, { useState } from "react";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import OpenWeatherMapComponent from "./OpenWeatherMapComponent";
import "../styles/Weather.css";

const quickCities = ["Bogotá", "Medellín", "Cali", "Madrid", "Miami"];

const Weather = () => {
  const [city, setCity] = useState("");
  const [submittedCity, setSubmittedCity] = useState("");
  const [formError, setFormError] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();

    const normalizedCity = city.trim();

    if (!normalizedCity) {
      setFormError("Ingresa una ciudad válida para buscar el clima.");
      return;
    }

    setFormError("");
    setSubmittedCity(normalizedCity);
  };

  return (
    <div className="weather-page">
      <Card className="weather-shell">
        <div className="weather-header">
          <h2>Consulta del clima</h2>
          <p>
            Escribe una ciudad y obtén la información meteorológica más
            reciente con OpenWeatherMap.
          </p>
        </div>

        <form className="weather-form" onSubmit={handleSearch}>
          <div className="weather-input-group">
            <InputText
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Ej: Bogotá"
            />
            <Button label="Buscar" icon="pi pi-search" type="submit" />
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
              />
            ))}
          </div>

          {formError && <Message severity="warn" text={formError} />}
        </form>

        <Divider />

        <div className="weather-results">
          <OpenWeatherMapComponent city={submittedCity} key={submittedCity} />
        </div>
      </Card>
    </div>
  );
};

export default Weather;
