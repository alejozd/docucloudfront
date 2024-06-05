import React, { useState } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { ProgressSpinner } from "primereact/progressspinner";

const Weather = () => {
  const [city, setCity] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = "18b7S9OWWSNUdxY1sl150YeK3L28rz3n";

  const fetchCityId = () => {
    const citySearchUrl = `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${city}&language=es-co&details=true`;

    setLoading(true);
    setError(null);

    axios
      .get(citySearchUrl)
      .then((response) => {
        if (response.data && response.data.length > 0) {
          const cityId = response.data[0].Key;
          fetchWeather(cityId);
        } else {
          setError("City not found");
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error fetching city ID", error);
        setError("Error fetching city ID");
        setLoading(false);
      });
  };

  const fetchWeather = (cityId) => {
    const weatherUrl = `http://dataservice.accuweather.com/currentconditions/v1/${cityId}?apikey=${apiKey}&language=es-co&details=true`;

    axios
      .get(weatherUrl)
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
      <Card
        title="Pronóstico del Tiempo"
        style={{ width: "25em", textAlign: "center" }}
      >
        <div className="p-inputgroup p-mb-3">
          <InputText
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ingrese el nombre de la ciudad"
          />
          <Button label="Buscar" icon="pi pi-search" onClick={fetchCityId} />
        </div>
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
              <strong>Temperatura Real:</strong>{" "}
              {weatherData.RealFeelTemperature.Metric.Value}°
              {weatherData.RealFeelTemperature.Metric.Unit} (
              {weatherData.RealFeelTemperature.Metric.Phrase})
            </p>
            <p>
              <strong>Humedad Relativa:</strong> {weatherData.RelativeHumidity}%
            </p>
            <p>
              <strong>Hora de Observación:</strong>{" "}
              {new Date(weatherData.LocalObservationDateTime).toLocaleString()}
            </p>
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
          </div>
        )}
      </Card>
    </div>
  );
};

export default Weather;
