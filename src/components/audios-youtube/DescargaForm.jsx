import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const getAudioName = (file) => file?.filename || file?.fileName || file?.name || file?.titulo || file?.title || '';

const normalizeFilename = (filename) => {
  try {
    return decodeURIComponent(filename || '').trim().toLowerCase();
  } catch (error) {
    return (filename || '').trim().toLowerCase();
  }
};

const matchesAudioFilename = (fileName, targetName) => {
  const normalizedFile = normalizeFilename(fileName);
  const normalizedTarget = normalizeFilename(targetName);

  return normalizedFile === normalizedTarget ||
    normalizedFile.startsWith(`${normalizedTarget}.`) ||
    normalizedTarget.startsWith(`${normalizedFile}.`);
};

/**
 * Formulario para descargar audio desde YouTube
 */
const DescargaForm = ({ onDownloadComplete, loadFiles }) => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(null); // null, 'pending', 'downloading', 'completed', 'failed'
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [estimatedSize, setEstimatedSize] = useState(null);

  const pollingIntervalRef = useRef(null);
  const pollingTimeoutRef = useRef(null);
  const completionNotifiedRef = useRef(false);

  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  const findDownloadedFile = useCallback(async (filename) => {
    if (!filename) return null;

    const response = await audioDownloadService.listFiles();
    const data = response.data;
    const files = Array.isArray(data) ? data : (data.files || []);

    return files.find((file) => matchesAudioFilename(getAudioName(file), filename)) || null;
  }, []);

  const completeDownload = useCallback((data, fallbackFilename) => {
    if (completionNotifiedRef.current) return;

    const completedFilename = data?.filename || getAudioName(data) || fallbackFilename;
    completionNotifiedRef.current = true;
    setDownloadStatus('completed');
    setStatusMessage(`Audio completado: ${completedFilename}`);
    setProgress(100);
    clearPolling();
    setIsLoading(false);

    if (onDownloadComplete) {
      onDownloadComplete({ ...data, filename: completedFilename });
    }
  }, [clearPolling, onDownloadComplete]);

  // Validar URL de YouTube en tiempo real
  useEffect(() => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    setIsValidUrl(youtubeRegex.test(url.trim()));
  }, [url]);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  /**
   * Verificar estado de la descarga mediante polling
   */
  const checkStatus = useCallback(async (filename, attempts = 0) => {
    const maxAttempts = 100; // 100 intentos = ~5 minutos con polling cada 3s

    try {
      const response = await audioDownloadService.getStatus(filename);
      const data = response.data;
      const { status, size, sizeFormatted, error, progress: prog } = data;

      if (status === 'completed' || data.completed === true || data.exists === true) {
        setEstimatedSize(sizeFormatted);

        // Recargar lista si la prop está disponible
        if (loadFiles) await loadFiles();

        completeDownload(data, filename);
        return;
      }

      if (status === 'failed' || status === 'error') {
        const downloadedFile = await findDownloadedFile(filename);
        if (downloadedFile) {
          completeDownload(downloadedFile, filename);
          return;
        }

        setDownloadError(error || 'Error en la descarga');
        setDownloadStatus('failed');
        setStatusMessage(error || 'Error al descargar el audio');
        clearPolling();
        setIsLoading(false);
        return;
      }

      if (status === 'downloading' || status === 'processing' || status === 'pending') {
        setDownloadStatus('downloading');
        setStatusMessage(data.message || 'Descargando audio...');
        if (prog !== undefined) {
          setProgress(prog);
        }
        if (sizeFormatted) {
          setEstimatedSize(sizeFormatted);
        }
      }

      if (attempts >= maxAttempts) {
        setDownloadError('Tiempo de espera agotado. La descarga puede estar en progreso.');
        setDownloadStatus('failed');
        setStatusMessage('La descarga está tomando más tiempo de lo esperado.');
        clearPolling();
        setIsLoading(false);
        return;
      }

      try {
        const downloadedFile = await findDownloadedFile(filename);
        if (downloadedFile) {
          completeDownload(downloadedFile, filename);
        }
      } catch (listError) {
        console.error('Error al verificar archivos descargados:', listError);
      }
    } catch (error) {
      try {
        const downloadedFile = await findDownloadedFile(filename);
        if (downloadedFile) {
          completeDownload(downloadedFile, filename);
          return;
        }
      } catch (listError) {
        console.error('Error al verificar archivos descargados:', listError);
      }

      console.error('Error al verificar estado:', error);
      setDownloadStatus('failed');
      setStatusMessage('Error al verificar el estado de la descarga');
      clearPolling();
      setIsLoading(false);
    }
  }, [clearPolling, completeDownload, findDownloadedFile]);

  /**
   * Iniciar descarga del audio
   */
  const handleStartDownload = async (targetUrl = url, isRetry = false) => {
    if (!isValidUrl && !targetUrl) return;

    clearPolling();
    completionNotifiedRef.current = false;
    setIsLoading(true);
    setDownloadStatus('pending');
    setDownloadError(null);
    if (!isRetry) {
      setRetryCount(0);
    }
    setStatusMessage('Iniciando descarga...');
    setProgress(0);

    try {
      const response = await audioDownloadService.startDownload(targetUrl.trim());
      const data = response.data;
      const filename = data.filename || data.fileName || data.name || data.titulo || data.title;
      const title = data.title || data.titulo || filename;

      if (filename) {
        if (data.status === 'completed' || data.completed === true || data.exists === true) {
          completeDownload(data, filename);
          return;
        }

        setDownloadStatus('downloading');
        setStatusMessage(`Descargando: ${title}`);
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }

        // Iniciar polling con contador de intentos
        let attempts = 0;
        pollingIntervalRef.current = setInterval(() => {
          attempts++;
          checkStatus(filename, attempts);
        }, 3000);

        // Primera verificación inmediata
        pollingTimeoutRef.current = setTimeout(() => checkStatus(filename, 0), 1000);
      } else {
        setDownloadStatus('failed');
        setStatusMessage('No se recibió el nombre del archivo');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error al iniciar descarga:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al iniciar la descarga';
      setDownloadError(errorMsg);
      setDownloadStatus('failed');
      setStatusMessage(errorMsg);
      setIsLoading(false);

      // Reintento automático (máximo 2)
      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleStartDownload(targetUrl, true);
        }, 3000);
      }
    }
  };

  /**
   * Cancelar descarga actual
   */
  const handleCancel = () => {
    clearPolling();
    completionNotifiedRef.current = false;
    setDownloadStatus(null);
    setStatusMessage('');
    setProgress(0);
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
        <div className={`border-1 border-border border-round p-3 ${downloadStatus === 'downloading' ? 'bg-primary-alpha-10' : 'bg-surface-50 dark:bg-surface-900'}`}>
          {downloadStatus === 'pending' && (
            <div className="flex align-items-center gap-3">
              <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
              <span className="text-color-secondary">Iniciando descarga...</span>
            </div>
          )}

          {downloadStatus === 'downloading' && (
            <div className="flex flex-column gap-3">
              <div className="flex align-items-center gap-3">
                <i className="pi pi-spin pi-download text-2xl text-primary"></i>
                <div className="flex flex-column flex-1">
                  <span className="font-medium text-primary">
                    Descargando audio...
                  </span>
                  <small className="text-secondary">
                    Esto puede tomar varios minutos dependiendo del tamaño del video
                  </small>
                </div>
              </div>

              <div className="flex flex-column gap-2">
                <div className="flex justify-content-between align-items-center">
                  <span className="text-sm font-medium">{statusMessage}</span>
                  <span className="text-sm text-color-secondary">
                    {safeProgress > 0 ? `${safeProgress}%` : ''}
                  </span>
                </div>
                <ProgressBar
                  value={safeProgress > 0 ? safeProgress : null}
                  mode={safeProgress > 0 ? 'determinate' : 'indeterminate'}
                  style={{ height: '6px' }}
                  showValue={false}
                />
              </div>

              {estimatedSize && (
                <small className="text-primary font-medium">
                  Tamaño estimado: {estimatedSize}
                </small>
              )}
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
            <div className="flex flex-column gap-2">
              <Message
                severity="error"
                text={statusMessage}
                icon="pi pi-times-circle"
                className="w-full"
              />
              {downloadError && downloadError !== statusMessage && (
                <small className="text-error ml-2">{downloadError}</small>
              )}
            </div>
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
