import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Panel } from "primereact/panel";

const OpenWeatherMapComponent = ({ city }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = "c133f55ded28c5ca5b60d1b8fa22b586";

  const fetchCityCoordinates = useCallback(
    (city) => {
      // const geoSearchUrl = `/geo/direct?q=${city}&appid=${apiKey}`;
      const geoSearchUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${apiKey}`;

      setLoading(true);
      setError(null);

      axios
        .get(geoSearchUrl)
        .then((response) => {
          if (response.data && response.data.length > 0) {
            const { lat, lon } = response.data[0];
            console.log("lat", lat, "lon", lon);
            fetchWeather(lat, lon);
          } else {
            setError("Ciudad no encontrada");
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error fetching city coordinates", error);
          if (error.response) {
            setError(error.response.data.message);
          } else {
            setError("Error al obtener coordenadas de la ciudad");
          }
          setLoading(false);
        });
    },
    [apiKey]
  );

  useEffect(() => {
    console.log("city", city);
    if (city) {
      fetchCityCoordinates(city);
    }
  }, [city, fetchCityCoordinates]);

  const fetchWeather = (lat, lon) => {
    // const weatherUrl = `/data/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=es`;
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=es`;

    axios
      .get(weatherUrl)
      .then((response) => {
        console.log("weatherUrl", weatherUrl);
        setWeatherData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching weather data", error);
        setError("Error al obtener datos del clima");
        console.log("weatherUrl", weatherUrl);
        setLoading(false);
      });
  };

  return (
    <Card
      title="Pronóstico del Tiempo con OpenWeatherMap"
      style={{ width: "80vw", maxWidth: "800px", textAlign: "center" }}
    >
      {loading && (
        <div className="p-d-flex p-jc-center p-ai-center p-mt-4">
          <ProgressSpinner />
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {weatherData && (
        <div>
          <h3 style={{ textAlign: "center" }}>{weatherData.name}</h3>
          <div
            className="p-grid p-dir-col p-md-dir-row p-mt-4"
            style={{ textAlign: "left" }}
          >
            <div className="p-col-12 p-md-6">
              <Panel header="Información Principal">
                <div className="p-d-flex p-ai-center">
                  <img
                    src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`}
                    alt={weatherData.weather[0].description}
                    style={{ marginRight: "1em" }}
                  />
                  <div>
                    <p>
                      <strong>Condición:</strong>{" "}
                      {weatherData.weather[0].description}
                    </p>
                    <p>
                      <strong>Temperatura:</strong>{" "}
                      {(weatherData.main.temp - 273.15).toFixed(2)}°C
                    </p>
                    <p>
                      <strong>Sensación Térmica:</strong>{" "}
                      {(weatherData.main.feels_like - 273.15).toFixed(2)}°C
                    </p>
                    <p>
                      <strong>Humedad:</strong> {weatherData.main.humidity}%
                    </p>
                    <p>
                      <strong>Presión:</strong> {weatherData.main.pressure} hPa
                    </p>
                  </div>
                </div>
              </Panel>
            </div>
            <div className="p-col-12 p-md-6">
              <Panel header="Detalles Adicionales">
                <div>
                  <p>
                    <strong>Velocidad del Viento:</strong>{" "}
                    {weatherData.wind.speed} m/s
                  </p>
                  <p>
                    <strong>Dirección del Viento:</strong>{" "}
                    {weatherData.wind.deg}°
                  </p>
                  <p>
                    <strong>Visibilidad:</strong>{" "}
                    {weatherData.visibility / 1000} km
                  </p>
                  <p>
                    <strong>Nivel de Nubosidad:</strong>{" "}
                    {weatherData.clouds.all}%
                  </p>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default OpenWeatherMapComponent;
