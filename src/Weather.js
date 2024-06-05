import React, { useState } from "react";
import axios from "axios";

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

  return (
    <div>
      <h2>Pronóstico del Tiempo</h2>
      <button onClick={fetchWeather}>Obtener Pronóstico</button>
      {loading && <p>Cargando...</p>}
      {error && <p>{error}</p>}
      {weatherData && (
        <div>
          <p>
            <strong>Condición:</strong> {weatherData.WeatherText}
          </p>
          <p>
            <strong>Temperatura:</strong> {weatherData.Temperature.Metric.Value}
            °{weatherData.Temperature.Metric.Unit}
          </p>
          <p>
            <strong>Hora de Observación:</strong>{" "}
            {new Date(weatherData.LocalObservationDateTime).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default Weather;
