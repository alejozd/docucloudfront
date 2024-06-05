import React, { useState } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = () => {
    const apiKey = "18b7S9OWWSNUdxY1sl150YeK3L28rz3n";
    const cityId = "107487"; // Reemplaza esto con el ID de la ciudad deseada
    const url = `http://dataservice.accuweather.com/currentconditions/v1/${cityId}?apikey=${apiKey}&language=es-co&details=false`;

    setLoading(true);
    setError(null);

    axios
      .get(url)
      .then((response) => {
        setWeatherData(response.data[0]);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching weather data", error);
        setError("Error fetching weather data");
        setLoading(false);
      });
  };

  const weatherIconUrl = (icon) => {
    return `https://developer.accuweather.com/sites/default/files/${
      icon < 10 ? "0" : ""
    }${icon}-s.png`;
  };

  return (
    <div className="p-d-flex p-jc-center p-ai-center p-mt-5">
      <Card title="Pronóstico del Tiempo" style={{ width: "25em" }}>
        <Button
          label="Obtener Pronóstico"
          icon="pi pi-refresh"
          onClick={fetchWeather}
          className="p-mb-3"
        />
        {loading && (
          <div className="p-d-flex p-jc-center">
            <ProgressSpinner />
          </div>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {weatherData && (
          <div className="p-d-flex p-flex-column p-ai-center">
            <img
              src={weatherIconUrl(weatherData.WeatherIcon)}
              alt={weatherData.WeatherText}
            />
            <p>
              <strong>Condición:</strong> {weatherData.WeatherText}
            </p>
            <p>
              <strong>Temperatura:</strong>{" "}
              {weatherData.Temperature.Metric.Value}°
              {weatherData.Temperature.Metric.Unit}
            </p>
            <p>
              <strong>Hora de Observación:</strong>{" "}
              {new Date(weatherData.LocalObservationDateTime).toLocaleString()}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Weather;
