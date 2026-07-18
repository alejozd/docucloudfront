import React, { useRef, useState, useEffect } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import '../../styles/AudioPlayer.css';
import { Button } from 'primereact/button';
import audioDownloadService from '../../services/audioDownloadService';
import { useDarkMode } from '../../hooks/useDarkMode';

// Clave para guardar velocidad en localStorage
const SPEED_STORAGE_KEY = 'audio_playback_speed';

/**
 * Reproductor de audio fijo en la parte inferior usando react-h5-audio-player
 * Con persistencia de posición, controles modernos y velocidad de reproducción
 */
const ReproductorAudio = ({
  currentAudio,
  onStop,
  showResumeDialog,
  pendingAudio,
  onResumeFromStart,
  onResumeFromPosition,
  onCloseDialog
}) => {
  const playerRef = useRef(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  // Estado para el token y URL del audio - SE GENERAN UNA SOLA VEZ
  const [audioToken, setAudioToken] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [currentFilename, setCurrentFilename] = useState(null);

  // Cargar velocidad guardada al montar
  useEffect(() => {
    const savedSpeed = localStorage.getItem(SPEED_STORAGE_KEY);
    if (savedSpeed) {
      const parsed = parseFloat(savedSpeed);
      if ([0.5, 0.75, 1, 1.25, 1.5, 2].includes(parsed)) {
        setPlaybackSpeed(parsed);
      }
    }
  }, []);

  // Aplicar velocidad al elemento de audio cuando cambia
  useEffect(() => {
    if (playerRef.current?.audio?.current) {
      playerRef.current.audio.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Generar token SOLO cuando cambia el audio seleccionado (no en cada play/pause)
  useEffect(() => {
    const loadAudioToken = async () => {
      if (currentAudio && currentAudio.filename) {
        // Solo generar nuevo token si el filename cambió
        if (currentFilename === currentAudio.filename && audioUrl) {
          return; // Ya tenemos un token válido para este audio
        }
        
        try {
          const tokenData = await audioDownloadService.generateStreamToken(currentAudio.filename);
          
          if (!tokenData.streamUrl) {
            console.error('❌ Stream URL es null o undefined');
            return;
          }
          
          setAudioToken(tokenData.token);
          setAudioUrl(tokenData.streamUrl);
          setCurrentFilename(currentAudio.filename);
          
          // Resetear estado de reproducción
          setIsPlaying(false);
        } catch (error) {
          console.error('❌ Error generando token:', error);
        }
      } else {
        // Limpiar cuando no hay audio
        setAudioUrl(null);
        setAudioToken(null);
        setCurrentFilename(null);
      }
    };
    
    loadAudioToken();
  }, [currentAudio?.filename]);

  // Manejar cambio de tiempo y guardar posición en localStorage
  const handleTimeUpdate = (e) => {
    if (!currentAudio) return;
    
    const position = e.target.currentTime;
    const duration = e.target.duration;
    
    if (duration && !isNaN(duration)) {
      localStorage.setItem(`audio_${currentAudio.filename}`, JSON.stringify({
        position,
        duration,
        lastPlayed: new Date().toISOString()
      }));
    }
  };

  // Cambiar velocidad y guardar en localStorage
  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value);
    setPlaybackSpeed(newSpeed);
    localStorage.setItem(SPEED_STORAGE_KEY, newSpeed.toString());
    if (playerRef.current?.audio?.current) {
      playerRef.current.audio.current.playbackRate = newSpeed;
    }
  };

  // Manejar descarga (genera un token temporal y abre la descarga en una nueva pestaña)
  const handleDownload = async () => {
    if (!currentAudio || !currentAudio.filename) return;

    try {
      const tokenData = await audioDownloadService.generateStreamToken(currentAudio.filename);
      if (!tokenData?.streamUrl) {
        console.error('No se pudo generar el token de descarga');
        return;
      }
      window.open(`${tokenData.streamUrl}&download=true`, '_blank');
    } catch (error) {
      console.error('Error descargando audio:', error);
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
      {/* Reproductor fijo en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 z-50 shadow-lg">
        <AudioPlayer
          ref={playerRef}
          src={audioUrl || ''}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          showJumpControls={true}
          showSkipControls={false}
          progressJumpSteps={{ backward: 15000, forward: 15000 }}
          progressUpdateInterval={100}
          layout="horizontal"
          autoPlayAfterSrcChange={true}
          preload="metadata"
          timeFormat="auto"
          customAdditionalControls={[
            // Botón de velocidad
            <select 
              key="speed-select"
              value={playbackSpeed}
              onChange={handleSpeedChange}
              className="p-dropdown p-component audio-speed-select"
              style={{ minWidth: '60px' }}
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>,
            // Botón de descargar
            <Button
              key="download-btn"
              icon="pi pi-download"
              className="p-button-text p-button-rounded p-button-sm"
              onClick={handleDownload}
              tooltip="Descargar MP3"
            />,
            // Toggle Dark Mode
            <Button
              key="theme-toggle"
              icon={isDarkMode ? "pi pi-sun" : "pi pi-moon"}
              className="p-button-text p-button-rounded p-button-sm"
              onClick={toggleDarkMode}
              tooltip={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
            />
          ]}
          header={
            <div className="flex align-items-center gap-3 px-2">
              <div className="w-3rem h-3rem bg-primary border-circle flex align-items-center justify-content-center flex-shrink-0">
                <i className="pi pi-music text-white text-xl"></i>
              </div>
              <div className="flex flex-column overflow-hidden">
                <span className="font-medium text-sm truncate">
                  {currentAudio.title || currentAudio.filename || 'Audio desconocido'}
                </span>
              </div>
            </div>
          }
        />
      </div>

      {/* Dialog para preguntar si continuar desde posición guardada */}
      {showResumeDialog && pendingAudio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex align-items-center justify-content-center z-60">
          <div className="bg-surface-card p-4 border-round shadow-4" style={{ width: '400px', maxWidth: '90%' }}>
            <h3 className="text-xl font-semibold mb-3">Continuar Reproducción</h3>
            <div className="flex flex-column gap-3">
              <p className="m-0">
                Ya has escuchado este audio anteriormente.
              </p>
              <p className="m-0 font-medium">
                ¿Deseas continuar desde donde lo dejaste o empezar desde el inicio?
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
                  label="Continuar"
                  icon="pi pi-forward"
                  onClick={() => {
                    if (onResumeFromPosition) onResumeFromPosition();
                  }}
                />
                <Button
                  label="Cerrar"
                  icon="pi pi-times"
                  className="p-button-text"
                  onClick={onCloseDialog}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReproductorAudio;
