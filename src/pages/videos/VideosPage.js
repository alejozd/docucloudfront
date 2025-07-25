// src/pages/VideosPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import VideoPlayer from "../../components/video/VideoPlayer";
import "../../styles/VideosPage.css"; // Estilos para esta página

const VideosPage = () => {
  const [groupedVideos, setGroupedVideos] = useState({}); // Cambiamos 'videos' a 'groupedVideos' como un objeto
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get(
          "https://zetamini.ddns.net/api/video/lista"
        );
        // --- MODIFICACIÓN CLAVE: AGREGAR LÓGICA DE AGRUPACIÓN ---
        const videosData = response.data;
        const newGroupedVideos = videosData.reduce((acc, video) => {
          const folderName = video.carpeta || "Sin Categoría"; // Usa 'carpeta' o un nombre por defecto
          if (!acc[folderName]) {
            acc[folderName] = [];
          }
          acc[folderName].push(video);
          return acc;
        }, {});
        setGroupedVideos(newGroupedVideos);
        // --- FIN DE LA MODIFICACIÓN DE AGRUPACIÓN ---
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

  // Obtener los nombres de las carpetas para poder iterar sobre ellas
  const folderNames = Object.keys(groupedVideos);

  return (
    <div className="videos-container">
      {" "}
      {/* Contenedor principal para todas las categorías */}
      {folderNames.length === 0 ? (
        <p className="no-videos-message">
          No hay videos disponibles en este momento.
        </p>
      ) : (
        // Iterar sobre cada nombre de carpeta para crear una sección
        folderNames.map((folderName) => (
          <Card
            title={folderName}
            className="videos-list-card"
            key={folderName}
          >
            <div className="videos-grid">
              {groupedVideos[folderName].map((video) => (
                <VideoPlayer
                  key={video.url} // Usar una key más estable si la URL es única
                  title={video.titulo}
                  artist={video.artista}
                  year={video.año}
                  genre={video.genero}
                  duration={video.duracion_segundos}
                  src={`https://zetamini.ddns.net${video.url}`}
                />
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default VideosPage;
