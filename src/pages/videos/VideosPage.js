// src/pages/VideosPage.js
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { Chip } from "primereact/chip"; // Para los chips de categoría
import { ScrollPanel } from "primereact/scrollpanel"; // Para scroll horizontal si hay muchas categorías
import { DataView, DataViewLayoutOptions } from "primereact/dataview"; // Para mostrar los videos de forma flexible
import { ProgressSpinner } from "primereact/progressspinner";
import { Dropdown } from "primereact/dropdown"; // Opcional: si prefieres un dropdown para seleccionar categoría
import VideoPlayer from "../../components/video/VideoPlayer";
import Config from "./../../components/features/Config";
import "../../styles/VideosPage.css"; // Estilos para esta página

const VideosPage = () => {
  const [groupedVideos, setGroupedVideos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); // Nuevo estado para la categoría seleccionada
  const [layout, setLayout] = useState("grid"); // Estado para el layout del DataView (grid/list)
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get(`${Config.apiUrl}/api/video/lista`);
        const videosData = response.data;
        const newGroupedVideos = videosData.reduce((acc, video) => {
          const folderName = video.carpeta || "Sin Categoría";
          if (!acc[folderName]) {
            acc[folderName] = [];
          }
          acc[folderName].push(video);
          return acc;
        }, {});
        setGroupedVideos(newGroupedVideos);

        // Establecer la primera categoría como seleccionada por defecto
        const firstCategory = Object.keys(newGroupedVideos)[0];
        if (firstCategory) {
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
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <ProgressSpinner strokeWidth="4" animationDuration=".8s" />
        <p>Cargando videos...</p>
      </div>
    );
  }

  if (error) return <div className="error-message">{error}</div>;

  const folderNames = Object.keys(groupedVideos);

  // Plantilla para cada video en el DataView
  const itemTemplate = (video) => {
    const videoUrl = `${Config.apiUrl}${video.url}`;
    const isVideoActive = activeVideoUrl === videoUrl;

    const handlePlayClick = () => {
      setActiveVideoUrl(videoUrl);
    };

    return (
      // Usamos Card o un div simple, dependiendo de tu última prueba
      <Card key={video.url} className="video-item-card-content">
        {/* Contenido del video/placeholder */}
        {isVideoActive ? (
          // 1. Reproductor real (Asumimos que renderiza su propia metadata)
          <VideoPlayer
            title={video.titulo}
            artist={video.artista}
            year={video.año}
            genre={video.genero}
            duration={video.duracion_segundos}
            src={videoUrl}
          />
        ) : (
          // 2. Placeholder con botón de reproducir
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
        )}

        {/* [CLAVE: SÓLO SE MUESTRA SI EL VIDEO ESTÁ INACTIVO] */}
        {/* Si el VideoPlayer ya muestra los datos, esto previene la duplicación al estar activo. */}
        {!isVideoActive && (
          <div className="p-mt-2 p-px-3 p-pb-3">
            <p>
              <strong>{video.titulo}</strong>
            </p>
            <p>
              {video.artista} - {video.año}
            </p>
          </div>
        )}
      </Card>
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-content-end align-items-center">
        <DataViewLayoutOptions
          layout={layout}
          onChange={(e) => setLayout(e.value)}
        />
      </div>
    );
  };

  const header = renderHeader();

  return (
    <div className="videos-container">
      {folderNames.length === 0 ? (
        <p className="no-videos-message">
          No hay videos disponibles en este momento.
        </p>
      ) : (
        <>
          {/* Sección para seleccionar la categoría */}
          <div className="category-selection-container">
            <h2>Explorar Categorías</h2>
            {/* Opción 1: Chips interactivos (más moderno para pocas categorías) */}
            <ScrollPanel className="categories-scroll-panel">
              {" "}
              {/* Para desplazamiento horizontal si hay muchas */}
              <div className="chips-container">
                {folderNames.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    className={`mr-2 my-2 ${
                      selectedCategory === name ? "p-chip-selected" : ""
                    }`}
                    onClick={() => setSelectedCategory(name)}
                  />
                ))}
              </div>
            </ScrollPanel>

            {/* Opción 2: Dropdown (útil para muchas categorías) */}
            {/*
                        <Dropdown
                            value={selectedCategory}
                            options={folderNames}
                            onChange={(e) => setSelectedCategory(e.value)}
                            placeholder="Selecciona una categoría"
                            className="w-full md:w-14rem"
                        />
                        */}
          </div>

          {/* Mostrar los videos de la categoría seleccionada */}
          {selectedCategory && groupedVideos[selectedCategory] && (
            <Card
              title={selectedCategory}
              className="videos-category-card mt-4"
            >
              {/* Puedes añadir un paginator si una categoría tiene muchísimos videos */}
              <DataView
                value={groupedVideos[selectedCategory]}
                layout={layout}
                itemTemplate={itemTemplate}
                paginator={false} // O true si quieres paginación
                rows={10} // Número de items por página si paginator es true
                header={header} // Header para cambiar layout (grid/list)
                emptyMessage="No hay videos en esta categoría."
              />
            </Card>
          )}

          {/* Opcional: Si quieres mostrar todas las categorías como antes, pero con DataView */}
          {/*
                    {folderNames.map((folderName) => (
                        <Card title={folderName} className="videos-list-card" key={folderName}>
                            <DataView
                                value={groupedVideos[folderName]}
                                layout={layout} // Puedes hacer el layout configurable globalmente o por Card
                                itemTemplate={itemTemplate}
                                paginator={false}
                                rows={10}
                                header={header}
                                emptyMessage={`No hay videos en la categoría ${folderName}.`}
                            />
                        </Card>
                    ))}
                    */}
        </>
      )}
    </div>
  );
};

export default VideosPage;
