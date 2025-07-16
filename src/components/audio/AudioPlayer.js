// src/components/AudioPlayer.js

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { Slider } from "primereact/slider"; // Necesitarás PrimeReact Slider
import "../../styles/AudioPlayer.css"; // Crearemos este archivo CSS

const AudioPlayer = ({ src, title }) => {
  const audioRef = useRef(null); // Referencia al elemento <audio>
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100); // Volumen en porcentaje

  // Formatea el tiempo para mostrarlo como MM:SS
  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes < 10 ? "0" : ""}${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  };

  // Manejadores de eventos del audio
  const onLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const onTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0); // Reinicia el tiempo cuando termina
  }, []);

  // Efecto para adjuntar/desadjuntar escuchadores de eventos
  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.addEventListener("loadedmetadata", onLoadedMetadata);
      audioEl.addEventListener("timeupdate", onTimeUpdate);
      audioEl.addEventListener("ended", onEnded);

      // Limpieza de los escuchadores cuando el componente se desmonte
      return () => {
        audioEl.removeEventListener("loadedmetadata", onLoadedMetadata);
        audioEl.removeEventListener("timeupdate", onTimeUpdate);
        audioEl.removeEventListener("ended", onEnded);
      };
    }
  }, [onLoadedMetadata, onTimeUpdate, onEnded]);

  // Manejar reproducción/pausa
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current
          .play()
          .catch((e) => console.error("Error al reproducir:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Manejar cambio de tiempo (seek)
  const onSeek = (e) => {
    if (audioRef.current) {
      audioRef.current.currentTime = e.value;
      setCurrentTime(e.value);
    }
  };

  // Manejar cambio de volumen
  const onVolumeChange = (e) => {
    if (audioRef.current) {
      setVolume(e.value);
      audioRef.current.volume = e.value / 100;
    }
  };

  return (
    <div className="audio-player-card">
      <h4>{title}</h4>
      <audio ref={audioRef} src={src} preload="metadata" />{" "}
      {/* 'preload="metadata"' carga solo la info sin el audio completo */}
      <div className="controls-row">
        <Button
          icon={isPlaying ? "pi pi-pause" : "pi pi-play"}
          className="p-button-rounded p-button-success p-mr-2"
          onClick={togglePlayPause}
        />
        <Button
          icon="pi pi-stop"
          className="p-button-rounded p-button-danger"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              setIsPlaying(false);
            }
          }}
        />
      </div>
      <div className="progress-row">
        <span>{formatTime(currentTime)}</span>
        <Slider
          value={currentTime}
          onChange={onSeek}
          min={0}
          max={duration}
          step={1}
          className="audio-progress-slider"
        />
        <span>{formatTime(duration)}</span>
      </div>
      <div className="volume-row">
        <i className="pi pi-volume-up p-mr-2" />
        <Slider
          value={volume}
          onChange={onVolumeChange}
          min={0}
          max={100}
          step={1}
          className="audio-volume-slider"
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
