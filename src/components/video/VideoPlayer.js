// src/components/VideoPlayer.js
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { Slider } from "primereact/slider";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog"; // Para el modo flotante de pantalla completa
import "../../styles/VideoPlayer.css";

const VideoPlayer = ({ src, title, artist, year, genre, duration }) => {
  const videoRef = useRef(null);
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
    return `${minutes < 10 ? "0" : ""}${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .catch((e) => console.error("Error al reproducir video:", e));
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const onVolumeChange = (e) => {
    const newVolume = e.value;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      if (newVolume === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    }
  };

  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        // Entrar en pantalla completa (navegador)
        videoRef.current.requestFullscreen().catch((err) => {
          console.error(
            `Error al intentar pantalla completa: ${err.message} (${err.name})`
          );
          // Si falla la pantalla completa nativa, intentar con el Dialog flotante
          setDisplayBasic(true);
        });
      } else {
        // Salir de pantalla completa (navegador)
        document.exitFullscreen();
      }
    }
  };

  // Listener para el evento de cambio de pantalla completa del navegador
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
      // Si salimos de pantalla completa nativa, asegúrate de cerrar el Dialog si estaba abierto
      if (!document.fullscreenElement && displayBasic) {
        setDisplayBasic(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, [displayBasic]);

  const onLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      videoRef.current.volume = volume / 100; // Aplicar volumen inicial
    }
  }, [volume]);

  const onTimeUpdate = useCallback(() => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [isSeeking]);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Efecto para adjuntar/desadjuntar escuchadores de eventos
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      setIsPlaying(false); // Resetear estado de reproducción
      setCurrentTime(0);
      setVideoDuration(duration || 0); // Resetear duración

      videoEl.addEventListener("loadedmetadata", onLoadedMetadata);
      videoEl.addEventListener("timeupdate", onTimeUpdate);
      videoEl.addEventListener("ended", onEnded);
      videoEl.addEventListener("volumechange", () => {
        // Sincronizar el estado interno de volumen/mute con el elemento de video
        if (videoEl.muted) {
          setIsMuted(true);
        } else {
          setIsMuted(false);
          setVolume(Math.round(videoEl.volume * 100));
        }
      });

      return () => {
        videoEl.removeEventListener("loadedmetadata", onLoadedMetadata);
        videoEl.removeEventListener("timeupdate", onTimeUpdate);
        videoEl.removeEventListener("ended", onEnded);
        videoEl.removeEventListener("volumechange", null);
      };
    }
  }, [src, duration, onLoadedMetadata, onTimeUpdate, onEnded]);

  // Función para manejar el clic en el overlay o en el video
  const handleVideoInteraction = () => {
    setShowFullControls((prev) => !prev); // Alterna la visibilidad de los controles
  };

  return (
    <Card className="video-player-card">
      <div className="video-player-container" onClick={handleVideoInteraction}>
        {" "}
        {/* Añadir onClick aquí */}
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          className="video-display"
        />
        {/* Añadir la clase 'active-controls' condicionalmente para mostrar/ocultar */}
        <div
          className={`video-controls-overlay ${
            showFullControls ? "active-controls" : ""
          }`}
        >
          <div className="controls-row">
            {/* Botón Play/Pause (siempre visible) */}
            <Button
              icon={isPlaying ? "pi pi-pause" : "pi pi-play"}
              className="p-button-rounded p-button-lg p-button-text p-button-secondary video-play-pause-btn"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }} // Detener propagación para no ocultar controles
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            />

            {/* Barra de Progreso (visible solo en 'active-controls' en móvil) */}
            <div className="video-progress-area">
              <span className="time-current">{formatTime(currentTime)}</span>
              <Slider
                value={currentTime}
                onChange={(e) => {
                  if (videoRef.current) videoRef.current.currentTime = e.value;
                  setCurrentTime(e.value);
                }}
                min={0}
                max={videoDuration}
                step={1}
                className="video-progress-slider"
              />
              <span className="time-duration">{formatTime(videoDuration)}</span>
            </div>

            {/* Controles de Volumen (visible solo en 'active-controls' en móvil) */}
            <div className="video-volume-controls">
              <Button
                icon={
                  isMuted || volume === 0
                    ? "pi pi-volume-off"
                    : "pi pi-volume-up"
                }
                className="p-button-rounded p-button-sm p-button-text p-button-secondary video-volume-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }} // Detener propagación
                aria-label={isMuted ? "Activar sonido" : "Silenciar"}
              />
              <Slider
                value={volume}
                onChange={onVolumeChange}
                min={0}
                max={100}
                step={1}
                className="video-volume-slider"
              />
            </div>

            {/* Botón Fullscreen (siempre visible) */}
            <Button
              icon={
                isFullScreen ? "pi pi-window-minimize" : "pi pi-window-maximize"
              }
              className="p-button-rounded p-button-sm p-button-text p-button-secondary video-fullscreen-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullScreen();
              }} // Detener propagación
              aria-label={
                isFullScreen
                  ? "Salir de pantalla completa"
                  : "Pantalla completa"
              }
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
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "black",
          }}
          onEnded={onEnded}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
        />
      </Dialog>
    </Card>
  );
};

export default VideoPlayer;
