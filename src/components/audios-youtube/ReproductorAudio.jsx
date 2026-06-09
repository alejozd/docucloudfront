import React, { useEffect, useRef, useState } from 'react';
import { Slider } from 'primereact/slider';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import audioDownloadService from '../../services/audioDownloadService';

// Clave para guardar velocidad en localStorage
const SPEED_STORAGE_KEY = 'audio_playback_speed';

const toSafeNumber = (value, fallback = 0) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const getSliderEventValue = (eventOrValue) => {
  if (eventOrValue && typeof eventOrValue === 'object' && 'value' in eventOrValue) {
    return eventOrValue.value;
  }
  return eventOrValue;
};

/**
 * Formatea el tiempo en HH:MM:SS o MM:SS según corresponda
 */
const formatTimeExtended = (seconds) => {
  const safeSeconds = toSafeNumber(seconds);
  if (safeSeconds <= 0) return '00:00';

  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = Math.floor(safeSeconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Reproductor de audio fijo en la parte inferior
 * Con persistencia de posición, controles modernos y velocidad de reproducción
 */
const ReproductorAudio = ({
  currentAudio,
  isPlaying,
  position,
  duration,
  onPlayPause,
  onStop,
  onSeek,
  onVolumeChange,
  onDurationChange,
  showResumeDialog,
  pendingAudio,
  onResumeFromStart,
  onResumeFromPosition,
  onCloseDialog
}) => {
  const audioElementRef = useRef(null);
  const [volume, setVolume] = useState(80);
  const [localPosition, setLocalPosition] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Opciones de velocidad
  const speedOptions = [
    { label: '1x', value: 1 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 }
  ];

  // Cargar velocidad y volumen guardados al montar
  useEffect(() => {
    const savedSpeed = localStorage.getItem(SPEED_STORAGE_KEY);
    if (savedSpeed) {
      const parsed = parseFloat(savedSpeed);
      if ([1, 1.25, 1.5, 2].includes(parsed)) {
        setPlaybackSpeed(parsed);
      }
    }
    // Cargar volumen guardado
    const savedVolume = localStorage.getItem('audio_volume');
    if (savedVolume) {
      const parsedVolume = parseInt(savedVolume, 10);
      if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 100) {
        setVolume(parsedVolume);
      }
    }
  }, []);

  // Aplicar velocidad al elemento de audio cuando cambia
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sincronizar posición local con la del hook
  useEffect(() => {
    if (currentAudio) {
      setLocalPosition(toSafeNumber(position));
    }
  }, [position, currentAudio]);

  // Manejar cambios en el elemento de audio
  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl || !currentAudio) return;

    const handleTimeUpdate = () => {
      setLocalPosition(toSafeNumber(audioEl.currentTime));
    };

    const handleLoadedMetadata = () => {
      const dur = audioEl.duration;
      console.log('Duración calculada:', dur, 'tipo:', typeof dur);
      if (dur && !isNaN(dur) && isFinite(dur)) {
        // Actualizar la duración local
        setDuration(dur);
        
        // También actualizar la duración del padre si existe el callback
        if (onDurationChange) {
          onDurationChange(dur);
        }
        
        // Solo actualizamos la posición local
        setLocalPosition(toSafeNumber(audioEl.currentTime));
      } else {
        console.warn('Duración inválida, usando fallback');
        setLocalPosition(toSafeNumber(audioEl.currentTime));
      }
    };

    const handleEnded = () => {
      if (onStop) onStop();
    };

    const handleError = (e) => {
      const error = audioEl.error;
      if (error) {
        console.error('=== ERROR DE AUDIO ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        let mensaje = 'Error al reproducir el audio';
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            mensaje = 'Reproducción abortada';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            mensaje = 'Error de red al cargar el audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            mensaje = 'Error al decodificar el audio';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            mensaje = 'URL de audio no soportada o inválida';
            break;
          default:
            mensaje = 'Error desconocido al reproducir';
            break;
        }
        console.error(mensaje);
      }
    };

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    audioEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioEl.addEventListener('ended', handleEnded);
    audioEl.addEventListener('error', handleError);

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioEl.removeEventListener('ended', handleEnded);
      audioEl.removeEventListener('error', handleError);
    };
  }, [currentAudio, onStop]);

  // Controlar reproducción cuando cambia isPlaying y currentAudio
  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl || !currentAudio) return;

    const attemptPlay = async () => {
      try {
        // Verificar si el audio ya está listo
        if (audioEl.readyState >= 2) { // HAVE_CURRENT_DATA o superior
          if (isPlaying) {
            await audioEl.play();
          }
        } else {
          // Esperar a que el audio esté listo
          const canPlayHandler = async () => {
            if (isPlaying) {
              try {
                await audioEl.play();
              } catch (error) {
                if (error.name !== 'AbortError') {
                  console.error('Error al reproducir:', error);
                }
              }
            }
            audioEl.removeEventListener('canplay', canPlayHandler);
          };
          
          audioEl.addEventListener('canplay', canPlayHandler);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error al reproducir:', error);
        }
      }
    };

    if (isPlaying) {
      attemptPlay();
    } else {
      audioEl.pause();
    }
  }, [isPlaying, currentAudio]);

  // Manejar carga del audio cuando cambia currentAudio
  useEffect(() => {
    const loadAudio = async () => {
      if (currentAudio && currentAudio.filename) {
        console.log('=== DEBUG REPRODUCTOR - INICIO ===');
        console.log('currentAudio:', currentAudio);
        
        try {
          console.log('📞 Llamando a generateStreamToken...');
          const tokenData = await audioDownloadService.generateStreamToken(currentAudio.filename);
          
          console.log('🎫 Token data completo:', JSON.stringify(tokenData, null, 2));
          console.log('🔗 Stream URL:', tokenData.streamUrl);
          
          // Verificar que la URL sea válida
          if (!tokenData.streamUrl) {
            console.error('❌ Stream URL es null o undefined');
            return;
          }
          
          const audioEl = audioElementRef.current;
          if (audioEl) {
            console.log('🎵 Estableciendo src del elemento audio');
            console.log('🎵 URL completa:', tokenData.streamUrl);
            
            audioEl.src = tokenData.streamUrl;
            
            // Agregar evento de error más detallado
            audioEl.onerror = (e) => {
              console.error('❌ Error en elemento audio:', e);
              console.error('❌ Error code:', audioEl.error?.code);
              console.error('❌ Error message:', audioEl.error?.message);
              console.error('❌ URL que falló:', audioEl.src);
            };
            
            // Agregar evento de carga exitosa
            audioEl.oncanplay = () => {
              console.log('✅ Audio listo para reproducir');
              console.log('✅ Duración:', audioEl.duration);
            };
            
            audioEl.load();
            console.log('🎵 load() llamado');
          } else {
            console.error('❌ audioElementRef.current es null');
          }
        } catch (error) {
          console.error('❌ Error cargando audio:', error);
          console.error('❌ Error stack:', error.stack);
        }
        
        console.log('=== DEBUG REPRODUCTOR - FIN ===');
      }
    };
    
    loadAudio();
  }, [currentAudio]);

  // Cambiar volumen y guardar en localStorage
  const handleVolumeChange = (newValue) => {
    const numValue = typeof newValue === 'number' ? newValue : 0;
    setVolume(numValue);
    if (audioElementRef.current) {
      audioElementRef.current.volume = numValue / 100;
    }
    if (onVolumeChange) {
      onVolumeChange(numValue);
    }
    // Guardar en localStorage
    localStorage.setItem('audio_volume', numValue.toString());
  };

  // Buscar posición
  const handleSeekChange = (event) => {
    const newPosition = toSafeNumber(getSliderEventValue(event));
    setLocalPosition(newPosition);
  };

  const handleSeekEnd = (event) => {
    const newPosition = toSafeNumber(getSliderEventValue(event));
    if (onSeek) {
      onSeek(newPosition);
    }
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = newPosition;
    }
  };

  // Saltar adelante/atras 15 segundos
  const skipForward = () => {
    if (audioElementRef.current) {
      const safeDuration = toSafeNumber(duration, 100);
      const newPos = Math.min(toSafeNumber(audioElementRef.current.currentTime) + 15, safeDuration);
      audioElementRef.current.currentTime = newPos;
      setLocalPosition(newPos);
      if (onSeek) onSeek(newPos);
    }
  };

  const skipBackward = () => {
    if (audioElementRef.current) {
      const newPos = Math.max(toSafeNumber(audioElementRef.current.currentTime) - 15, 0);
      audioElementRef.current.currentTime = newPos;
      setLocalPosition(newPos);
      if (onSeek) onSeek(newPos);
    }
  };

  // Cambiar velocidad y guardar en localStorage
  const handleSpeedChange = (e) => {
    const newSpeed = e.value;
    setPlaybackSpeed(newSpeed);
    localStorage.setItem(SPEED_STORAGE_KEY, newSpeed.toString());
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = newSpeed;
    }
  };

  // Si no hay audio seleccionado, no mostrar el reproductor
  if (!currentAudio) {
    return null;
  }

  const sliderValue = toSafeNumber(localPosition);
  const sliderMax = Math.max(toSafeNumber(duration, 100), 1);

  console.log('Slider value:', sliderValue, typeof sliderValue);
  console.log('Slider max:', sliderMax, typeof sliderMax);

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
      {/* Elemento de audio oculto con manejador de errores */}
      {currentAudio && currentAudio.filename && (
        <audio
          ref={audioElementRef}
          preload="metadata"
          style={{ display: 'none' }}
          crossOrigin="anonymous"
        />
      )}

      {/* Reproductor fijo en la parte inferior */}
      <div className="audio-player-fixed shadow-4 border-top-1 border-surface-200 dark:border-surface-700">
        <div className="flex flex-column lg:flex-row align-items-center gap-3 p-3 w-full">
          {/* Información del audio */}
          <div className="flex align-items-center gap-3 flex-1 w-full lg:w-auto">
            <div className="w-3rem h-3rem bg-primary border-circle flex align-items-center justify-content-center flex-shrink-0">
              <i className="pi pi-music text-white text-xl"></i>
            </div>
            <div className="flex flex-column overflow-hidden">
              <span className="font-medium text-sm truncate">
                {currentAudio.title || currentAudio.filename || 'Audio desconocido'}
              </span>
              <span className="text-xs text-color-secondary">
                {formatTimeExtended(sliderMax)}
              </span>
            </div>
          </div>

          {/* Controles de reproducción principales */}
          <div className="flex align-items-center gap-2 w-full lg:w-auto justify-content-center">
            <Button
              icon="pi pi-step-backward"
              className="p-button-rounded p-button-outlined p-button-sm"
              onClick={skipBackward}
              aria-label="Retroceder 15s"
              tooltip="Retroceder 15s"
            />
            <Button
              icon={isPlaying ? "pi pi-pause" : "pi pi-play"}
              className="p-button-rounded p-button-lg p-button-success"
              onClick={onPlayPause}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            />
            <Button
              icon="pi pi-step-forward"
              className="p-button-rounded p-button-outlined p-button-sm"
              onClick={skipForward}
              aria-label="Adelantar 15s"
              tooltip="Adelantar 15s"
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
          <div className="flex align-items-center gap-2 flex-1 w-full lg:w-auto">
            <span className="text-xs text-color-secondary min-w-4rem text-right font-mono">
              {formatTimeExtended(sliderValue)}
            </span>
            <Slider
              value={sliderValue}
              onChange={handleSeekChange}
              onChangeEnd={handleSeekEnd}
              min={0}
              max={sliderMax}
              step={1}
              className="flex-1 w-full"
            />
            <span className="text-xs text-color-secondary min-w-4rem font-mono">
              {formatTimeExtended(sliderMax)}
            </span>
          </div>

          {/* Controles adicionales: Velocidad y Volumen */}
          <div className="flex align-items-center gap-3 w-full lg:w-auto justify-content-end">
            {/* Control de velocidad */}
            <div className="flex align-items-center gap-2">
              <i className="pi pi-fast-forward text-color-secondary text-sm"></i>
              <Dropdown
                value={playbackSpeed}
                options={speedOptions}
                onChange={handleSpeedChange}
                className="w-5rem"
                panelClassName="text-xs"
              />
            </div>

            {/* Control de volumen */}
            <div className="flex align-items-center gap-2" style={{ minWidth: '120px' }}>
              <i className="pi pi-volume-down text-color-secondary" style={{ fontSize: '0.9rem' }}></i>
              <Slider 
                value={volume} 
                onChange={(e) => handleVolumeChange(e.value)}
                className="w-8rem"
                min={0}
                max={100}
              />
              <span style={{ fontSize: '0.8rem', minWidth: '35px' }}>{volume}%</span>
            </div>
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
            ¿Deseas continuar desde {formatTimeExtended(toSafeNumber(position))} o empezar desde el inicio?
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
              label={`Continuar desde ${formatTimeExtended(toSafeNumber(position))}`}
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

        .min-w-4rem {
          min-width: 4rem;
        }

        .font-mono {
          font-family: 'Courier New', Courier, monospace;
        }
      `}</style>
    </>
  );
};

export default ReproductorAudio;
