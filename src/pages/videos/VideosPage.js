// src/pages/VideosPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import VideoPlayer from "../../components/video/VideoPlayer";
import "../../styles/VideosPage.css"; // Estilos para esta página

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Asegúrate de que esta URL coincida con tu dominio y puerto donde corre el backend
        const response = await axios.get(
          "https://zetamini.ddns.net/api/video/lista"
        );
        setVideos(response.data);
      } catch (err) {
        console.error("Error al cargar videos:", err);
        setError(
          "No se pudieron cargar los videos. Por favor, intente de nuevo más tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  if (loading) return <div className="loading-message">Cargando videos...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="videos-container">
      <Card title="Meditaciones Guiadas" className="videos-list-card">
        {videos.length === 0 ? (
          <p className="no-videos-message">
            No hay videos de meditación disponibles en este momento.
          </p>
        ) : (
          <div className="videos-grid">
            {videos.map((video, index) => (
              <VideoPlayer
                key={video.url} // Usar una key más estable si la URL es única
                title={video.titulo}
                artist={video.artista} // Pasamos el artista
                year={video.año} // Pasamos el año
                genre={video.genero} // Pasamos el género
                duration={video.duracion_segundos} // Pasamos la duración
                // Construimos la URL completa para el video
                src={`https://zetamini.ddns.net${video.url}`}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default VideosPage;
