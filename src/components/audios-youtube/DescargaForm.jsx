import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import audioDownloadService from '../../services/audioDownloadService';

const getSafeProgress = (value) => {
  const parsedProgress = parseInt(value, 10);
  if (!Number.isFinite(parsedProgress)) return 0;
  return Math.max(0, Math.min(parsedProgress, 100));
};

/**
 * Formulario para descargar audio desde YouTube
 */
const DescargaForm = ({ onDownloadComplete }) => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(null); // null, 'pending', 'downloading', 'completed', 'failed'
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentFilename, setCurrentFilename] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = React.useRef(null);

  // Validar URL de YouTube en tiempo real
  useEffect(() => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    setIsValidUrl(youtubeRegex.test(url.trim()));
  }, [url]);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  /**
   * Verificar estado de la descarga mediante polling
   */
  const checkStatus = async (filename) => {
    try {
      const response = await audioDownloadService.getStatus(filename);
      const data = response.data;

      if (data.status === 'completed') {
        setDownloadStatus('completed');
        setStatusMessage(`Audio completado: ${data.filename || filename}`);
        setProgress(100);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsLoading(false);
        // Notificar que la descarga completó
        if (onDownloadComplete) {
          onDownloadComplete(data);
        }
      } else if (data.status === 'failed' || data.status === 'error') {
        setDownloadStatus('failed');
        setStatusMessage(data.error || 'Error al descargar el audio');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsLoading(false);
      } else if (data.status === 'downloading' || data.status === 'processing') {
        setDownloadStatus('downloading');
        setStatusMessage(data.message || 'Descargando audio...');
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
      }
    } catch (error) {
      console.error('Error al verificar estado:', error);
      setDownloadStatus('failed');
      setStatusMessage('Error al verificar el estado de la descarga');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsLoading(false);
    }
  };

  /**
   * Iniciar descarga del audio
   */
  const handleStartDownload = async () => {
    if (!isValidUrl) return;

    setIsLoading(true);
    setDownloadStatus('pending');
    setStatusMessage('Iniciando descarga...');
    setProgress(0);

    try {
      const response = await audioDownloadService.startDownload(url.trim());
      const data = response.data;

      if (data.filename) {
        setCurrentFilename(data.filename);
        setDownloadStatus('downloading');
        setStatusMessage(data.message || 'Descargando audio...');

        // Iniciar polling cada 5 segundos
        pollingIntervalRef.current = setInterval(() => {
          checkStatus(data.filename);
        }, 5000);

        // Primera verificación inmediata
        setTimeout(() => checkStatus(data.filename), 2000);
      } else {
        setDownloadStatus('failed');
        setStatusMessage('No se recibió el nombre del archivo');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error al iniciar descarga:', error);
      setDownloadStatus('failed');
      setStatusMessage(error.response?.data?.message || 'Error al iniciar la descarga');
      setIsLoading(false);
    }
  };

  /**
   * Cancelar descarga actual
   */
  const handleCancel = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setDownloadStatus(null);
    setStatusMessage('');
    setProgress(0);
    setCurrentFilename('');
    setIsLoading(false);
  };

  const safeProgress = getSafeProgress(progress);

  return (
    <div className="flex flex-column gap-4">
      <div className="flex flex-column md:flex-row gap-3 align-items-end">
        <div className="flex-1 w-full">
          <label htmlFor="youtube-url" className="block font-medium mb-2">
            URL de YouTube
          </label>
          <InputText
            id="youtube-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full"
            disabled={isLoading}
          />
          {!isValidUrl && url.length > 0 && (
            <small className="p-error mt-1 block">
              Por favor ingrese una URL válida de YouTube
            </small>
          )}
        </div>

        <Button
          label="Iniciar Descarga"
          icon="pi pi-download"
          onClick={handleStartDownload}
          disabled={!isValidUrl || isLoading}
          loading={isLoading && downloadStatus === 'pending'}
        />
      </div>

      {/* Estado de la descarga */}
      {downloadStatus && (
        <div className="border-1 border-border border-round p-3 bg-surface-50 dark:bg-surface-900">
          {downloadStatus === 'pending' && (
            <div className="flex align-items-center gap-3">
              <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
              <span className="text-color-secondary">Iniciando descarga...</span>
            </div>
          )}

          {downloadStatus === 'downloading' && (
            <div className="flex flex-column gap-2">
              <div className="flex justify-content-between align-items-center">
                <span className="font-medium text-sm">{statusMessage}</span>
                <span className="text-sm text-color-secondary">{safeProgress}%</span>
              </div>
              <ProgressBar value={safeProgress} showValue={false} />
            </div>
          )}

          {downloadStatus === 'completed' && (
            <Message
              severity="success"
              text={statusMessage}
              icon="pi pi-check-circle"
              className="w-full"
            />
          )}

          {downloadStatus === 'failed' && (
            <Message
              severity="error"
              text={statusMessage}
              icon="pi pi-times-circle"
              className="w-full"
            />
          )}

          {(downloadStatus === 'downloading' || downloadStatus === 'failed') && (
            <div className="mt-3 flex justify-content-end">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-sm p-button-text"
                onClick={handleCancel}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DescargaForm;
