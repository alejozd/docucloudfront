// src/components/AudioPlayer.js

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { Slider } from "primereact/slider";
import "../../styles/AudioPlayer.css";

// Recibe globalVolume y onPlay como props
const AudioPlayer = ({
  src,
  title,
  artist,
  globalVolume,
  onPlay,
  isActive,
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes < 10 ? "0" : ""}${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  };

  const onLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false); // La metadata se ha cargado, ya no está cargando
      setError(null); // Limpiar cualquier error previo
    }
  }, []);

  const onTimeUpdate = useCallback(() => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [isSeeking]);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const onError = useCallback(() => {
    setError("No se pudo cargar o reproducir el audio.");
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  // Efecto para aplicar el volumen global cuando el componente carga o el volumen global cambia
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = globalVolume / 100;
    }
  }, [globalVolume]); // Reacciona al cambio de globalVolume

  // Efecto para adjuntar/desadjuntar escuchadores de eventos
  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      // Resetear estados al cambiar el src
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(true); // Indicar que está cargando el nuevo src
      setError(null); // Limpiar errores al cargar un nuevo src

      audioEl.addEventListener("loadedmetadata", onLoadedMetadata);
      audioEl.addEventListener("timeupdate", onTimeUpdate);
      audioEl.addEventListener("ended", onEnded);
      audioEl.addEventListener("error", onError); // Escuchador de errores

      // Manejar el evento 'canplaythrough' para indicar que el audio está listo para reproducirse sin interrupciones
      const handleCanPlayThrough = () => {
        setIsLoading(false);
      };
      audioEl.addEventListener("canplaythrough", handleCanPlayThrough);

      return () => {
        audioEl.removeEventListener("loadedmetadata", onLoadedMetadata);
        audioEl.removeEventListener("timeupdate", onTimeUpdate);
        audioEl.removeEventListener("ended", onEnded);
        audioEl.removeEventListener("error", onError);
        audioEl.removeEventListener("canplaythrough", handleCanPlayThrough);
      };
    }
  }, [src, onLoadedMetadata, onTimeUpdate, onEnded, onError]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Notifica a la página principal que este audio ha comenzado a reproducirse
        onPlay(audioRef);
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setError(null); // Limpiar error si la reproducción es exitosa
          })
          .catch((e) => {
            console.error("Error al reproducir:", e);
            setError("No se pudo reproducir el audio.");
            setIsPlaying(false);
          });
      }
    }
  };

  const onSeekStart = () => {
    setIsSeeking(true);
  };

  const onSeekEnd = (e) => {
    if (audioRef.current) {
      audioRef.current.currentTime = e.value;
      setCurrentTime(e.value);
    }
    setIsSeeking(false);
  };

  return (
    <div className={`custom-audio-player ${isActive ? "is-active" : ""}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="player-info-controls">
        <div className="player-meta">
          <div className="song-details">
            <span className="song-title">{title || "Título Desconocido"}</span>{" "}
            {/* Usa el título del ID3 o un fallback */}
            <span className="song-artist">
              {artist || "Artista Desconocido"}
            </span>{" "}
            {/* NUEVO: Muestra el artista */}
          </div>
        </div>

        <div className="player-controls">
          <Button
            icon={isPlaying ? "pi pi-pause" : "pi pi-play"}
            className="p-button-rounded p-button-lg p-button-text p-button-secondary play-pause-btn"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
          />
          <Button
            icon="pi pi-stop"
            className="p-button-rounded p-button-sm p-button-text p-button-secondary stop-btn"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPlaying(false);
              }
            }}
            aria-label="Detener"
          />
        </div>

        <div className="player-progress">
          <span className="time-current">{formatTime(currentTime)}</span>
          <Slider
            value={currentTime}
            onChange={onSeekEnd}
            onSlideEnd={onSeekEnd}
            onSlideStart={onSeekStart}
            min={0}
            max={duration}
            step={1}
            className="audio-progress-slider p-component"
          />
          <span className="time-duration">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
