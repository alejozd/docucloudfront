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
  //     .get("/api/phrase")
  //     // .get("https://frasedeldia.azurewebsites.net/api/phrase")
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
    async function getPhrase() {
      const result = await fetchPhraseOfDay();
      if (result) {
        setPhrase(result);
      }
    }

    getPhrase();
  }, []);

  async function fetchPhraseOfDay() {
    try {
      const response = await fetch("https://proverbia.net/frase-del-dia");
      const html = await response.text();

      // Crear un objeto DOM para manipular el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Obtener el texto de la frase y del autor
      const statement = doc.querySelector(".bsquote p").innerText.trim();
      const author = doc
        .querySelector(".bsquote a")
        .innerText.trim()
        .replace("—", "");

      return { phrase: statement, author: author };
    } catch (error) {
      console.error("Error al obtener la frase del día:", error);
      return null;
    }
  }

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
