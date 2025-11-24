// src/pages/VideosPage.js
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { ScrollPanel } from "primereact/scrollpanel";
import { DataView, DataViewLayoutOptions } from "primereact/dataview";
import { ProgressSpinner } from "primereact/progressspinner";
import VideoPlayer from "../../components/video/VideoPlayer";
import Config from "./../../components/features/Config";
import "primeicons/primeicons.css"; // Asegúrate de tener los iconos
import "../../styles/VideosPage.css"; // Estilos para esta página

const VideosPage = () => {
  const [groupedVideos, setGroupedVideos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [layout, setLayout] = useState("grid");
  const [activeVideoUrl, setActiveVideoUrl] = useState(null); // URL del video activo (para lazy loading)

  // [FIX 1: Salto de pestaña] Usamos `!selectedCategory` para que solo se inicialice la primera vez.
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get(`${Config.apiUrl}/api/video/lista`);
        const videosData = response.data;

        // Agrupación de videos por carpeta
        const newGroupedVideos = videosData.reduce((acc, video) => {
          const folderName = video.carpeta || "Sin Categoría";
          if (!acc[folderName]) {
            acc[folderName] = [];
          }
          acc[folderName].push(video);
          return acc;
        }, {});
        setGroupedVideos(newGroupedVideos);

        // Establecer la primera categoría como seleccionada por defecto SOLO si no hay ninguna
        const firstCategory = Object.keys(newGroupedVideos)[0];

        if (firstCategory && !selectedCategory) {
          setSelectedCategory(firstCategory);
        }
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
    // selectedCategory se añade a dependencias para asegurar que la lógica de inicialización no corra dos veces
  }, [selectedCategory]);

  // Función para renderizar cada item del DataView
  const itemTemplate = (video) => {
    const videoUrl = `${Config.apiUrl}${video.url}`;
    const isVideoActive = activeVideoUrl === videoUrl;

    const handlePlayClick = () => {
      // [FIX 2: Lazy Loading] Solo activa el video
      setActiveVideoUrl(videoUrl);
    };

    return (
      <Card
        key={video.url}
        className="video-item-card-content"
        // [FIX 4: Layout] Eliminamos el padding de la Card cuando el video está activo para que ocupe todo
        style={isVideoActive ? { padding: "0px" } : {}}
      >
        {isVideoActive ? (
          // 1. Reproductor real (Ocupa todo el espacio)
          <VideoPlayer
            title={video.titulo}
            artist={video.artista}
            year={video.año}
            genre={video.genero}
            duration={video.duracion_segundos}
            src={videoUrl}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          // 2. Placeholder + Metadata (cuando está inactivo)
          <>
            <div
              className="video-placeholder"
              onClick={handlePlayClick}
              style={{
                backgroundColor: "#333",
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <i
                className="pi pi-play"
                style={{ fontSize: "3em", color: "white" }}
                aria-label={`Reproducir ${video.titulo}`}
              />
            </div>

            {/* [FIX 3: Duplicidad] La metadata solo se muestra si NO está activo, 
                        asumiendo que VideoPlayer ya la muestra cuando está activo. */}
            <div className="p-mt-2 p-px-3 p-pb-3">
              <p>
                <strong>{video.titulo}</strong>
              </p>
              <p>
                {video.artista} - {video.año}
              </p>
            </div>
          </>
        )}
      </Card>
    );
  };

  // Nombres de las categorías para los chips
  const folderNames = Object.keys(groupedVideos);

  const header = (
    <div className="p-d-flex p-jc-end">
      <DataViewLayoutOptions
        layout={layout}
        onChange={(e) => setLayout(e.value)}
      />
    </div>
  );

  return (
    <div className="videos-container">
      <h1>Catálogo de Videos</h1>

      {error && <div className="p-error p-text-center">{error}</div>}

      {loading ? (
        // Muestra el spinner mientras carga la lista (que ahora será RÁPIDO)
        <div className="loader-container">
          <ProgressSpinner strokeWidth="4" animationDuration=".5s" />
          <p className="p-mt-3">Cargando videos...</p>
        </div>
      ) : (
        <>
          {/* Contenedor de Chips para seleccionar categoría */}
          <div className="category-selection-container p-mb-4">
            <ScrollPanel
              style={{ width: "100%", height: "auto", whiteSpace: "nowrap" }}
            >
              <div className="chips-container p-d-flex p-ai-center">
                {folderNames.map((folderName) => (
                  <Chip
                    key={folderName}
                    label={folderName}
                    className={`p-mr-2 p-mb-2 ${
                      selectedCategory === folderName
                        ? "active-category-chip"
                        : "p-chip-sm"
                    }`}
                    onClick={() => {
                      setSelectedCategory(folderName);
                      setActiveVideoUrl(null); // Limpiar el video activo al cambiar de pestaña
                    }}
                    style={{ cursor: "pointer", padding: "0.8rem 1rem" }}
                  />
                ))}
              </div>
            </ScrollPanel>
          </div>

          {/* Muestra el DataView de la categoría seleccionada */}
          {selectedCategory && (
            <Card title={selectedCategory} className="videos-category-card">
              <DataView
                value={groupedVideos[selectedCategory]}
                layout={layout}
                itemTemplate={itemTemplate}
                paginator={false}
                rows={10}
                header={header}
                emptyMessage="No hay videos en esta categoría."
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default VideosPage;
