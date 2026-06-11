import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import PasswordModal from '../../components/audios-youtube/PasswordModal';
import DescargaForm from '../../components/audios-youtube/DescargaForm';
import ListaAudios from '../../components/audios-youtube/ListaAudios';
import ReproductorAudio from '../../components/audios-youtube/ReproductorAudio';
import ProcesamientoModal from '../../components/audios-youtube/ProcesamientoModal';
import useAudioPlayer from '../../hooks/useAudioPlayer';
import audioDownloadService from '../../services/audioDownloadService';

// Obtener API Key desde variables de entorno
const REACT_APP_API_KEY = process.env.REACT_APP_API_KEY;

/**
 * Página principal para descarga de audios desde YouTube
 * Integrada bajo "Utilidades" → "Audios YouTube"
 */
const AudiosYouTubePage = () => {
  const toastRef = useRef(null);
  
  // Estado de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  
  // Estado de archivos
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  
  // Hook del reproductor
  const player = useAudioPlayer();

  // Estado para el modal de procesamiento
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processStatusMessage, setProcessStatusMessage] = useState('');
  const [processError, setProcessError] = useState(null);
  const processPollingRef = useRef(null);

  /**
   * Verificar si ya está autenticado en sessionStorage
   */
  useEffect(() => {
    const authStatus = sessionStorage.getItem('audioDownloadAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setShowPasswordModal(false);
    }
  }, []);

  /**
   * Cargar lista de archivos
   */
  const loadFiles = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setFilesLoading(true);
    try {
      const response = await audioDownloadService.listFiles();
      const data = response.data;
      
      // Procesar archivos y agregar URLs de streaming y descarga
      const processedFiles = (data.files || data).map(file => ({
        ...file,
        filename: file.filename || file.name || file.titulo,
        size: file.size || file.tamano,
        createdAt: file.createdAt || file.fecha || file.created_at,
        streamUrl: audioDownloadService.getStreamUrl(file.filename || file.name),
        downloadUrl: audioDownloadService.getStreamUrl(file.filename || file.name)
      }));
      
      setFiles(processedFiles);
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los archivos descargados',
        life: 3000
      });
    } finally {
      setFilesLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Cargar archivos al autenticarse
   */
  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    }
  }, [isAuthenticated, loadFiles]);

  /**
   * Manejar autenticación
   */
  const handleAuthenticate = (password) => {
    setAuthLoading(true);
    
    // Validar que el password coincida con REACT_APP_API_KEY
    setTimeout(() => {
      if (REACT_APP_API_KEY && password === REACT_APP_API_KEY) {
        setIsAuthenticated(true);
        setShowPasswordModal(false);
        sessionStorage.setItem('audioDownloadAuth', 'true');
        toastRef.current?.show({
          severity: 'success',
          summary: 'Autenticación Exitosa',
          detail: 'Bienvenido al módulo de descarga de audios',
          life: 3000
        });
      } else if (!REACT_APP_API_KEY) {
        // Si no hay REACT_APP_API_KEY definida, permitir acceso pero mostrar advertencia
        console.warn('⚠️ REACT_APP_API_KEY no está definida. Permitiendo acceso sin validación.');
        setIsAuthenticated(true);
        setShowPasswordModal(false);
        sessionStorage.setItem('audioDownloadAuth', 'true');
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'REACT_APP_API_KEY no configurada. Las llamadas a la API podrían fallar.',
          life: 5000
        });
      } else {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Autenticación Fallida',
          detail: 'API Key incorrecta',
          life: 3000
        });
      }
      setAuthLoading(false);
    }, 500);
  };

  /**
   * Manejar cierre del modal de password
   */
  const handlePasswordModalHide = () => {
    // No permitir cerrar sin autenticar
    if (!isAuthenticated) {
      setShowPasswordModal(true);
    }
  };

  /**
   * Manejar descarga completada
   */
  const handleDownloadComplete = (data) => {
    toastRef.current?.show({
      severity: 'success',
      summary: 'Descarga Completada',
      detail: `El audio "${data.filename}" se ha descargado exitosamente`,
      life: 5000
    });
    
    // Recargar lista de archivos
    setTimeout(() => loadFiles(), 1000);
  };

  /**
   * Manejar reproducción de audio
   */
  const handlePlay = (audioData) => {
    player.play({
      filename: audioData.filename,
      title: audioData.title || audioData.filename
      // NO incluir streamUrl ni duration, se generarán dinámicamente
    });
  };

  /**
   * Limpiar polling de procesamiento
   */
  const clearProcessPolling = useCallback(() => {
    if (processPollingRef.current) {
      clearTimeout(processPollingRef.current);
      processPollingRef.current = null;
    }
  }, []);

  /**
   * Iniciar polling de estado de procesamiento
   */
  const startProcessStatusPolling = useCallback((taskId) => {
    clearProcessPolling();

    let attempts = 0;
    const maxAttempts = 150; // ~7.5 minutos

    const poll = async () => {
      try {
        attempts++;
        const response = await audioDownloadService.getProcessStatus(taskId);
        const data = response.data;
        const { status, progress, message, error } = data;

        // Terminal success states
        const isCompleted = status === 'completed' ||
                           status === 'finished' ||
                           status === 'success' ||
                           data.completed === true ||
                           data.finished === true;

        if (isCompleted) {
          clearProcessPolling();
          setIsProcessing(false);
          setProcessProgress(100);

          toastRef.current?.show({
            severity: 'success',
            summary: 'Procesamiento Completado',
            detail: 'El audio se ha procesado exitosamente',
            life: 5000
          });

          // Recargar lista para ver nuevos archivos
          loadFiles();

          // Cerrar modal después de un momento
          setTimeout(() => {
            setShowProcessModal(false);
            setSelectedAudio(null);
          }, 2000);

          return;
        }

        if (status === 'failed' || status === 'error' || attempts >= maxAttempts) {
          clearProcessPolling();
          setIsProcessing(false);
          setProcessError(error || (attempts >= maxAttempts ? 'Tiempo de espera agotado' : 'Error en el procesamiento'));
          return;
        }

        // Actualizar progreso
        setProcessProgress(progress || 0);
        setProcessStatusMessage(message || 'Procesando...');

        // Siguiente poll
        processPollingRef.current = setTimeout(poll, 3000);
      } catch (error) {
        console.error('Error al consultar estado de procesamiento:', error);
        // Reintentar en caso de error de red
        processPollingRef.current = setTimeout(poll, 3000);
      }
    };

    poll();
  }, [clearProcessPolling, loadFiles]);

  /**
   * Manejar inicio de procesamiento
   */
  const handleProcessAudio = async (filename, operations) => {
    setIsProcessing(true);
    setProcessProgress(0);
    setProcessStatusMessage('Iniciando procesamiento...');
    setProcessError(null);

    try {
      const response = await audioDownloadService.processAudio(filename, operations);
      const { taskId } = response.data;

      if (taskId) {
        startProcessStatusPolling(taskId);
      } else {
        throw new Error('No se recibió ID de proceso');
      }
    } catch (error) {
      console.error('Error al iniciar procesamiento:', error);
      setIsProcessing(false);
      setProcessError(error.response?.data?.error || 'Error al iniciar the procesamiento');

      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo iniciar el procesamiento de audio',
        life: 3000
      });
    }
  };

  /**
   * Abrir modal de procesamiento
   */
  const openProcessModal = (audio) => {
    setSelectedAudio(audio);
    setShowProcessModal(true);
    setProcessError(null);
    setProcessProgress(0);
    setProcessStatusMessage('');
  };

  /**
   * Manejar eliminación de archivo
   */
  const handleDelete = async (audioData) => {
    try {
      await audioDownloadService.deleteFile(audioData.filename);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Archivo Eliminado',
        detail: `El archivo "${audioData.filename}" ha sido eliminado`,
        life: 3000
      });
      
      // Recargar lista
      loadFiles();
      
      // Si el audio eliminado es el que se está reproduciendo, detener
      if (player.currentAudio?.filename === audioData.filename) {
        player.stop();
      }
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el archivo',
        life: 3000
      });
    }
  };

  /**
   * Manejar play/pause desde el reproductor
   */
  const handlePlayPause = () => {
    if (player.isPlaying) {
      player.pause();
    } else {
      player.resume();
    }
  };

  /**
   * Manejar reanudar desde el inicio
   */
  const handleResumeFromStart = () => {
    if (player.pendingAudio) {
      player.playFromPosition(player.pendingAudio, 0);
    }
  };

  /**
   * Manejar reanudar desde posición guardada
   */
  const handleResumeFromPosition = () => {
    if (player.pendingAudio && player.position) {
      player.playFromPosition(player.pendingAudio, player.position);
    }
  };

  /**
   * Manejar cierre del dialog de resume
   */
  const handleCloseResumeDialog = () => {
    player.setShowResumeDialog(false);
  };

  /**
   * Limpiar al desmontar
   */
  useEffect(() => {
    return () => clearProcessPolling();
  }, [clearProcessPolling]);

  // Mostrar modal de password si no está autenticado
  if (!isAuthenticated) {
    return (
      <>
        <Toast ref={toastRef} />
        <PasswordModal
          visible={showPasswordModal}
          onHide={handlePasswordModalHide}
          onAuthenticate={handleAuthenticate}
          loading={authLoading}
        />
      </>
    );
  }

  return (
    <div className="audios-youtube-page p-4 pb-8">
      <Toast ref={toastRef} />
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-900 mb-2">
          <i className="pi pi-youtube text-red-500 mr-2"></i>
          Descargar Audio desde YouTube
        </h1>
        <p className="text-color-secondary m-0">
          Descarga audios de YouTube y reprodúcelos con persistencia de posición
        </p>
      </div>

      {/* Card de descarga */}
      <Card 
        title="Nueva Descarga" 
        className="mb-4 shadow-2"
      >
        <DescargaForm 
          onDownloadComplete={handleDownloadComplete}
        />
      </Card>

      {/* Card de lista de audios */}
      <Card 
        title="Audios Descargados" 
        className="shadow-2"
      >
        <ListaAudios
          files={files}
          onPlay={handlePlay}
          onDelete={handleDelete}
          onProcess={openProcessModal}
          loading={filesLoading}
        />
      </Card>

      {/* Modal de Procesamiento */}
      <ProcesamientoModal
        visible={showProcessModal}
        onHide={() => !isProcessing && setShowProcessModal(false)}
        audio={selectedAudio}
        onProcess={handleProcessAudio}
        processing={isProcessing}
        progress={processProgress}
        statusMessage={processStatusMessage}
        error={processError}
      />

      {/* Espacio para el reproductor fijo */}
      <div style={{ height: '120px' }}></div>

      {/* Reproductor fijo en la parte inferior */}
      <ReproductorAudio
        currentAudio={player.currentAudio}
        onStop={player.stop}
        showResumeDialog={player.showResumeDialog}
        pendingAudio={player.pendingAudio}
        onResumeFromStart={handleResumeFromStart}
        onResumeFromPosition={handleResumeFromPosition}
        onCloseDialog={handleCloseResumeDialog}
      />

      {/* Estilos adicionales */}
      <style>{`
        .audios-youtube-page {
          min-height: calc(100vh - 120px);
          padding-bottom: 140px;
        }
        
        .bg-primary-alpha-10 {
          background-color: rgba(var(--primary-color-rgb), 0.1);
        }
      `}</style>
    </div>
  );
};

export default AudiosYouTubePage;
