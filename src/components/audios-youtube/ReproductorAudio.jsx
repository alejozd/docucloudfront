import React, { useEffect, useRef } from 'react';
import { Slider } from 'primereact/slider';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Knob } from 'primereact/knob';

/**
 * Reproductor de audio fijo en la parte inferior
 * Con persistencia de posición y controles completos
 */
const ReproductorAudio = ({ 
  currentAudio, 
  isPlaying, 
  position, 
  duration, 
  formatTime,
  onPlayPause, 
  onStop, 
  onSeek, 
  onVolumeChange,
  showResumeDialog,
  pendingAudio,
  onResumeFromStart,
  onResumeFromPosition,
  onCloseDialog
}) => {
  const audioElementRef = useRef(null);
  const [volume, setVolume] = React.useState(80);
  const [localPosition, setLocalPosition] = React.useState(0);

  // Sincronizar posición local con la del hook
  useEffect(() => {
    if (currentAudio) {
      setLocalPosition(position);
    }
  }, [position, currentAudio]);

  // Manejar cambios en el elemento de audio
  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl || !currentAudio) return;

    const handleTimeUpdate = () => {
      setLocalPosition(audioEl.currentTime);
    };

    const handleLoadedMetadata = () => {
      setLocalPosition(audioEl.currentTime);
    };

    const handleEnded = () => {
      // Audio terminó, guardar posición final
      if (onStop) onStop();
    };

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    audioEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioEl.addEventListener('ended', handleEnded);

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioEl.removeEventListener('ended', handleEnded);
    };
  }, [currentAudio, onStop]);

  // Controlar reproducción cuando cambia isPlaying
  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl || !currentAudio) return;

    if (isPlaying) {
      audioEl.play().catch(error => {
        console.error('Error al reproducir:', error);
      });
    } else {
      audioEl.pause();
    }
  }, [isPlaying, currentAudio]);

  // Cambiar volumen
  const handleVolumeChange = (value) => {
    setVolume(value);
    if (audioElementRef.current) {
      audioElementRef.current.volume = value / 100;
    }
    if (onVolumeChange) {
      onVolumeChange(value);
    }
  };

  // Buscar posición
  const handleSeekChange = (value) => {
    setLocalPosition(value);
  };

  const handleSeekEnd = (value) => {
    if (onSeek) {
      onSeek(value);
    }
    if (audioElementRef.current) {
      audioElementRef.currentTime = value;
    }
  };

  // Si no hay audio seleccionado, no mostrar el reproductor
  if (!currentAudio) {
    return null;
  }

  const footerContent = (
    <div className="flex justify-content-end gap-2">
      <Button 
        label="Cerrar" 
        icon="pi pi-times" 
        className="p-button-text p-button-sm" 
        onClick={onStop} 
      />
    </div>
  );

  return (
    <>
      {/* Elemento de audio oculto */}
      {currentAudio && currentAudio.streamUrl && (
        <audio
          ref={audioElementRef}
          src={currentAudio.streamUrl}
          preload="metadata"
          style={{ display: 'none' }}
        />
      )}

      {/* Reproductor fijo en la parte inferior */}
      <div className="audio-player-fixed shadow-4 border-top-1 border-surface-200 dark:border-surface-700">
        <div className="flex flex-column md:flex-row align-items-center gap-3 p-3 w-full">
          {/* Información del audio */}
          <div className="flex align-items-center gap-3 flex-1 w-full md:w-auto">
            <div className="w-3rem h-3rem bg-primary border-circle flex align-items-center justify-content-center flex-shrink-0">
              <i className="pi pi-music text-white text-xl"></i>
            </div>
            <div className="flex flex-column overflow-hidden">
              <span className="font-medium text-sm truncate">
                {currentAudio.filename || 'Audio desconocido'}
              </span>
              <span className="text-xs text-color-secondary">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Controles de reproducción */}
          <div className="flex align-items-center gap-2 w-full md:w-auto justify-content-center">
            <Button
              icon={isPlaying ? "pi pi-pause" : "pi pi-play"}
              className="p-button-rounded p-button-lg p-button-success"
              onClick={onPlayPause}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            />
            <Button
              icon="pi pi-stop"
              className="p-button-rounded p-button-secondary"
              onClick={onStop}
              aria-label="Detener"
              tooltip="Detener y cerrar"
            />
          </div>

          {/* Barra de progreso */}
          <div className="flex align-items-center gap-2 flex-1 w-full md:w-auto">
            <span className="text-xs text-color-secondary min-w-3rem text-right">
              {formatTime(localPosition)}
            </span>
            <Slider
              value={localPosition}
              onChange={handleSeekChange}
              onChangeEnd={handleSeekEnd}
              min={0}
              max={duration || 100}
              step={1}
              className="flex-1 w-full"
            />
            <span className="text-xs text-color-secondary min-w-3rem">
              {formatTime(duration)}
            </span>
          </div>

          {/* Control de volumen */}
          <div className="flex align-items-center gap-2 w-full md:w-auto justify-content-end">
            <i className="pi pi-volume-down text-color-secondary"></i>
            <Knob
              value={volume}
              onChange={handleVolumeChange}
              size="40"
              min={0}
              max={100}
              step={5}
              valueTemplate={(val) => `${val}%`}
              strokeWidth={8}
            />
          </div>
        </div>
      </div>

      {/* Dialog para preguntar si continuar desde posición guardada */}
      <Dialog
        header="Continuar Reproducción"
        visible={showResumeDialog}
        modal
        style={{ width: '400px' }}
        footer={footerContent}
        onHide={onCloseDialog}
      >
        <div className="flex flex-column gap-3 p-2">
          <p className="m-0">
            Ya has escuchado este audio anteriormente.
          </p>
          <p className="m-0 font-medium">
            ¿Deseas continuar desde {formatTime(position)} o empezar desde el inicio?
          </p>
          <div className="flex justify-content-end gap-2 mt-3">
            <Button
              label="Empezar desde el Inicio"
              icon="pi pi-refresh"
              className="p-button-text"
              onClick={() => {
                if (onResumeFromStart) onResumeFromStart();
              }}
            />
            <Button
              label={`Continuar desde ${formatTime(position)}`}
              icon="pi pi-forward"
              onClick={() => {
                if (onResumeFromPosition) onResumeFromPosition();
              }}
            />
          </div>
        </div>
      </Dialog>

      {/* Estilos CSS inline para el reproductor fijo */}
      <style>{`
        .audio-player-fixed {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--surface-card);
          z-index: 1000;
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .min-w-3rem {
          min-width: 3rem;
        }
      `}</style>
    </>
  );
};

export default ReproductorAudio;
