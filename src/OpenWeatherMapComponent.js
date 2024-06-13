import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTemperatureHigh,
  faWind,
  faTint,
  faCloud,
  faEye,
  faSun,
  faThermometerQuarter,
  faTemperatureLow,
  faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";

const OpenWeatherMapComponent = ({ city }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = "c133f55ded28c5ca5b60d1b8fa22b586";

  const fetchCityCoordinates = useCallback(
    (city) => {
      const geoUrl = `/api/openweathermap/geo?q=${city}&appid=${apiKey}`;

      setLoading(true);
      setError(null);

      axios
        .get(geoUrl)
        .then((response) => {
          console.log(response.data);
          if (response.data && response.data.length > 0) {
            const { lat, lon } = response.data[0];
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
            setError("Error al obtener las coordenadas de la ciudad");
          }
          setLoading(false);
        });
    },
    [apiKey]
  );

  useEffect(() => {
    if (city) {
      fetchCityCoordinates(city);
    }
  }, [city, fetchCityCoordinates]);

  const fetchWeather = (lat, lon) => {
    const weatherUrl = `/api/openweathermap/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=es&units=metric`;

    axios
      .get(weatherUrl)
      .then((response) => {
        setWeatherData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching weather data", error);
        if (error.response) {
          setError(error.response.data.message);
        } else {
          setError("Error al obtener datos del clima");
        }
        setLoading(false);
      });
  };

  const renderWeatherData = () => {
    if (!weatherData) return null;

    return (
      <Panel
        header={`Clima en ${weatherData.name}, ${weatherData.sys.country}`}
      >
        <div className="p-grid p-align-center p-justify-center">
          <img
            src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`}
            alt={weatherData.weather[0].description}
            style={{ marginRight: "1em" }}
          />
          <div className="p-col-12 p-md-6 p-text-center">
            <p>
              <FontAwesomeIcon icon={faTemperatureHigh} size="1x" />{" "}
              <strong>Temperatura:</strong> {weatherData.main.temp}°C{" "}
            </p>
            <p>
              <FontAwesomeIcon icon={faThermometerQuarter} size="1x" />{" "}
              <strong>Sensación Térmica:</strong> {weatherData.main.feels_like}
              °K{" "}
            </p>
            <p>
              <FontAwesomeIcon icon={faTemperatureLow} size="1x" />{" "}
              <strong>Temperatura Mínima:</strong> {weatherData.main.temp_min}°C{" "}
            </p>
            <p>
              <FontAwesomeIcon icon={faTemperatureHigh} size="1x" />{" "}
              <strong>Temperatura Máxima:</strong> {weatherData.main.temp_max}°C{" "}
            </p>
            <p>
              <FontAwesomeIcon icon={faTachometerAlt} size="1x" />{" "}
              <strong>Presión:</strong> {weatherData.main.pressure} hPa{" "}
            </p>
          </div>
          <Divider />
          <div className="p-col-12 p-md-6 p-text-center">
            <p>
              <FontAwesomeIcon icon={faTint} size="1x" />{" "}
              <strong>Humedad:</strong> {weatherData.main.humidity}%
            </p>
            <p>
              <FontAwesomeIcon icon={faEye} size="1x" />{" "}
              <strong>Visibilidad:</strong> {weatherData.visibility} m
            </p>
            <p>
              <FontAwesomeIcon icon={faWind} size="1x" />{" "}
              <strong>Viento:</strong> {weatherData.wind.speed} m/s
            </p>
            <p>
              <FontAwesomeIcon icon={faCloud} size="1x" />{" "}
              <strong>Condición:</strong> {weatherData.weather[0].description}
            </p>
            <p>
              <FontAwesomeIcon icon={faSun} size="1x" />{" "}
              <strong>Amanecer:</strong>{" "}
              {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}
            </p>
            <p>
              <FontAwesomeIcon icon={faSun} size="1x" />{" "}
              <strong>Atardecer:</strong>{" "}
              {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </Panel>
    );
  };

  return (
    <div className="p-d-flex p-jc-center p-ai-center p-mt-5">
      <Card
        title="Pronóstico del Tiempo - OpenWeatherMap"
        style={{ width: "80vw", maxWidth: "800px", textAlign: "center" }}
      >
        {loading && (
          <div className="p-d-flex p-jc-center p-ai-center p-mt-4">
            <ProgressSpinner />
          </div>
        )}
        {error && <Message severity="error" text={error} />}
        {renderWeatherData()}
      </Card>
    </div>
  );
};

export default OpenWeatherMapComponent;
