import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
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
const DescargaForm = ({ onDownloadComplete }) => {
  const toast = useRef(null);
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
  const checkStatus = useCallback(async (filename) => {
    let attempts = 0;
    const maxAttempts = 100; // 100 intentos = ~5 minutos con polling cada 3s

    const poll = async () => {
      try {
        attempts++;
        const response = await audioDownloadService.getStatus(filename);
        const data = response.data;
        const { status, sizeFormatted, error, progress: backendProgress, completed, exists } = data;

        if (status === 'completed' || completed === true || exists === true) {
          setEstimatedSize(sizeFormatted);
          completeDownload(data, filename);

          toast.current?.show({
            severity: 'success',
            summary: 'Descarga Completada',
            detail: `Archivo: ${sizeFormatted || filename}`,
            life: 5000
          });

          return;
        }

        if (status === 'failed' || status === 'error') {
          const downloadedFile = await findDownloadedFile(filename);
          if (downloadedFile) {
            completeDownload(downloadedFile, filename);
            return;
          }

          setDownloadStatus('failed');
          setDownloadError(error || 'Error en la descarga');
          setStatusMessage(error || 'Error en la descarga');
          clearPolling();
          setIsLoading(false);

          toast.current?.show({
            severity: 'error',
            summary: 'Error en Descarga',
            detail: error || 'La descarga falló',
            life: 5000
          });
          return;
        }

        if (attempts >= maxAttempts) {
          setDownloadStatus('failed');
          setDownloadError('Tiempo de espera agotado. La descarga puede estar en progreso.');
          setStatusMessage('Tiempo de espera agotado');
          clearPolling();
          setIsLoading(false);

          toast.current?.show({
            severity: 'warn',
            summary: 'Descarga Lenta',
            detail: 'La descarga está tomando más tiempo de lo esperado. Verifica en la lista de archivos.',
            life: 8000
          });
          return;
        }

        if (status === 'downloading' || status === 'processing' || status === 'pending') {
          setDownloadStatus('downloading');
          setStatusMessage(data.message || 'Descargando audio...');
          if (backendProgress !== undefined) {
            setProgress(backendProgress);
          }
        }

        // Siguiente poll
        pollingTimeoutRef.current = setTimeout(poll, 3000);
      } catch (error) {
        console.error('Error al verificar estado:', error);
        // Reintentar poll en caso de error de red
        pollingTimeoutRef.current = setTimeout(poll, 3000);
      }
    };

    poll();
  }, [clearPolling, completeDownload, findDownloadedFile]);

  /**
   * Iniciar descarga del audio
   */
  const handleStartDownload = async (targetUrl = url) => {
    const trimmedUrl = targetUrl.trim();
    if (!trimmedUrl) return;

    clearPolling();
    completionNotifiedRef.current = false;
    setIsLoading(true);
    setDownloadStatus('pending');
    setStatusMessage('Iniciando descarga...');
    setDownloadError(null);
    setEstimatedSize(null);
    setProgress(0);

    try {
      const response = await audioDownloadService.startDownload(trimmedUrl);
      const data = response.data;
      const filename = data.filename || data.fileName || data.name || data.titulo || data.title;

      if (filename) {
        if (data.status === 'completed' || data.completed === true || data.exists === true) {
          setEstimatedSize(data.sizeFormatted);
          completeDownload(data, filename);
          return;
        }

        setDownloadStatus('downloading');
        checkStatus(filename);
      } else {
        throw new Error('No se recibió el nombre del archivo');
      }
    } catch (error) {
      console.error('Error al iniciar descarga:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al iniciar descarga';

      setDownloadStatus('failed');
      setDownloadError(errorMsg);
      setStatusMessage(errorMsg);
      setIsLoading(false);

      // Ofrecer reintento automático
      if (retryCount < 2) {
        toast.current?.show({
          severity: 'info',
          summary: 'Reintentando...',
          detail: 'No se pudo iniciar la descarga. Reintentando automáticamente...',
          life: 3000
        });

        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleStartDownload(trimmedUrl);
        }, 3000);
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: errorMsg,
          life: 5000
        });
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
      <Toast ref={toast} />
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
          onClick={() => handleStartDownload()}
          disabled={!isValidUrl || isLoading}
          loading={isLoading && downloadStatus === 'pending'}
        />
      </div>

      {/* Estado de la descarga */}
      {downloadStatus === 'downloading' && (
        <div className="card mt-2 p-4 bg-primary-alpha-10 border-round">
          <div className="flex flex-column gap-3">
            <div className="flex align-items-center gap-3">
              <i className="pi pi-spin pi-download text-2xl text-primary"></i>
              <div className="flex flex-column flex-1">
                <span className="font-medium text-primary">
                  {statusMessage || 'Descargando audio...'}
                </span>
                <small className="text-secondary">
                  Esto puede tomar varios minutos dependiendo del tamaño del video
                </small>
              </div>
              {safeProgress > 0 && (
                <span className="font-bold text-primary">{safeProgress}%</span>
              )}
            </div>

            <ProgressBar
              value={safeProgress > 0 ? safeProgress : 0}
              mode={safeProgress > 0 ? 'determinate' : 'indeterminate'}
              style={{ height: '6px' }}
              showValue={false}
            />

            {estimatedSize && (
              <small className="text-primary font-medium">
                Tamaño estimado: {estimatedSize}
              </small>
            )}

            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text p-button-sm align-self-end"
              onClick={handleCancel}
            />
          </div>
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

      {(downloadStatus === 'failed' || downloadError) && (
        <Message
          severity="error"
          text={downloadError || statusMessage}
          icon="pi pi-times-circle"
          className="w-full"
          closable
          onClear={() => {
            setDownloadError(null);
            if (downloadStatus === 'failed') setDownloadStatus(null);
          }}
        />
      )}
    </div>
  );
};

export default DescargaForm;
