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
 * Extraer ID de video de una URL de YouTube
 */
const getYoutubeVideoId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

/**
 * Formulario para descargar audio desde YouTube
 */
const DescargaForm = ({
  onDownloadComplete,
  files = [],
  onDownloadStart,
  isDownloading,
  downloadProgress,
  downloadStatusMessage,
  downloadError: externalError,
  onCancelDownload
}) => {
  const toast = useRef(null);
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Validar URL de YouTube en tiempo real
  useEffect(() => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    setIsValidUrl(youtubeRegex.test(url.trim()));
  }, [url]);

  // Recuperar URL de descarga activa al montar si existe
  useEffect(() => {
    const activeDownload = localStorage.getItem('activeAudioDownload');
    if (activeDownload) {
      try {
        const { url: savedUrl } = JSON.parse(activeDownload);
        if (savedUrl) setUrl(savedUrl);
      } catch (e) {}
    }
  }, []);

  /**
   * Iniciar descarga del audio
   */
  const handleStartDownload = async (targetUrl = url, isRetry = false) => {
    const trimmedUrl = targetUrl.trim();
    if (!trimmedUrl) return;

    if (!isRetry) {
      setRetryCount(0);
      setLocalError(null);

      // 1. Verificar si ya hay una descarga en progreso en localStorage
      const activeDownload = localStorage.getItem('activeAudioDownload');
      if (activeDownload) {
        try {
          const parsed = JSON.parse(activeDownload);
          if (parsed.url === trimmedUrl && parsed.filename) {
            toast.current?.show({
              severity: 'info',
              summary: 'Reanudando seguimiento',
              detail: 'Ya hay una descarga activa. Reanudando seguimiento...',
              life: 3000
            });
            onDownloadStart(parsed.filename);
            return;
          }
        } catch (e) {
          localStorage.removeItem('activeAudioDownload');
        }
      }

      // 2. Verificar si el archivo ya existe (por ID de video)
      const videoId = getYoutubeVideoId(trimmedUrl);
      if (videoId) {
        const alreadyDownloaded = files.some(file => getAudioName(file).includes(videoId));
        if (alreadyDownloaded) {
          toast.current?.show({
            severity: 'info',
            summary: 'Video ya descargado',
            detail: 'Este video ya se encuentra en la lista de audios.',
            life: 5000
          });
          return;
        }
      }
    }

    setInternalLoading(true);

    try {
      console.log(`[DescargaForm] Solicitando: ${trimmedUrl}`);

      const response = await Promise.race([
        audioDownloadService.startDownload(trimmedUrl),
        new Promise((_, reject) => setTimeout(() => reject(new Error('El servidor tardó demasiado en responder al inicio de la descarga.')), 45000))
      ]);

      const data = response.data;
      const filename = data.filename || data.fileName || data.name || data.titulo || data.title;

      if (filename) {
        if (data.status === 'completed' || data.completed === true || data.exists === true) {
          if (onDownloadComplete) onDownloadComplete(data);
          setInternalLoading(false);
          return;
        }

        // Guardar en localStorage para persistencia
        localStorage.setItem('activeAudioDownload', JSON.stringify({
          filename,
          url: trimmedUrl,
          timestamp: new Date().getTime()
        }));

        if (onDownloadStart) onDownloadStart();
      } else {
        throw new Error('No se recibió el nombre del archivo');
      }
    } catch (error) {
      console.error('Error al iniciar descarga:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Error al iniciar descarga';

      if (retryCount < 2) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        toast.current?.show({
          severity: 'warn',
          summary: 'Reintentando...',
          detail: `No se pudo iniciar (Intento ${nextRetry}/2). Reintentando...`,
          life: 3000
        });
        setTimeout(() => handleStartDownload(trimmedUrl, true), 3000);
      } else {
        setLocalError(errorMsg);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: errorMsg,
          life: 5000
        });
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const safeProgress = getSafeProgress(downloadProgress);

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
          disabled={!isValidUrl || internalLoading || isDownloading}
          loading={internalLoading}
        />
      </div>

      {/* Estado de la descarga */}
      {isDownloading && (
        <div className="card mt-2 p-4 bg-primary-alpha-10 border-round">
          <div className="flex flex-column gap-3">
            <div className="flex align-items-center gap-3">
              <i className="pi pi-spin pi-download text-2xl text-primary"></i>
              <div className="flex flex-column flex-1">
                <span className="font-medium text-primary">
                  {downloadStatusMessage || 'Descargando audio...'}
                </span>
                <small className="text-secondary">
                  La descarga puede tomar varios minutos/horas dependiendo del tamaño del video. Puedes cerrar esta ventana y volver más tarde.
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

            <div className="flex gap-2 align-self-end">
              <Button
                label="Detener Seguimiento"
                icon="pi pi-times"
                className="p-button-text p-button-sm p-button-danger"
                onClick={onCancelDownload}
              />
            </div>
          </div>
        </div>
      )}

      {(localError || externalError) && (
        <Message
          severity="error"
          text={localError || externalError}
          icon="pi pi-times-circle"
          className="w-full"
          closable
          onClear={() => setLocalError(null)}
        />
      )}
    </div>
  );
};

export default DescargaForm;
