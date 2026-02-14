// Home.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import Config from "../components/features/Config";
import OpenWeatherMapComponent from "./OpenWeatherMapComponent";
import "../styles/Home.css";

const normalizePhrasePayload = (payload) => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return payload[0] || null;
  }

  if (payload?.data) {
    if (Array.isArray(payload.data)) return payload.data[0] || null;
    if (typeof payload.data === "object") return payload.data;
  }

  if (typeof payload === "object") return payload;

  return null;
};

const translateToSpanish = async (text) => {
  if (!text) return "";

  const response = await axios.get(
    "https://translate.googleapis.com/translate_a/single",
    {
      params: {
        client: "gtx",
        sl: "en",
        tl: "es",
        dt: "t",
        q: text,
      },
    }
  );

  const translatedChunks = response?.data?.[0];
  if (!Array.isArray(translatedChunks)) return text;

  const translated = translatedChunks
    .map((chunk) => (Array.isArray(chunk) ? chunk[0] : ""))
    .join("")
    .trim();

  return translated || text;
};

const Home = () => {
  const [phrase, setPhrase] = useState("");
  const [author, setAuthor] = useState("");
  const [source, setSource] = useState("");
  const [originalPhrase, setOriginalPhrase] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPhrase = async () => {
      try {
        setError(null);
        const response = await axios.get(`${Config.apiUrl}/api/proxy-phrase`);
        const normalizedPhrase = normalizePhrasePayload(response.data);

        if (!normalizedPhrase?.phrase) {
          throw new Error("La respuesta de frase no tiene el formato esperado.");
        }

        setOriginalPhrase(normalizedPhrase.phrase);
        setAuthor(normalizedPhrase.author || "Autor desconocido");
        setSource(normalizedPhrase.source || "");

        try {
          const translated = await translateToSpanish(normalizedPhrase.phrase);
          setPhrase(translated);
        } catch (translationError) {
          console.warn(
            "No se pudo traducir la frase. Se mostrará el texto original.",
            translationError
          );
          setPhrase(normalizedPhrase.phrase);
        }
      } catch (requestError) {
        console.error("Error fetching the phrase of the day", requestError);
        setError(
          requestError?.response?.data?.message ||
            requestError?.response?.data?.error ||
            requestError.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPhrase();
  }, []);

  return (
    <div className="home-page">
      <section className="home-hero">
        <h1>Bienvenido a Docucloud</h1>
        <p>
          Panel principal con resumen diario: frase inspiracional traducida al
          español y estado del clima en tiempo real.
        </p>
      </section>

      <div className="home-grid">
        <Card
          className="home-card"
          title="Frase del día"
          subTitle={`Autor: ${author || "-"}`}
        >
          {loading ? (
            <ProgressSpinner style={{ width: "45px", height: "45px" }} />
          ) : (
            <>
              <p className="home-phrase">{phrase || "Sin frase disponible"}</p>
              {originalPhrase && originalPhrase !== phrase && (
                <p className="home-meta">
                  <strong>Original:</strong> {originalPhrase}
                </p>
              )}
              {source && (
                <p className="home-meta">
                  <strong>Fuente:</strong> {source}
                </p>
              )}
              {error && <p className="home-meta">{error}</p>}
            </>
          )}
        </Card>

        <div className="home-card">
          <OpenWeatherMapComponent city="Bogotá" compact />
        </div>
      </div>
    </div>
  );
};

export default Home;
