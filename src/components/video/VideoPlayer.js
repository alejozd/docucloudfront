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

  return (
    <Card className="video-player-card">
      <div className="video-player-container">
        {/* Usamos controls={false} para tener controles personalizados */}
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          className="video-display"
        />

        <div className="video-controls-overlay">
          <div className="video-metadata">
            <div className="video-title">{title || "Video sin Título"}</div>
            <div className="video-artist-info">
              {artist && <span>{artist}</span>}
              {year && artist && <span> &bull; </span>}
              {year && <span>{year}</span>}
              {genre && (artist || year) && <span> &bull; </span>}
              {genre && <span>{genre}</span>}
            </div>
          </div>

          <div className="controls-row">
            <Button
              icon={isPlaying ? "pi pi-pause" : "pi pi-play"}
              className="p-button-rounded p-button-lg p-button-text p-button-secondary video-play-pause-btn"
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            />

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

            <div className="video-volume-controls">
              <Button
                icon={
                  isMuted || volume === 0
                    ? "pi pi-volume-off"
                    : "pi pi-volume-up"
                }
                className="p-button-rounded p-button-sm p-button-text p-button-secondary video-volume-btn"
                onClick={toggleMute}
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

            <Button
              icon={
                isFullScreen ? "pi pi-window-minimize" : "pi pi-window-maximize"
              }
              className="p-button-rounded p-button-sm p-button-text p-button-secondary video-fullscreen-btn"
              onClick={toggleFullScreen}
              aria-label={
                isFullScreen
                  ? "Salir de pantalla completa"
                  : "Pantalla completa"
              }
            />
          </div>
        </div>
      </div>

      {/* Dialog para pantalla completa flotante si la nativa falla */}
      <Dialog
        header={title || "Video"}
        visible={displayBasic}
        style={{ width: "90vw", height: "90vh" }}
        onHide={() => {
          setDisplayBasic(false);
          if (videoRef.current && isPlaying) videoRef.current.pause(); // Pausar al cerrar si estaba reproduciendo
        }}
        contentClassName="dialog-video-content"
        modal
        maximizable
      >
        <video
          src={src}
          autoPlay={isPlaying} // Auto-play si ya estaba reproduciendo
          controls // Aquí sí mostramos los controles nativos del navegador
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "black",
          }}
          onEnded={onEnded}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          // Podemos también pasar el ref si queremos sincronizar estados con el player principal
          // Aunque para este modo, los controles nativos son suficientes.
        />
      </Dialog>
    </Card>
  );
};

export default VideoPlayer;
