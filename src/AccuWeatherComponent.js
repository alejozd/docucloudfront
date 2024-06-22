import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Panel } from "primereact/panel";

const AccuWeatherComponent = ({ city }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [placeData, setPlaceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = "18b7S9OWWSNUdxY1sl150YeK3L28rz3n";

  useEffect(() => {
    const fetchCityId = () => {
      // const citySearchUrl = `/api/locations?apikey=${apiKey}&q=${city}&language=es-co&details=true`;
      const citySearchUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${city}&language=es-co&details=true`;

      //http://dataservice.accuweather.com/locations/v1/cities/search

      setLoading(true);
      setError(null);

      axios
        .get(citySearchUrl)
        .then((response) => {
          if (response.data && response.data.length > 0) {
            const cityId = response.data[0].Key;
            setPlaceData(response.data[0]);
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

    if (city) {
      fetchCityId();
    }
  }, [city]);

  const fetchWeather = (cityId) => {
    // const weatherUrl = `/api/currentconditions/${cityId}?apikey=${apiKey}&language=es-co&details=true`;
    const weatherUrl = `https://dataservice.accuweather.com/currentconditions/v1/${cityId}?apikey=${apiKey}&language=es-co&details=true`;

    //http://dataservice.accuweather.com/forecasts/v1/daily/1day/107487

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

  return (
    <Card
      title="Pronóstico del Tiempo con AccuWeather"
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
          <h3 style={{ textAlign: "center" }}>{weatherData.LocalizedName}</h3>
          <div
            className="p-grid p-dir-col p-md-dir-row p-mt-4"
            style={{ textAlign: "left" }}
          >
            <Panel
              header={`Clima en ${placeData.LocalizedName}, ${placeData.Country.LocalizedName}`}
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
            </Panel>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AccuWeatherComponent;
