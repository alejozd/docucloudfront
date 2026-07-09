import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
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

  // Estado para polling de descarga
  const downloadPollingRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusMessage, setDownloadStatusMessage] = useState('');
  const [downloadError, setDownloadError] = useState(null);

  // Estado para rastrear archivos activos (descarga o proceso)
  const [activeFilenames, setActiveFilenames] = useState([]);
  const [tasksProgress, setTasksProgress] = useState({}); // { filename: progress }

  /**
   * Actualizar lista de archivos activos desde localStorage
   */
  const refreshActiveTasks = useCallback(() => {
    const activeDownload = localStorage.getItem('activeAudioDownload');
    const activeProcess = localStorage.getItem('activeAudioProcess');

    const activeList = [];
    if (activeDownload) {
      try {
        const { filename } = JSON.parse(activeDownload);
        if (filename) activeList.push(filename);
      } catch (e) {}
    }
    if (activeProcess) {
      try {
        const { audio } = JSON.parse(activeProcess);
        if (audio?.filename) activeList.push(audio.filename);
      } catch (e) {}
    }

    setActiveFilenames(activeList);
    return activeList;
  }, []);

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
  const loadFiles = useCallback(async (isSilent = false) => {
    if (!isAuthenticated) return;
    
    if (!isSilent) setFilesLoading(true);
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
   * Manejar cierre del modal de password (clic en Cancelar)
   */
  const handlePasswordModalHide = () => {
    if (!isAuthenticated) {
      navigate('/'); // Redirigir a Inicio
    }
  };

  /**
   * Manejar descarga completada
   */
  const handleDownloadComplete = useCallback((data) => {
    // Limpiar progreso de la lista
    if (data.filename) {
      setTasksProgress(prev => {
        const newState = { ...prev };
        delete newState[data.filename];
        return newState;
      });
    }

    toastRef.current?.show({
      severity: 'success',
      summary: 'Descarga Completada',
      detail: `El audio "${data.filename}" se ha descargado exitosamente`,
      life: 5000
    });
    
    // Recargar lista de archivos y tareas activas
    refreshActiveTasks();
    setTimeout(() => loadFiles(), 1000);
  }, [loadFiles, refreshActiveTasks]);


  /**
   * Manejar reproducción de audio
   */
  const handlePlay = useCallback((audioData) => {
    player.play({
      filename: audioData.filename,
      title: audioData.title || audioData.filename
      // NO incluir streamUrl ni duration, se generarán dinámicamente
    });
  }, [player]);

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
   * Cancelar el seguimiento del procesamiento y limpiar estados relacionados
   */
  const handleCancelProcessing = useCallback(() => {
    clearProcessPolling();
    setIsProcessing(false);
    setProcessProgress(0);
    setProcessStatusMessage('');
    setProcessError(null);

    // Obtener el filename de la tarea activa para quitarlo de tasksProgress
    const activeProcessData = localStorage.getItem('activeAudioProcess');
    if (activeProcessData) {
      try {
        const { audio } = JSON.parse(activeProcessData);
        if (audio?.filename) {
          setTasksProgress(prev => {
            const newState = { ...prev };
            delete newState[audio.filename];
            return newState;
          });
        }
      } catch (e) {}
    }

    localStorage.removeItem('activeAudioProcess');
    setShowProcessModal(false);
    setSelectedAudio(null);
    refreshActiveTasks();

    toastRef.current?.show({
      severity: 'info',
      summary: 'Seguimiento Cancelado',
      detail: 'Se detuvo el seguimiento del procesamiento',
      life: 3000
    });
  }, [clearProcessPolling, refreshActiveTasks]);

  /**
   * Limpiar polling de descarga
   */
  const clearDownloadPolling = useCallback(() => {
    if (downloadPollingRef.current) {
      clearTimeout(downloadPollingRef.current);
      downloadPollingRef.current = null;
    }
  }, []);

  /**
   * Iniciar polling de estado de descarga
   */
  const startDownloadStatusPolling = useCallback((filename) => {
    clearDownloadPolling();

    const poll = async () => {
      try {
        const response = await audioDownloadService.getStatus(filename);
        const data = response.data;
        const { status, progress, message, error, completed, exists } = data;

        if (progress !== undefined) {
          setTasksProgress(prev => ({ ...prev, [filename]: progress }));
          setDownloadProgress(progress);
        }

        if (status === 'completed' || completed === true || exists === true) {
          clearDownloadPolling();
          setIsDownloading(false);
          setDownloadProgress(100);

          handleDownloadComplete(data);
          localStorage.removeItem('activeAudioDownload');
          refreshActiveTasks();
          return;
        }

        if (status === 'failed' || status === 'error') {
          clearDownloadPolling();
          setIsDownloading(false);
          setDownloadError(error || 'Error en la descarga');
          setDownloadStatusMessage(error || 'Error en la descarga');

          setTasksProgress(prev => {
            const newState = { ...prev };
            delete newState[filename];
            return newState;
          });

          localStorage.removeItem('activeAudioDownload');
          refreshActiveTasks();
          return;
        }

        setDownloadStatusMessage(message || 'Descargando...');
        downloadPollingRef.current = setTimeout(poll, 3000);
      } catch (error) {
        console.error('Error polling descarga:', error);

        // Si el error es 404 o 400 (ej. recurso no existe más), limpiamos el estado y detenemos polling
        if (error.response && (error.response.status === 404 || error.response.status === 400)) {
          clearDownloadPolling();
          setIsDownloading(false);
          setDownloadError('El recurso de descarga no fue encontrado o la solicitud es inválida.');
          localStorage.removeItem('activeAudioDownload');
          setTasksProgress(prev => {
            const newState = { ...prev };
            delete newState[filename];
            return newState;
          });
          refreshActiveTasks();
          return;
        }

        downloadPollingRef.current = setTimeout(poll, 5000);
      }
    };

    poll();
  }, [clearDownloadPolling, handleDownloadComplete, refreshActiveTasks]);

  /**
   * Iniciar polling de estado de procesamiento
   */
  const startProcessStatusPolling = useCallback((taskId) => {
    clearProcessPolling();

    const poll = async () => {
      try {
        const response = await audioDownloadService.getProcessStatus(taskId);
        const data = response.data;
        const { status, progress, message, error } = data;

        // Actualizar progreso para la lista
        const activeProcessData = localStorage.getItem('activeAudioProcess');
        if (activeProcessData) {
          try {
            const { audio } = JSON.parse(activeProcessData);
            if (audio?.filename && progress !== undefined) {
              setTasksProgress(prev => ({ ...prev, [audio.filename]: progress }));
            }
          } catch (e) {}
        }

        // Terminal success states
        const isCompleted = status === 'completed' ||
                           status === 'finished' ||
                           status === 'success' ||
                           status === 'done' ||
                           status === 'ok' ||
                           data.completed === true ||
                           data.finished === true ||
                           (progress !== undefined && progress >= 100);

        if (isCompleted) {
          clearProcessPolling();
          setIsProcessing(false);
          setProcessProgress(100);

          // Limpiar progreso al completar
          const activeProcessDataClear = localStorage.getItem('activeAudioProcess');
          if (activeProcessDataClear) {
            try {
              const { audio } = JSON.parse(activeProcessDataClear);
              if (audio?.filename) {
                setTasksProgress(prev => {
                  const newState = { ...prev };
                  delete newState[audio.filename];
                  return newState;
                });
              }
            } catch (e) {}
          }

          localStorage.removeItem('activeAudioProcess');

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

        if (status === 'failed' || status === 'error') {
          clearProcessPolling();
          setIsProcessing(false);
          setProcessError(error || 'Error en el procesamiento');

          // Limpiar progreso al fallar
          const activeProcessDataFail = localStorage.getItem('activeAudioProcess');
          if (activeProcessDataFail) {
            try {
              const { audio } = JSON.parse(activeProcessDataFail);
              if (audio?.filename) {
                setTasksProgress(prev => {
                  const newState = { ...prev };
                  delete newState[audio.filename];
                  return newState;
                });
              }
            } catch (e) {}
          }

          localStorage.removeItem('activeAudioProcess');
          return;
        }

        // Actualizar progreso
        setProcessProgress(progress || 0);
        setProcessStatusMessage(message || 'Procesando...');

        // Siguiente poll
        processPollingRef.current = setTimeout(poll, 3000);
      } catch (error) {
        console.error('Error al consultar estado de procesamiento:', error);

        // Si el error es 404 o 400 (ej. recurso no existe más), limpiamos el estado y detenemos polling
        if (error.response && (error.response.status === 404 || error.response.status === 400)) {
          clearProcessPolling();
          setIsProcessing(false);
          setProcessError('La tarea de procesamiento no fue encontrada o la solicitud es inválida.');

          const activeProcessDataClear = localStorage.getItem('activeAudioProcess');
          if (activeProcessDataClear) {
            try {
              const { audio } = JSON.parse(activeProcessDataClear);
              if (audio?.filename) {
                setTasksProgress(prev => {
                  const newState = { ...prev };
                  delete newState[audio.filename];
                  return newState;
                });
              }
            } catch (e) {}
          }

          localStorage.removeItem('activeAudioProcess');
          refreshActiveTasks();
          return;
        }

        // NO detener polling por otros errores (ej. errores de red), reintentar automáticamente
        processPollingRef.current = setTimeout(poll, 5000);
      }
    };

    poll();
  }, [clearProcessPolling, loadFiles, refreshActiveTasks]);

  /**
   * Cargar archivos al autenticarse
   */
  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
      refreshActiveTasks();

      // Polling periódico de la lista si hay tareas activas
      const listRefreshInterval = setInterval(() => {
        const activeList = refreshActiveTasks();

        if (activeList.length > 0) {
          loadFiles(true); // Silent refresh
        }
      }, 10000); // Cada 10 segundos

      // Verificar si hay una descarga activa al cargar
      const activeDownload = localStorage.getItem('activeAudioDownload');
      if (activeDownload) {
        try {
          const { filename } = JSON.parse(activeDownload);
          if (filename) {
            setIsDownloading(true);
            setDownloadStatusMessage('Reanudando seguimiento de descarga...');
            startDownloadStatusPolling(filename);
          }
        } catch (e) {
          localStorage.removeItem('activeAudioDownload');
        }
      }

      // Verificar si hay un procesamiento activo al cargar
      const activeProcess = localStorage.getItem('activeAudioProcess');
      if (activeProcess) {
        try {
          const { taskId, audio } = JSON.parse(activeProcess);
          if (taskId) {
            setSelectedAudio(audio);
            setShowProcessModal(true);
            setIsProcessing(true);
            setProcessStatusMessage('Reanudando seguimiento de procesamiento...');
            startProcessStatusPolling(taskId);
          }
        } catch (e) {
          console.error('Error al parsear activeAudioProcess:', e);
          localStorage.removeItem('activeAudioProcess');
        }
      }

      return () => clearInterval(listRefreshInterval);
    }
  }, [isAuthenticated, loadFiles, startProcessStatusPolling, startDownloadStatusPolling, refreshActiveTasks]);

  /**
   * Manejar inicio de procesamiento
   */
  const handleProcessAudio = useCallback(async (filename, operations) => {
    setIsProcessing(true);
    setProcessProgress(0);
    setProcessStatusMessage('Iniciando procesamiento...');
    setProcessError(null);

    try {
      const response = await audioDownloadService.processAudio(filename, operations);
      const { taskId } = response.data;

      if (taskId) {
        // Guardar en localStorage
        localStorage.setItem('activeAudioProcess', JSON.stringify({
          taskId,
          audio: selectedAudio,
          timestamp: new Date().getTime()
        }));

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
  }, [selectedAudio, startProcessStatusPolling]);

  /**
   * Abrir modal de procesamiento
   */
  const openProcessModal = useCallback((audio) => {
    setSelectedAudio(audio);
    setShowProcessModal(true);
    setProcessError(null);
    setProcessProgress(0);
    setProcessStatusMessage('');
  }, []);

  /**
   * Manejar eliminación de archivo
   */
  const handleDelete = useCallback(async (audioData) => {
    try {
      await audioDownloadService.deleteFile(audioData.filename);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Archivo Eliminado',
        detail: `El archivo "${audioData.filename}" ha sido eliminado`,
        life: 3000
      });
      
      // Recargar lista sin causar parpadeo - actualizar estado directamente
      setFiles(prevFiles => prevFiles.filter(f => f.filename !== audioData.filename));
      
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
  }, [player]);


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
    return () => {
      clearProcessPolling();
      clearDownloadPolling();
    };
  }, [clearProcessPolling, clearDownloadPolling]);

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
          files={files}
          onDownloadStart={(filename) => {
            refreshActiveTasks();
            setIsDownloading(true);
            setDownloadProgress(0);
            setDownloadStatusMessage('Iniciando...');
            startDownloadStatusPolling(filename);
          }}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          downloadStatusMessage={downloadStatusMessage}
          downloadError={downloadError}
          onCancelDownload={() => {
            clearDownloadPolling();
            setIsDownloading(false);
            localStorage.removeItem('activeAudioDownload');
            refreshActiveTasks();
          }}
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
          activeFilenames={activeFilenames}
          tasksProgress={tasksProgress}
        />
      </Card>

      {/* Modal de Procesamiento */}
      <ProcesamientoModal
        visible={showProcessModal}
        onHide={() => setShowProcessModal(false)}
        audio={selectedAudio}
        onProcess={handleProcessAudio}
        processing={isProcessing}
        progress={processProgress}
        statusMessage={processStatusMessage}
        error={processError}
        onCancelProcessing={handleCancelProcessing}
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

        /* ConfirmDialog responsive para móviles */
        .confirm-dialog-responsive.p-dialog {
          max-width: 90vw !important;
          width: 90vw !important;
        }

        @media (max-width: 768px) {
          .confirm-dialog-responsive.p-dialog {
            max-width: 95vw !important;
            width: 95vw !important;
            margin: 0.5rem !important;
          }

          .confirm-dialog-responsive .p-dialog-header {
            padding: 1rem !important;
            font-size: 1rem !important;
          }

          .confirm-dialog-responsive .p-dialog-content {
            padding: 1.5rem 1rem !important;
            font-size: 0.95rem !important;
          }

          .confirm-dialog-responsive .p-dialog-footer {
            padding: 0.5rem 1rem 1rem !important;
            flex-direction: column-reverse;
            gap: 0.5rem;
          }

          .confirm-dialog-responsive .p-button {
            width: 100%;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AudiosYouTubePage;
