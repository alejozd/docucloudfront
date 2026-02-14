// Home.js
import React, { useState, useEffect } from "react";
import axios from "axios"; //
import { Card } from "primereact/card";
import Config from "../components/features/Config";

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

const Home = () => {
  const [phrase, setPhrase] = useState("");
  const [author, setAuthor] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect(() => {
  //   axios
  //     // .get("/api/phrase")
  //     .get("https://frasedeldia.azurewebsites.net/api/phrase", {
  //       headers: { "Access-Control-Allow-Origin": "*" },
  //     })
  //     .then((response) => {
  //       console.log("response.data", response.data);
  //       setPhrase(response.data.phrase);
  //       setAuthor(response.data.author);
  //       setLoading(false);
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching the phrase of the day", error);
  //       setError(error.message);
  //       setLoading(false);
  //     });
  // }, []);

  useEffect(() => {
    const fetchPhrase = async () => {
      try {
        setError(null);
        const response = await axios.get(`${Config.apiUrl}/api/proxy-phrase`);
        const normalizedPhrase = normalizePhrasePayload(response.data);

        if (!normalizedPhrase?.phrase) {
          throw new Error("La respuesta de frase no tiene el formato esperado.");
        }

        setPhrase(normalizedPhrase.phrase);
        setAuthor(normalizedPhrase.author || "Autor desconocido");
        setSource(normalizedPhrase.source || "");
      } catch (error) {
        console.error("Error fetching the phrase of the day", error);
        setError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error.message
        );
      } finally {
        setLoading(false);
      }
    };

    // const fetchPhrase = async () => {
    //   try {
    //     setPhrase("Esta es una prueba...");
    //     setAuthor("Prueba");
    //   } catch (error) {
    //     console.error("Error fetching the phrase of the day", error);
    //     setError(error.message);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    fetchPhrase();
  }, []);

  return (
    <div>
      <div>
        <h1>Bienvenido a Docucloud, una aplicación hecha por Alejo.</h1>
        <p>¡Aquí realizo pruebas de diferentes proyectos!...</p>
      </div>
      <div className="card flex justify-content-center">
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <Card
            title="Frase del día"
            subTitle={"Autor: " + author}
            key={author}
          >
            <p style={{ fontSize: "1.5em" }}>{phrase}</p>
            {source && <p>Fuente: {source}</p>}
            {error && <p>{error}</p>}
          </Card>
        )}
      </div>
    </div>
  );
};

export default Home;
