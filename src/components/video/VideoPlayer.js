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
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false); // Estado para el modo pantalla completa nativo
  const [displayBasic, setDisplayBasic] = useState(false); // Estado para el Dialog de PrimeReact (para flotante)
  const [showFullControls, setShowFullControls] = useState(false);

  // ==========================================================
  // [NUEVO] ESTADO PARA EL WAKE LOCK
  // ==========================================================
  const [wakeLock, setWakeLock] = useState(null);

  const formatTime = (time) => {
    if (isNaN(time) || time < 0) return "00:00"; // Manejar valores negativos o NaN
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    const videoEl = videoRef.current;
    if (videoEl) {
      if (isPlaying) {
        videoEl.pause();
        setIsPlaying(false);
      } else {
        videoEl
          .play()
          .catch((e) => console.error("Error al reproducir video:", e));
        setIsPlaying(true);
      }
    }
    setShowFullControls(true); // Mostrar controles al hacer clic
  };

  const onLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      videoRef.current.volume = volume / 100; // Aplicar volumen inicial

      // Intentar reproducción automática (se gestiona la promesa)
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setShowFullControls(false);
        })
        .catch((e) => {
          // Fallo en Autoplay: El video se queda pausado, el usuario debe interactuar.
          console.warn(
            "Autoplay bloqueado. El usuario debe hacer clic en Play."
          );
          setIsPlaying(false);
          setShowFullControls(true);
        });
    }
  }, [volume]);

  const onTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setShowFullControls(true); // Mostrar controles al finalizar
  }, []);

  // Función para manejar el Fullscreen nativo
  const toggleFullScreen = () => {
    const el = containerRef.current;
    if (!el) return;

    if (!isFullScreen) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      } else {
        // Si falla el nativo, intenta el Dialog flotante de PrimeReact
        setDisplayBasic(true);
        return;
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // ==========================================================
  // [NUEVO] Manejo de Screen Wake Lock (Evita que la pantalla se apague)
  // ==========================================================
  useEffect(() => {
    if ("wakeLock" in navigator) {
      if (isPlaying) {
        // Lógica para adquirir el bloqueo
        const acquireLock = async () => {
          try {
            const lock = await navigator.wakeLock.request("screen");
            setWakeLock(lock);
            console.log("✅ Screen Wake Lock adquirido.");

            lock.addEventListener("release", () => {
              setWakeLock(null);
              console.log("Wake Lock liberado por el sistema.");
            });
          } catch (err) {
            console.warn(
              "⚠️ Fallo al adquirir Wake Lock (puede ser bloqueado por el navegador):",
              err.message
            );
          }
        };

        // Solo intentar adquirir si aún no lo tenemos
        if (!wakeLock) {
          acquireLock();
        }
      } else {
        // Lógica para liberar el bloqueo si el video está pausado o terminado
        if (wakeLock) {
          wakeLock
            .release()
            .then(() => {
              setWakeLock(null);
              console.log("🔒 Screen Wake Lock liberado.");
            })
            .catch((err) => {
              console.error("❌ Error al liberar Wake Lock:", err.message);
            });
        }
      }
    } else {
      console.log("Wake Lock API no soportada en este dispositivo.");
    }

    // Función de limpieza: Se ejecuta al desmontar el componente.
    return () => {
      // Intentar liberar si existe un bloqueo activo y no ha sido liberado
      if (wakeLock && !wakeLock.released) {
        wakeLock
          .release()
          .then(() => setWakeLock(null))
          .catch((err) =>
            console.error(
              "❌ Error al liberar Wake Lock en limpieza:",
              err.message
            )
          );
      }
    };
  }, [isPlaying, wakeLock]); // Depende solo de isPlaying

  // useEffect existente para listeners del elemento de video y full screen
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      setCurrentTime(0);
      setVideoDuration(duration || 0); // Resetear duración

      // Adjuntar listeners
      videoEl.addEventListener("loadedmetadata", onLoadedMetadata);
      videoEl.addEventListener("timeupdate", onTimeUpdate);
      videoEl.addEventListener("ended", onEnded);

      // Listener para cambios de volumen (si es necesario)
      const handleVolumeChange = () => setVolume(videoEl.volume * 100);
      videoEl.addEventListener("volumechange", handleVolumeChange);

      // Función de limpieza
      return () => {
        videoEl.removeEventListener("loadedmetadata", onLoadedMetadata);
        videoEl.removeEventListener("timeupdate", onTimeUpdate);
        videoEl.removeEventListener("ended", onEnded);
        videoEl.removeEventListener("volumechange", handleVolumeChange);
      };
    }
  }, [src, duration, onLoadedMetadata, onTimeUpdate, onEnded]);

  // useEffect para manejar el cambio de estado de pantalla completa
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("msfullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullScreenChange
      );
    };
  }, []);

  return (
    <Card className="video-player-card">
      <div
        className="video-player-container"
        ref={containerRef}
        onMouseEnter={() => setShowFullControls(true)}
        onMouseLeave={() => {
          if (isPlaying) {
            setShowFullControls(false);
          }
        }}
      >
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          className="video-display"
          onClick={togglePlayPause}
          crossOrigin="anonymous" // Necesario para CORS en algunos navegadores
        />

        {/* ... Resto del componente (Overlay y Controles) ... */}

        {/* Overlay para el botón central de Play/Pause */}
        {showFullControls && (
          <div className="video-controls-overlay" onClick={togglePlayPause}>
            <i
              className={`pi ${
                isPlaying ? "pi-pause" : "pi-play"
              } play-pause-icon`}
            ></i>
          </div>
        )}

        {/* Barra de Controles */}
        <div
          className={`video-player-controls ${
            showFullControls ? "visible" : "hidden"
          }`}
          onMouseEnter={(e) => e.stopPropagation()} // Evita que el ratón se vaya del contenedor y oculte los controles
        >
          {/* Fila de controles inferiores */}
          <div className="video-controls-bottom">
            {/* Botón de Play/Pause */}
            <Button
              icon={isPlaying ? "pi pi-pause" : "pi pi-play"}
              onClick={togglePlayPause}
              className="p-button-rounded p-button-text p-button-lg p-mr-2"
              style={{ width: "30px", height: "30px", padding: 0 }}
            />

            {/* Tiempo Actual */}
            <div className="time-display">{formatTime(currentTime)}</div>

            {/* Barra de Progreso (Slider) */}
            <div className="time-progress-bar">
              <Slider
                value={
                  videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0
                }
                onChange={(e) => {
                  if (videoRef.current) {
                    const newTime = (e.value * videoDuration) / 100;
                    videoRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                  }
                }}
                className="time-slider"
                step={0.1}
              />
            </div>

            {/* Duración Total */}
            <div className="time-display">{formatTime(videoDuration)}</div>

            {/* Control de Volumen */}
            <div className="volume-control">
              <Button
                icon={
                  isMuted || volume === 0
                    ? "pi pi-volume-off"
                    : volume < 50
                    ? "pi pi-volume-down"
                    : "pi pi-volume-up"
                }
                onClick={() => {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  if (videoRef.current) {
                    videoRef.current.muted = newMuted;
                  }
                }}
                className="p-button-rounded p-button-text p-button-lg p-mr-2"
                style={{ width: "30px", height: "30px", padding: 0 }}
              />
              <Slider
                value={volume}
                onChange={(e) => {
                  setVolume(e.value);
                  if (videoRef.current) {
                    videoRef.current.volume = e.value / 100;
                    if (e.value > 0 && isMuted) {
                      setIsMuted(false);
                      videoRef.current.muted = false;
                    }
                  }
                }}
                className="volume-slider"
                step={1}
                min={0}
                max={100}
              />
            </div>

            {/* Botón de Pantalla Completa */}
            <Button
              icon={isFullScreen ? "pi pi-window-minimize" : "pi pi-arrows-alt"}
              onClick={toggleFullScreen}
              className="p-button-rounded p-button-text p-button-lg"
              style={{
                width: "30px",
                height: "30px",
                padding: 0,
                marginLeft: "0.5rem",
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
          onEnded={onEnded} // Reutilizar el handler de fin
        />
      </Dialog>
    </Card>
  );
};

export default VideoPlayer;
