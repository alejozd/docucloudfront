import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import PasswordModal from '../../components/audios-youtube/PasswordModal';
import DescargaForm from '../../components/audios-youtube/DescargaForm';
import ListaAudios from '../../components/audios-youtube/ListaAudios';
import ReproductorAudio from '../../components/audios-youtube/ReproductorAudio';
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
      streamUrl: audioData.streamUrl,
      duration: audioData.duration || 0
    });
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
      <ConfirmDialog />
      
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
        headerClassName="bg-primary-alpha-10"
      >
        <DescargaForm 
          onDownloadComplete={handleDownloadComplete}
        />
      </Card>

      {/* Card de lista de audios */}
      <Card 
        title="Audios Descargados" 
        className="shadow-2"
        headerClassName="bg-primary-alpha-10"
      >
        <ListaAudios
          files={files}
          onPlay={handlePlay}
          onDelete={handleDelete}
          loading={filesLoading}
        />
      </Card>

      {/* Espacio para el reproductor fijo */}
      <div style={{ height: '120px' }}></div>

      {/* Reproductor fijo en la parte inferior */}
      <ReproductorAudio
        currentAudio={player.currentAudio}
        isPlaying={player.isPlaying}
        position={player.position}
        duration={player.duration}
        onPlayPause={handlePlayPause}
        onStop={player.stop}
        onSeek={player.seek}
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
