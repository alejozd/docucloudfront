// Home.js
import React, { useState, useEffect } from "react";
import axios from "axios"; //
import { Card } from "primereact/card";

const Home = () => {
  const [phrase, setPhrase] = useState("");
  const [author, setAuthor] = useState("");
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
        const response = await axios.get("/api/proxy-phrase");
        setPhrase(response.data.phrase);
        setAuthor(response.data.author);
      } catch (error) {
        console.error("Error fetching the phrase of the day", error);
        setError(error.message);
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
        <h1>Bienvenido a Docucloud</h1>
        <p>¡Aquí puedes hacer documentos y más!...</p>
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
            <p>{error}</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Home;
