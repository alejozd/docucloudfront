import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Panel } from "primereact/panel";

const Forecast = ({ city }) => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = "18b7S9OWWSNUdxY1sl150YeK3L28rz3n";
  const language = "es-co";

  useEffect(() => {
    fetchForecast();
  }, [city]);

  const fetchForecast = () => {
    if (!city) return;

    const forecastUrl = `http://dataservice.accuweather.com/forecasts/v1/daily/1day?apikey=${apiKey}&language=${language}&details=true`;

    setLoading(true);
    setError(null);

    axios
      .get(forecastUrl)
      .then((response) => {
        setForecastData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching forecast data", error);
        setError("Error al obtener pronóstico");
        setLoading(false);
      });
  };

  return (
    <div className="p-mt-4">
      <Card title="Pronóstico del Día Siguiente">
        {loading && (
          <div className="p-d-flex p-jc-center p-ai-center">
            <ProgressSpinner />
          </div>
        )}
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        {forecastData && (
          <div>
            <h3 style={{ textAlign: "center" }}>Pronóstico para mañana</h3>
            <Panel header={forecastData.Headline.Text}>
              <p>Fecha: {forecastData.Headline.EffectiveDate}</p>
              <p>Categoría: {forecastData.Headline.Category}</p>
              <p>
                Enlace:{" "}
                <a
                  href={forecastData.Headline.Link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Más información
                </a>
              </p>
            </Panel>
            <Panel header="Detalles del Pronóstico">
              <p>
                Temperatura Mínima:{" "}
                {forecastData.DailyForecasts[0].Temperature.Minimum.Value}{" "}
                {forecastData.DailyForecasts[0].Temperature.Minimum.Unit}
              </p>
              <p>
                Temperatura Máxima:{" "}
                {forecastData.DailyForecasts[0].Temperature.Maximum.Value}{" "}
                {forecastData.DailyForecasts[0].Temperature.Maximum.Unit}
              </p>
              {/* Agregar más detalles según sea necesario */}
            </Panel>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Forecast;
