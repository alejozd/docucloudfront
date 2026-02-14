import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import "../styles/OpenWeatherMapComponent.css";

const OPEN_WEATHER_API_KEY = "c133f55ded28c5ca5b60d1b8fa22b586";

const formatTime = (unixTime) => {
  if (!unixTime) return "-";
  return new Date(unixTime * 1000).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toKilometers = (meters) => {
  if (!Number.isFinite(meters)) return "-";
  return `${(meters / 1000).toFixed(1)} km`;
};

const OpenWeatherMapComponent = ({ city, compact = false }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async () => {
    if (!city) {
      setWeatherData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const geoResponse = await axios.get(
        "https://api.openweathermap.org/geo/1.0/direct",
        {
          params: {
            q: city,
            limit: 1,
            appid: OPEN_WEATHER_API_KEY,
          },
        }
      );

      if (!geoResponse.data?.length) {
        setWeatherData(null);
        setError("Ciudad no encontrada");
        return;
      }

      const { lat, lon } = geoResponse.data[0];

      const weatherResponse = await axios.get(
        "https://api.openweathermap.org/data/2.5/weather",
        {
          params: {
            lat,
            lon,
            appid: OPEN_WEATHER_API_KEY,
            lang: "es",
            units: "metric",
          },
        }
      );

      setWeatherData(weatherResponse.data);
    } catch (requestError) {
      console.error("Error fetching weather data", requestError);
      setWeatherData(null);
      setError(
        requestError?.response?.data?.message ||
          "Error al obtener datos del clima"
      );
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const weatherContent = () => {
    if (loading) {
      return (
        <div className="open-weather-loading">
          <ProgressSpinner style={{ width: "42px", height: "42px" }} />
        </div>
      );
    }

    if (error) {
      return <Message severity="error" text={error} />;
    }

    if (!weatherData) {
      return (
        <Message severity="warn" text="Ingresa una ciudad para ver el clima." />
      );
    }

    const details = [
      {
        label: "Sensación térmica",
        value: `${Math.round(weatherData.main.feels_like)}°C`,
        icon: "pi pi-compass",
      },
      {
        label: "Humedad",
        value: `${weatherData.main.humidity}%`,
        icon: "pi pi-cloud",
      },
      {
        label: "Viento",
        value: `${weatherData.wind.speed} m/s`,
        icon: "pi pi-send",
      },
      {
        label: "Visibilidad",
        value: toKilometers(weatherData.visibility),
        icon: "pi pi-eye",
      },
      {
        label: "Amanecer",
        value: formatTime(weatherData.sys.sunrise),
        icon: "pi pi-sun",
      },
      {
        label: "Atardecer",
        value: formatTime(weatherData.sys.sunset),
        icon: "pi pi-moon",
      },
    ];

    return (
      <div className="open-weather-panel">
        <div className="open-weather-hero">
          <div>
            <p className="open-weather-city">
              {weatherData.name}, {weatherData.sys.country}
            </p>
            <p className="open-weather-description">
              {weatherData.weather?.[0]?.description || "Sin descripción"}
            </p>
            <p className="open-weather-temp">{Math.round(weatherData.main.temp)}°C</p>
            <p className="open-weather-range">
              Min {Math.round(weatherData.main.temp_min)}° / Max {Math.round(weatherData.main.temp_max)}°
            </p>
          </div>
          <img
            src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
            alt={weatherData.weather[0].description}
            className="open-weather-icon"
          />
        </div>

        <div className="open-weather-stats-grid">
          {details.map((detail) => (
            <div className="open-weather-stat" key={detail.label}>
              <i className={`${detail.icon} open-weather-stat-icon`} aria-hidden="true" />
              <div>
                <p className="open-weather-stat-label">{detail.label}</p>
                <p className="open-weather-stat-value">{detail.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (compact) {
    return <div className="open-weather-wrapper compact">{weatherContent()}</div>;
  }

  return (
    <Card title="Pronóstico del Tiempo - OpenWeatherMap" className="open-weather-wrapper">
      {weatherContent()}
    </Card>
  );
};

export default OpenWeatherMapComponent;
