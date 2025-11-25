// src/components/video/VideoPlayer.js
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

  // Helper para formatear el tiempo a MM:SS
  const formatTime = (time) => {
    if (isNaN(time) || time < 0) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  // =================================================================
  // [NUEVO] HOOK CRUCIAL: Resetear el estado cuando la URL del video cambia
  // Esto es vital al cambiar de video en VideosPage
  // =================================================================
  useEffect(() => {
    const video = videoRef.current;
    if (src && video) {
      console.log(
        `[VideoPlayer] Nuevo src detectado. Reiniciando player: ${src}`
      );
      // 1. Resetear estados visuales
      setIsPlaying(false);
      setCurrentTime(0);
      setVideoDuration(duration || 0);
      setIsSeeking(false);

      // 2. Forzar carga en el elemento nativo
      // video.load() forza al navegador a recargar el src.
      video.load();
      video.currentTime = 0;
    }
    // Incluimos src y duration en dependencias para reaccionar a cambios
  }, [src, duration]);

  // =================================================================
  // HANDLERS (Usando useCallback para estabilidad en useEffect)
  // =================================================================

  // Handler para el evento 'loadedmetadata'
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && !isNaN(video.duration) && isFinite(video.duration)) {
      setVideoDuration(video.duration);
      console.log(
        `[VideoPlayer] Metadata cargada. Duración: ${formatTime(
          video.duration
        )}`
      );
    } else {
      console.warn(
        "[VideoPlayer] Loaded metadata no proporcionó una duración válida."
      );
    }
  }, [formatTime]);

  // Handler para el evento 'timeupdate'
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video && !isSeeking) {
      setCurrentTime(video.currentTime);
    }
  }, [isSeeking]);

  // Handler para el evento 'ended'
  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0; // Vuelve al inicio
    }
  }, []);

  // Handler para errores de reproducción
  const handleVideoError = useCallback((e) => {
    let errorMessage = "Error desconocido de reproducción de video.";
    if (e.target.error) {
      switch (e.target.error.code) {
        case e.target.error.MEDIA_ERR_ABORTED:
          errorMessage = "Reproducción abortada por el usuario.";
          break;
        case e.target.error.MEDIA_ERR_NETWORK:
          errorMessage =
            "Error de red: El video se detuvo por un error de conexión.";
          break;
        case e.target.error.MEDIA_ERR_DECODE:
          errorMessage =
            "Error de decodificación: Archivo corrupto o formato no compatible.";
          break;
        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage =
            "Formato de video no compatible o URL de fuente no válida.";
          break;
        default:
          errorMessage = `Error de video: Código ${e.target.error.code}.`;
      }
    }
    console.error(`[VideoPlayer] ERROR DE REPRODUCCIÓN: ${errorMessage}`);
    // Aquí podrías usar Toast de PrimeReact para mostrar el error al usuario
  }, []);

  // =================================================================
  // USE EFFECT PRINCIPAL: Adjuntar y remover los Event Listeners
  // Se ejecuta una sola vez al montar y limpia al desmontar
  // =================================================================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Adjuntar listeners
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleVideoEnded);
    video.addEventListener("error", handleVideoError); // Nuevo error handler

    // Limpieza: importante para evitar fugas de memoria y listeners duplicados
    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleVideoEnded);
      video.removeEventListener("error", handleVideoError);
    };
    // Dependencias: Los handlers que son useCallback se incluyen
  }, [
    handleLoadedMetadata,
    handleTimeUpdate,
    handleVideoEnded,
    handleVideoError,
  ]);

  // =================================================================
  // Lógica de Controles
  // =================================================================

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      // [MEJORA CLAVE] Manejar la promesa de play() para capturar el bloqueo de autoplay
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            // Esto captura errores como 'NotAllowedError' (Autoplay bloqueado)
            console.error(
              "Error al intentar reproducir el video (posible bloqueo de autoplay o fallo de carga):",
              error
            );
            // Opcional: Mostrar un mensaje al usuario aquí: "Haz clic para empezar"
            setIsPlaying(false);
          });
      }
    }
  }, [isPlaying]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullScreen = () => {
    const video = videoRef.current;
    // Intentar el modo nativo
    if (!isFullScreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.mozRequestFullScreen) {
        video.mozRequestFullScreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
      } else {
        // Fallback al modo flotante de PrimeReact
        setDisplayBasic(true);
        if (isPlaying) video.pause(); // Pausar para que el usuario inicie en el Dialog
      }
    } else {
      // Salir de pantalla completa (generalmente manejado por el navegador)
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    // El navegador manejará el estado, pero esto ayuda con el fallback
    setIsFullScreen(!isFullScreen);
  };

  // Hook para detectar el cambio de estado nativo de pantalla completa
  useEffect(() => {
    const handleFullScreenChange = () => {
      // Chequea si algún elemento está en modo fullscreen
      setIsFullScreen(
        !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        )
      );
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);

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
        "MSFullscreenChange",
        handleFullScreenChange
      );
    };
  }, []);

  const handleSeekChange = (e) => {
    const newTime = e.value;
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setIsSeeking(false);
  };

  const handleSeeking = (e) => {
    setIsSeeking(true);
    setCurrentTime(e.value);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.value;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      if (newVolume > 0) {
        setIsMuted(false);
      } else {
        setIsMuted(true);
      }
    }
  };

  return (
    <Card className="video-player-card">
      <div
        className={`video-player-container ${
          showFullControls ? "show-controls" : ""
        }`}
        onMouseEnter={() => setShowFullControls(true)}
        onMouseLeave={() => setShowFullControls(false)}
        onClick={handlePlayPause} // Permite play/pause al hacer clic en el video
      >
        <video
          ref={videoRef}
          src={src}
          preload="metadata" // Intentar cargar la metadata (duración) lo antes posible
          // No usamos controls nativos. Los eventos se adjuntan en useEffect
          // No usamos autoPlay ya que se maneja con el estado y la lógica de play/pause
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            backgroundColor: "black",
          }}
        />

        {/* Overlay central de Play/Pause */}
        <div
          className="play-pause-overlay"
          onClick={(e) => {
            e.stopPropagation();
            handlePlayPause();
          }}
        >
          {!isPlaying && (
            <i
              className="pi pi-play"
              style={{ fontSize: "3rem", color: "white" }}
            ></i>
          )}
          {isPlaying && (
            <i
              className="pi pi-pause"
              style={{ fontSize: "3rem", color: "white" }}
            ></i>
          )}
        </div>

        {/* Barra de Controles Personalizada */}
        <div className="custom-controls">
          {/* Slider de Progreso */}
          <div className="progress-bar-container">
            <Slider
              value={currentTime}
              onChange={handleSeeking}
              onSlideEnd={handleSeekChange}
              min={0}
              max={videoDuration > 0 ? videoDuration : 100} // Usar 100 como fallback si la duración no se carga
              step={1}
              className="video-slider"
            />
          </div>

          {/* Botones e Información */}
          <div className="controls-row">
            {/* Play / Pause */}
            <Button
              icon={isPlaying ? "pi pi-pause" : "pi pi-play"}
              className="p-button-rounded p-button-text p-button-plain"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            />

            {/* Tiempo actual / Duración */}
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </span>

            {/* Espacio flexible */}
            <div style={{ flexGrow: 1 }}></div>

            {/* Control de Volumen */}
            <div className="volume-control-container">
              <Button
                icon={
                  isMuted || volume === 0
                    ? "pi pi-volume-off"
                    : "pi pi-volume-up"
                }
                className="p-button-rounded p-button-text p-button-plain"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                aria-label={isMuted ? "Unmute" : "Mute"}
              />
              <Slider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                min={0}
                max={100}
                step={1}
                className="volume-slider"
              />
            </div>

            {/* Pantalla Completa */}
            <Button
              icon={isFullScreen ? "pi pi-window-minimize" : "pi pi-maximize"}
              className="p-button-rounded p-button-text p-button-plain"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullScreen();
              }}
              aria-label="Toggle Fullscreen"
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
          // Al cerrar, si el video estaba en reproducción, lo pausamos
          if (videoRef.current && isPlaying) videoRef.current.pause();
        }}
        contentClassName="dialog-video-content"
        modal
        maximizable
      >
        <video
          src={src}
          autoPlay={isPlaying} // AutoPlay en el Dialog solo si estaba reproduciéndose
          controls
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "black",
          }}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
        />
      </Dialog>
    </Card>
  );
};

export default VideoPlayer;
