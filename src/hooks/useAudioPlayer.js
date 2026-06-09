import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook personalizado para manejar el reproductor de audio con persistencia
 * Guarda y recupera la posición de reproducción desde localStorage
 */
const useAudioPlayer = () => {
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [pendingAudio, setPendingAudio] = useState(null);
  const audioRef = useRef(null);
  const saveIntervalRef = useRef(null);

  /**
   * Cargar posición guardada de localStorage
   * @param {string} filename - Nombre del archivo de audio
   * @returns {Object|null} - Objeto con position y duration o null
   */
  const loadSavedPosition = useCallback((filename) => {
    try {
      const saved = localStorage.getItem(`audio_${filename}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error al cargar posición guardada:', error);
      return null;
    }
  }, []);

  /**
   * Guardar posición en localStorage
   * @param {string} filename - Nombre del archivo de audio
   * @param {number} pos - Posición actual en segundos
   * @param {number} dur - Duración total en segundos
   * @param {string} title - Título del audio (opcional)
   */
  const savePosition = useCallback((filename, pos, dur, title) => {
    try {
      if (filename && pos >= 0) {
        localStorage.setItem(`audio_${filename}`, JSON.stringify({
          position: pos,
          duration: dur,
          title: title,
          lastPlayed: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error al guardar posición:', error);
    }
  }, []);

  /**
   * Formatear tiempo en formato MM:SS o HH:MM:SS
   * @param {number} seconds - Segundos a formatear
   * @returns {string} - Tiempo formateado
   */
  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Reproducir un audio
   * @param {Object} audio - Objeto de audio con filename y demás propiedades
   */
  const play = useCallback((audio) => {
    if (!audio) return;

    const savedPosition = loadSavedPosition(audio.filename);
    
    // Si hay una posición guardada mayor a 10 segundos, preguntar si quiere continuar
    if (savedPosition && savedPosition.position > 10) {
      setPendingAudio(audio);
      setShowResumeDialog(true);
      return;
    }

    // Iniciar reproducción desde el inicio
    setCurrentAudio(audio);
    setIsPlaying(true);
    setPosition(0);
    setDuration(audio.duration || 0);
  }, [loadSavedPosition]);

  /**
   * Reproducir desde una posición específica
   * @param {Object} audio - Objeto de audio
   * @param {number} startPosition - Posición inicial en segundos
   */
  const playFromPosition = useCallback((audio, startPosition) => {
    setCurrentAudio(audio);
    setIsPlaying(true);
    setPosition(startPosition);
    setDuration(audio.duration || 0);
    setShowResumeDialog(false);
    setPendingAudio(null);
  }, []);

  /**
   * Pausar la reproducción actual
   */
  const pause = useCallback(() => {
    setIsPlaying(false);
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
    // Guardar posición final al pausar
    if (currentAudio) {
      savePosition(currentAudio.filename, position, duration, currentAudio.title);
    }
  }, [currentAudio, position, duration, savePosition]);

  /**
   * Reanudar la reproducción
   */
  const resume = useCallback(() => {
    setIsPlaying(true);
  }, []);

  /**
   * Detener completamente y cerrar el reproductor
   */
  const stop = useCallback(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
    // Guardar posición final antes de cerrar
    if (currentAudio) {
      savePosition(currentAudio.filename, position, duration, currentAudio.title);
    }
    setIsPlaying(false);
    setCurrentAudio(null);
    setPosition(0);
    setDuration(0);
  }, [currentAudio, position, duration, savePosition]);

  /**
   * Buscar una posición específica en el audio
   * @param {number} time - Tiempo en segundos
   */
  const seek = useCallback((time) => {
    setPosition(Math.max(0, Math.min(time, duration)));
  }, [duration]);

  /**
   * Actualizar la posición actual
   * @param {number} newPos - Nueva posición en segundos
   */
  const updatePosition = useCallback((newPos) => {
    setPosition(newPos);
  }, []);

  /**
   * Actualizar la duración del audio
   * @param {number} newDuration - Nueva duración en segundos
   */
  const updateDuration = useCallback((newDuration) => {
    setDuration(newDuration);
  }, []);

  /**
   * Efecto para guardar posición periódicamente mientras se reproduce
   */
  useEffect(() => {
    if (isPlaying && currentAudio) {
      // Guardar posición cada 5 segundos
      saveIntervalRef.current = setInterval(() => {
        savePosition(currentAudio.filename, position, duration, currentAudio.title);
      }, 5000);

      return () => {
        if (saveIntervalRef.current) {
          clearInterval(saveIntervalRef.current);
          saveIntervalRef.current = null;
        }
      };
    }
  }, [isPlaying, currentAudio, position, duration, savePosition]);

  /**
   * Efecto para guardar posición al desmontar o cuando cambia el estado
   */
  useEffect(() => {
    return () => {
      if (currentAudio && position > 0) {
        savePosition(currentAudio.filename, position, duration, currentAudio.title);
      }
    };
  }, [currentAudio, position, duration, savePosition]);

  return {
    currentAudio,
    isPlaying,
    position,
    duration,
    showResumeDialog,
    pendingAudio,
    formatTime,
    play,
    playFromPosition,
    pause,
    resume,
    stop,
    seek,
    updatePosition,
    updateDuration,
    setShowResumeDialog,
    loadSavedPosition,
    savePosition
  };
};

export default useAudioPlayer;
