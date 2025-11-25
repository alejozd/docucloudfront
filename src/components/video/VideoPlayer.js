// src/components/VideoPlayer.js
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { Slider } from "primereact/slider";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog"; // Para el modo flotante de pantalla completa
import "../../styles/VideoPlayer.css";

const VideoPlayer = ({ src, title, artist, year, genre, duration }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null); // Referencia al contenedor principal para la pantalla completa
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0); // Usar la duración de props si existe
  const [isSeeking, setIsSeeking] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false); // Estado para el modo pantalla completa nativo
  const [displayBasic, setDisplayBasic] = useState(false); // Estado para el Dialog de PrimeReact (para flotante)
  const [showFullControls, setShowFullControls] = useState(false);

  const formatTime = (time) => {
    if (isNaN(time) || time < 0) return "00:00"; // Manejar valores negativos o NaN
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!isSeeking && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleSeekingChange = (e) => {
    // Esto se llama cuando el usuario está arrastrando el slider (cambio en el valor)
    setCurrentTime(e.value);
    setIsSeeking(true);
  };

  const handleSeekEnd = (e) => {
    // Esto se llama cuando el usuario suelta el slider
    if (videoRef.current) {
      videoRef.current.currentTime = e.value;
    }
    setIsSeeking(false);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.value;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (videoRef.current) {
      videoRef.current.muted = newMutedState;
      // Si silenciamos, guardamos el volumen anterior, pero el estado principal es 'muted'
      if (!newMutedState && volume === 0) {
        // Si desmuteamos y el volumen estaba en 0, lo ponemos en 50
        setVolume(50);
        videoRef.current.volume = 0.5;
      }
    }
  };

  // Lógica de pantalla completa nativa
  const handleFullScreen = () => {
    if (document.fullscreenEnabled) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error(
            `Error intentando entrar en pantalla completa: ${err.message} (${err.name})`
          );
          setDisplayBasic(true); // Fallback al Dialog flotante
        });
      } else {
        document.exitFullscreen();
      }
    } else {
      // Si la API de pantalla completa nativa no está disponible, usar el Dialog flotante
      setDisplayBasic(true);
    }
  };

  useEffect(() => {
    // Escucha cambios en el estado de pantalla completa nativa
    const fullscreenChangeHandler = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", fullscreenChangeHandler);

    return () => {
      document.removeEventListener("fullscreenchange", fullscreenChangeHandler);
    };
  }, []);

  const handleMouseEnter = () => setShowFullControls(true);
  const handleMouseLeave = () => setShowFullControls(false);

  // Asegurar que el `videoRef` esté listo para las interacciones
  useEffect(() => {
    if (videoRef.current) {
      // Inicializar el volumen
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Se muestra una Card si el video está inactivo (por ahora)
  if (!src) {
    return (
      <Card
        title="Reproductor de Video"
        className="p-d-flex p-ai-center p-jc-center"
      >
        <p className="p-text-center">Seleccione un video para comenzar.</p>
      </Card>
    );
  }

  return (
    <div className="video-player-wrapper">
      <div
        className={`video-player-container ${
          showFullControls || !isPlaying ? "full-controls" : ""
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={togglePlay} // Click en el video principal para Play/Pause
        ref={containerRef} // Asignamos la referencia al contenedor
      >
        <video
          ref={videoRef}
          src={src}
          // Eliminamos width: "100%" y height: "100%" de los estilos en línea
          // para que el CSS (padding hack) controle el tamaño y aspect ratio.
          style={{ objectFit: "contain" }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onDoubleClick={handleFullScreen} // Doble clic para pantalla completa
        />

        {/* CONTROLES DE SUPERPOSICIÓN */}
        <div className="video-controls-overlay">
          {/* BARRA DE TIEMPO / SLIDER */}
          <div className="time-progress-bar">
            <span className="time-label">{formatTime(currentTime)}</span>
            <Slider
              value={currentTime}
              min={0}
              max={videoDuration}
              onChange={handleSeekingChange}
              onSlideEnd={handleSeekEnd}
              step={0.1} // Permite un movimiento más suave
            />
            <span className="time-label">{formatTime(videoDuration)}</span>
          </div>

          {/* BOTONES PRINCIPALES */}
          <div className="video-player-controls">
            {/* Play/Pause */}
            <Button
              icon={isPlaying ? "pi pi-pause" : "pi pi-play"}
              className="p-button-rounded"
              onClick={(e) => {
                e.stopPropagation(); // Previene el togglePlay doble
                togglePlay();
              }}
            />

            {/* Controles de Volumen */}
            <div className="volume-button-group p-d-flex p-ai-center">
              <Button
                icon={
                  isMuted || volume === 0
                    ? "pi pi-volume-off"
                    : "pi pi-volume-up"
                }
                className="p-button-rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
              />
              <div
                className={`volume-control ${
                  isMuted || volume === 0 ? "active" : ""
                }`}
                onClick={(e) => e.stopPropagation()} // Previene el togglePlay
              >
                <Slider
                  value={volume}
                  min={0}
                  max={100}
                  onChange={handleVolumeChange}
                  orientation="horizontal"
                />
              </div>
            </div>

            <div style={{ flexGrow: 1 }}></div>

            {/* Fullscreen Nativo/Dialog */}
            <Button
              icon={isFullScreen ? "pi pi-window-minimize" : "pi pi-arrows-alt"}
              className="p-button-rounded"
              onClick={(e) => {
                e.stopPropagation();
                handleFullScreen();
              }}
            />
          </div>
        </div>
      </div>

      {/* AQUÍ ES DONDE DEBE IR LA INFORMACIÓN, FUERA DEL video-player-container */}
      <div className="video-metadata-below-player">
        <div className="video-title-below">{title || "Video sin Título"}</div>
        <div className="video-artist-info-below">
          {artist && <span>{artist}</span>}
          {year && artist && <span> &bull; </span>}
          {year && <span>{year}</span>}
          {genre && (artist || year) && <span> &bull; </span>}
          {genre && <span>{genre}</span>}
        </div>
      </div>

      {/* Dialog para pantalla completa flotante si la nativa falla */}
      <Dialog
        header={title || "Video"}
        visible={displayBasic}
        style={{ width: "90vw", height: "90vh" }}
        onHide={() => {
          setDisplayBasic(false);
          if (videoRef.current && isPlaying) videoRef.current.pause();
        }}
        contentClassName="dialog-video-content"
        modal
        maximizable
      >
        <video
          src={src}
          autoPlay={isPlaying}
          controls
          // Mantenemos estos estilos para asegurar que llene el Dialog.
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "black",
          }}
          onEnded={() => {
            setDisplayBasic(false); // Cierra el dialog al terminar
          }}
        />
      </Dialog>
    </div>
  );
};

export default VideoPlayer;
