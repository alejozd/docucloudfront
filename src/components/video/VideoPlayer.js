// src/components/video/VideoPlayer.js
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { Slider } from "primereact/slider";
import { Dialog } from "primereact/dialog"; // Para el modo flotante de pantalla completa
import "primeicons/primeicons.css";
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
  // Eliminamos showFullControls, ahora los controles son parte del diseño base.

  // Función de utilidad para formatear el tiempo (segundos a MM:SS)
  const formatTime = (time) => {
    if (isNaN(time) || time < 0) return "00:00"; // Manejar valores negativos o NaN
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  // ----------------------------------------------------
  // MANEJO DE ESTADOS Y EVENTOS DE VIDEO
  // ----------------------------------------------------

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((error) => {
        // Manejar error de autoplay (navegadores lo bloquean si no hay interacción previa)
        console.error("Autoplay fallido:", error);
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Actualizar el tiempo actual y la duración del video
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime);
      // Actualiza la duración si no fue provista por props o cambió
      if (videoDuration === 0 || videoDuration !== videoRef.current.duration) {
        setVideoDuration(videoRef.current.duration);
      }
    }
  }, [isSeeking, videoDuration]);

  // Manejo del cambio de volumen
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Manejo de mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // ----------------------------------------------------
  // BUSCADOR (SLIDER)
  // ----------------------------------------------------

  const handleSeekStart = () => {
    setIsSeeking(true);
    if (videoRef.current) {
      videoRef.current.pause(); // Pausar mientras el usuario arrastra
    }
  };

  const handleSeekChange = (e) => {
    setCurrentTime(e.value);
  };

  const handleSeekEnd = (e) => {
    if (videoRef.current) {
      videoRef.current.currentTime = e.value;
      if (isPlaying) {
        videoRef.current.play(); // Reanudar si estaba reproduciéndose
      }
    }
    setIsSeeking(false);
  };

  // ----------------------------------------------------
  // PANTALLA COMPLETA
  // ----------------------------------------------------

  const toggleFullScreen = () => {
    const container = videoRef.current.closest(".video-player-container");

    if (!document.fullscreenElement) {
      // Intentar modo nativo
      if (container.requestFullscreen) {
        container.requestFullscreen();
        setIsFullScreen(true);
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
        setIsFullScreen(true);
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
        setIsFullScreen(true);
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
        setIsFullScreen(true);
      } else {
        // Fallback al Dialog de PrimeReact
        setDisplayBasic(true);
      }
    } else {
      // Salir de pantalla completa nativa
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
        setIsFullScreen(false);
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        setIsFullScreen(false);
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      // Sincronizar el estado isFullScreen con el estado nativo del navegador
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("msfullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullScreenChange
      );
    };
  }, []);

  const onVideoEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // ----------------------------------------------------
  // RENDERIZADO
  // ----------------------------------------------------

  return (
    <div className="video-player-wrapper">
      <div className="video-player-container">
        {/* El elemento de video en sí */}
        <video
          ref={videoRef}
          src={src}
          className="video-element"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate} // Carga inicial de duración
          onEnded={onVideoEnded}
          onClick={togglePlay} // Toca para pausar/reproducir
        />

        {/* Overlay de Carga/Pausa (opcional, si se necesita un spinner) */}
        {/* <div className="video-overlay" /> */}

        {/* Controles Personalizados (Control Bar) */}
        <div className="custom-controls">
          {/* Botón de Play/Pausa central (para mejor usabilidad táctil) */}
          <button className="play-pause-overlay-btn" onClick={togglePlay}>
            <i
              className={isPlaying ? "pi pi-pause" : "pi pi-play"}
              style={{ fontSize: "2rem" }}
            ></i>
          </button>

          {/* Barra de progreso / Slider principal */}
          <div className="progress-bar-container">
            <Slider
              value={currentTime}
              min={0}
              max={videoDuration || 1} // Evita max=0
              step={0.1}
              onChange={handleSeekChange}
              onSlideStart={handleSeekStart}
              onSlideEnd={handleSeekEnd}
              className="video-progress-slider"
            />
          </div>

          <div className="controls-bar-bottom">
            {/* Controles Izquierdos */}
            <div className="controls-left">
              {/* Play/Pause */}
              <Button
                icon={isPlaying ? "pi pi-pause" : "pi pi-play"}
                className="p-button-rounded p-button-text p-button-plain p-button-lg play-pause-btn"
                onClick={togglePlay}
                tooltip={isPlaying ? "Pausa" : "Reproducir"}
                tooltipOptions={{ position: "bottom" }}
              />

              {/* Tiempo Actual / Duración */}
              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(videoDuration)}
              </span>

              {/* Control de Volumen (con botón de Mute) */}
              <Button
                icon={isMuted ? "pi pi-volume-off" : "pi pi-volume-up"}
                className="p-button-rounded p-button-text p-button-plain volume-mute-btn"
                onClick={() => setIsMuted(!isMuted)}
                tooltip={isMuted ? "Activar Sonido" : "Silenciar"}
                tooltipOptions={{ position: "bottom" }}
              />
              <div className="volume-slider-container">
                <Slider
                  value={isMuted ? 0 : volume}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(e) => {
                    setVolume(e.value);
                    if (e.value > 0 && isMuted) {
                      setIsMuted(false); // Desmutear si el volumen sube
                    }
                    if (e.value === 0 && !isMuted) {
                      setIsMuted(true); // Mutear si el volumen llega a 0
                    }
                  }}
                  className="volume-slider"
                />
              </div>
            </div>

            {/* Controles Derechos */}
            <div className="controls-right">
              {/* Botón de Pantalla Completa */}
              <Button
                icon={isFullScreen ? "pi pi-window-minimize" : "pi pi-expand"}
                className="p-button-rounded p-button-text p-button-plain fullscreen-btn"
                onClick={toggleFullScreen}
                tooltip={
                  isFullScreen
                    ? "Salir de Pantalla Completa"
                    : "Pantalla Completa"
                }
                tooltipOptions={{ position: "bottom" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AQUÍ ES DONDE DEBE IR LA INFORMACIÓN, FUERA DEL video-player-container */}
      <div className="video-metadata-below-player p-card p-component">
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
          onEnded={onVideoEnded}
        />
      </Dialog>
    </div>
  );
};

export default VideoPlayer;
