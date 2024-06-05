import React, { useState } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { ProgressSpinner } from "primereact/progressspinner";
import { Panel } from "primereact/panel";
import Forecast from "./Forecast";

const Weather = () => {
  const [city, setCity] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForecast, setShowForecast] = useState(false);

  const apiKey = "18b7S9OWWSNUdxY1sl150YeK3L28rz3n";

  const fetchCityId = () => {
    const citySearchUrl = `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${city}&language=es-co&details=true`;
    // const citySearchUrl = `/api/locations/v1/cities/search?apikey=${apiKey}&q=${city}&language=es-co&details=true`;
    // const citySearchUrl = `https://cors-anywhere.herokuapp.com/http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${city}&language=es-co&details=true`;

    setLoading(true);
    setError(null);

    axios
      .get(citySearchUrl)
      .then((response) => {
        if (response.data && response.data.length > 0) {
          const cityId = response.data[0].Key;
          console.log("City ID:", cityId);
          fetchWeather(cityId);
        } else {
          setError("Ciudad no encontrada");
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error fetching city ID", error);
        if (error.response) {
          setError(error.response.data.Message);
        } else {
          setError("Error al obtener ID de la ciudad");
        }
        setLoading(false);
      });
  };

  const fetchWeather = (cityId) => {
    const weatherUrl = `http://dataservice.accuweather.com/currentconditions/v1/${cityId}?apikey=${apiKey}&language=es-co&details=true`;
    // const weatherUrl = `api/currentconditions/v1/${cityId}?apikey=${apiKey}&language=es-co&details=true`;

    axios
      .get(weatherUrl)
      .then((response) => {
        setWeatherData(response.data[0]);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching weather data", error);
        setError("Error al obtener datos del clima");
        setLoading(false);
      });
  };

  const weatherIconUrl = (icon) => {
    return `https://developer.accuweather.com/sites/default/files/${
      icon < 10 ? "0" : ""
    }${icon}-s.png`;
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      fetchCityId();
    }
  };

  const toggleForecast = () => {
    setShowForecast(!showForecast);
  };

  return (
    <div className="p-d-flex p-jc-center p-ai-center p-mt-5">
      <Card
        title="Pronóstico del Tiempo"
        style={{ width: "80vw", maxWidth: "800px", textAlign: "center" }}
      >
        <div className="p-inputgroup p-mb-5 p-d-flex p-jc-center">
          <InputText
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ingrese el nombre de la ciudad y presione Enter"
            style={{ marginRight: "0.5em", flex: 1 }}
          />
          <Button label="Buscar" icon="pi pi-search" onClick={fetchCityId} />
        </div>
        {loading && (
          <div className="p-d-flex p-jc-center p-ai-center p-mt-4">
            <ProgressSpinner />
          </div>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {weatherData && (
          <div>
            <h3 style={{ textAlign: "center" }}>{weatherData.LocalizedName}</h3>
            <div
              className="p-grid p-dir-col p-md-dir-row p-mt-4"
              style={{ textAlign: "left" }}
            >
              <div className="p-col-12 p-md-6">
                <Panel header="Información Principal">
                  <div className="p-d-flex p-ai-center">
                    <img
                      src={weatherIconUrl(weatherData.WeatherIcon)}
                      alt={weatherData.WeatherText}
                      style={{ marginRight: "1em" }}
                    />
                    <div>
                      <p>
                        <strong>Condición:</strong> {weatherData.WeatherText}
                      </p>
                      <p>
                        <strong>Temperatura:</strong>{" "}
                        {weatherData.Temperature.Metric.Value}°
                        {weatherData.Temperature.Metric.Unit}
                      </p>
                      <p>
                        <strong>Temperatura Real:</strong>{" "}
                        {weatherData.RealFeelTemperature.Metric.Value}°
                        {weatherData.RealFeelTemperature.Metric.Unit} (
                        {weatherData.RealFeelTemperature.Metric.Phrase})
                      </p>
                      <p>
                        <strong>Hora de Observación:</strong>{" "}
                        {new Date(
                          weatherData.LocalObservationDateTime
                        ).toLocaleString()}
                      </p>
                      <p>
                        <strong>Humedad Relativa:</strong>{" "}
                        {weatherData.RelativeHumidity}%
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
                      {weatherData.Wind.Speed.Metric.Value}{" "}
                      {weatherData.Wind.Speed.Metric.Unit} (
                      {weatherData.Wind.Direction.Localized})
                    </p>
                    <p>
                      <strong>Visibilidad:</strong>{" "}
                      {weatherData.Visibility.Metric.Value}{" "}
                      {weatherData.Visibility.Metric.Unit}
                    </p>
                    <p>
                      <strong>Nivel de Nubosidad:</strong>{" "}
                      {weatherData.CloudCover}%
                    </p>
                    <p>
                      <strong>Índice UV:</strong> {weatherData.UVIndex} (
                      {weatherData.UVIndexText})
                    </p>
                    <p>
                      <strong>Presión:</strong>{" "}
                      {weatherData.Pressure.Metric.Value}{" "}
                      {weatherData.Pressure.Metric.Unit}
                    </p>
                    <p>
                      <strong>Enlace:</strong>{" "}
                      <a
                        href={weatherData.Link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Más información
                      </a>
                    </p>
                  </div>
                </Panel>
              </div>
            </div>
            <Button
              label="Ver Pronóstico del Día Siguiente"
              onClick={toggleForecast}
            />
          </div>
        )}
        {showForecast && <Forecast city={city} />}
      </Card>
    </div>
  );
};

export default Weather;
