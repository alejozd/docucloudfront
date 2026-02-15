// src/pages/VideosPage.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { ScrollPanel } from "primereact/scrollpanel";
import { DataView, DataViewLayoutOptions } from "primereact/dataview";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import VideoPlayer from "../../components/video/VideoPlayer";
import Config from "./../../components/features/Config";
import "primeicons/primeicons.css";
import "../../styles/VideosPage.css";

const VideoThumbnail = ({ src, title, onClick }) => {
  const [hasFrame, setHasFrame] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoadedData = (event) => {
    const video = event.currentTarget;
    if (hasFrame || hasError) return;

    const targetTime = Math.min(1, Math.max(0, (video.duration || 0) / 4));
    if (targetTime > 0) {
      video.currentTime = targetTime;
    } else {
      setHasFrame(true);
    }
  };

  const handleSeeked = (event) => {
    const video = event.currentTarget;
    video.pause();
    setHasFrame(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <button className="video-thumb-button" type="button" onClick={onClick}>
      {!hasError ? (
        <video
          className="video-thumb-preview"
          src={src}
          muted
          preload="metadata"
          playsInline
          onLoadedData={handleLoadedData}
          onSeeked={handleSeeked}
          onError={handleError}
        />
      ) : null}

      <div className="video-thumb-overlay">
        <span className="video-thumb-play">
          <i className="pi pi-play" aria-label={`Reproducir ${title}`} />
        </span>
        <span className="video-thumb-label">Reproducir</span>
      </div>

      {!hasFrame && !hasError ? <div className="video-thumb-skeleton" /> : null}
      {hasError ? <div className="video-thumb-fallback">Vista previa no disponible</div> : null}
    </button>
  );
};

const VideosPage = () => {
  const [groupedVideos, setGroupedVideos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [layout, setLayout] = useState("grid");
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/video/lista`);
      const videosData = response.data || [];

      const newGroupedVideos = videosData.reduce((acc, video) => {
        const folderName = video.carpeta || "Sin Categoría";
        if (!acc[folderName]) acc[folderName] = [];
        acc[folderName].push(video);
        return acc;
      }, {});

      setGroupedVideos(newGroupedVideos);
      const firstCategory = Object.keys(newGroupedVideos)[0];
      if (firstCategory && !selectedCategory) {
        setSelectedCategory(firstCategory);
      }
    } catch (err) {
      console.error("Error al cargar videos:", err);
      setError("No se pudieron cargar los videos. Por favor, intente de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const folderNames = Object.keys(groupedVideos);

  const selectedVideos = useMemo(() => {
    if (!selectedCategory) return [];
    const rawVideos = groupedVideos[selectedCategory] || [];
    const search = globalFilter.trim().toLowerCase();
    if (!search) return rawVideos;

    return rawVideos.filter((video) => {
      const title = video.titulo?.toLowerCase() || "";
      const artist = video.artista?.toLowerCase() || "";
      const year = String(video.año || "").toLowerCase();
      const genre = video.genero?.toLowerCase() || "";
      return (
        title.includes(search) ||
        artist.includes(search) ||
        year.includes(search) ||
        genre.includes(search)
      );
    });
  }, [groupedVideos, selectedCategory, globalFilter]);

  const itemTemplate = (video) => {
    const videoUrl = `${Config.apiUrl}${video.url}`;
    const isVideoActive = activeVideoUrl === videoUrl;

    return (
      <Card
        key={video.url}
        className={`video-item-card-content ${isVideoActive ? "video-item-active" : ""}`}
      >
        {isVideoActive ? (
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
          <>
            <VideoThumbnail
              src={videoUrl}
              title={video.titulo}
              onClick={() => setActiveVideoUrl(videoUrl)}
            />

            <div className="video-meta-modern">
              <h4>{video.titulo || "Sin título"}</h4>
              <p>
                {video.artista || "Artista desconocido"}
                {video.año ? ` · ${video.año}` : ""}
              </p>
              {video.genero ? <small>{video.genero}</small> : null}
            </div>
          </>
        )}
      </Card>
    );
  };

  const header = (
    <div className="videos-toolbar">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar por título, artista, año o género"
        />
      </IconField>
      <DataViewLayoutOptions layout={layout} onChange={(e) => setLayout(e.value)} />
    </div>
  );

  return (
    <div className="videos-container">
      <h1>Catálogo de Videos</h1>

      {error && <div className="p-error p-text-center">{error}</div>}

      {loading ? (
        <div className="loader-container">
          <ProgressSpinner strokeWidth="4" animationDuration=".5s" />
          <p className="p-mt-3">Cargando videos...</p>
        </div>
      ) : (
        <>
          <div className="category-selection-container p-mb-4">
            <ScrollPanel style={{ width: "100%", height: "auto", whiteSpace: "nowrap" }}>
              <div className="chips-container p-d-flex p-ai-center">
                {folderNames.map((folderName) => (
                  <Chip
                    key={folderName}
                    label={folderName}
                    className={`p-mr-2 p-mb-2 ${
                      selectedCategory === folderName ? "active-category-chip" : "p-chip-sm"
                    }`}
                    onClick={() => {
                      setSelectedCategory(folderName);
                      setActiveVideoUrl(null);
                    }}
                    style={{ cursor: "pointer", padding: "0.8rem 1rem" }}
                  />
                ))}
              </div>
            </ScrollPanel>
          </div>

          {selectedCategory && (
            <Card title={selectedCategory} className="videos-category-card">
              <DataView
                value={selectedVideos}
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
