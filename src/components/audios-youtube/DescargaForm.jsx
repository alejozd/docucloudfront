import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import audioDownloadService from '../../services/audioDownloadService';
import { formatDuration } from '../../utils/audioUtils';
import { setActiveDownload, findActiveDownloadByUrl } from '../../utils/activeDownloadsStorage';

const getSafeProgress = (value) => {
  const parsedProgress = parseInt(value, 10);
  if (!Number.isFinite(parsedProgress)) return 0;
  return Math.max(0, Math.min(parsedProgress, 100));
};

const getAudioName = (file) => file?.filename || file?.fileName || file?.name || file?.titulo || file?.title || '';

/**
 * Extraer ID de video de una URL de YouTube
 */
const getYoutubeVideoId = (url) => {
  // eslint-disable-next-line no-useless-escape
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

/**
 * Tarjeta de estado de una descarga individual
 */
const DownloadStatusCard = ({ filename, download, onCancel }) => {
  const { progress, statusMessage, error, meta } = download;
  const safeProgress = getSafeProgress(progress);
  const isConverting = (statusMessage || '').startsWith('Convirtiendo');
  const durationLabel = formatDuration(meta?.duration);

  return (
    <div className={`card mt-2 p-4 border-round ${error ? 'bg-red-50' : 'bg-primary-alpha-10'}`}>
      <div className="flex flex-column gap-3">
        <div className="flex align-items-center gap-3">
          {meta?.thumbnail && (
            <img
              src={meta.thumbnail}
              alt=""
              className="border-round flex-shrink-0"
              style={{ width: '64px', height: '64px', objectFit: 'cover' }}
            />
          )}
          <i className={`pi ${error ? 'pi-exclamation-triangle text-2xl text-red-500' : `pi-spin ${isConverting ? 'pi-cog' : 'pi-download'} text-2xl text-primary`}`}></i>
          <div className="flex flex-column flex-1" style={{ overflow: 'hidden' }}>
            {meta?.title && (
              <span className="text-sm text-overflow-ellipsis overflow-hidden white-space-nowrap">
                {meta.title}{durationLabel ? ` • ${durationLabel}` : ''}
              </span>
            )}
            <span className={`font-medium ${error ? 'text-red-600' : 'text-primary'}`}>
              {error || statusMessage || 'Descargando audio...'}
            </span>
            {!error && (
              <small className="text-secondary">
                La descarga puede tomar varios minutos/horas dependiendo del tamaño del video. Puedes cerrar esta ventana y volver más tarde.
              </small>
            )}
          </div>
          {!error && !isConverting && safeProgress > 0 && (
            <span className="font-bold text-primary">{safeProgress}%</span>
          )}
        </div>

        {!error && (
          <ProgressBar
            value={!isConverting && safeProgress > 0 ? safeProgress : 0}
            mode={!isConverting && safeProgress > 0 ? 'determinate' : 'indeterminate'}
            style={{ height: '6px' }}
            showValue={false}
          />
        )}

        <div className="flex gap-2 align-self-end">
          <Button
            label={error ? 'Descartar' : 'Detener Seguimiento'}
            icon="pi pi-times"
            className="p-button-text p-button-sm p-button-danger"
            onClick={() => onCancel(filename)}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Formulario para descargar audio desde YouTube. Soporta varias descargas
 * simultáneas: cada una vive en `downloads[filename]` con su propio progreso/estado.
 */
const DescargaForm = ({
  onDownloadComplete,
  files = [],
  onDownloadStart,
  downloads = {},
  maxConcurrentDownloads = 3,
  onCancelDownload
}) => {
  const toast = useRef(null);
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const activeDownloadCount = Object.keys(downloads).length;
  const atConcurrencyLimit = activeDownloadCount >= maxConcurrentDownloads;

  // Validar URL de YouTube en tiempo real
  useEffect(() => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    setIsValidUrl(youtubeRegex.test(url.trim()));
  }, [url]);

  /**
   * Iniciar descarga del audio
   */
  const handleStartDownload = async (targetUrl = url, isRetry = false) => {
    const trimmedUrl = targetUrl.trim();
    if (!trimmedUrl) return;

    if (!isRetry) {
      setRetryCount(0);
      setLocalError(null);

      // 1. Verificar si esta URL ya se está descargando
      const existing = findActiveDownloadByUrl(trimmedUrl);
      if (existing?.filename) {
        toast.current?.show({
          severity: 'info',
          summary: 'Reanudando seguimiento',
          detail: 'Ya hay una descarga activa para esta URL. Reanudando seguimiento...',
          life: 3000
        });
        onDownloadStart(existing.filename, { title: existing.title, thumbnail: existing.thumbnail, duration: existing.duration });
        return;
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

      // 3. Respetar el límite de descargas simultáneas
      if (atConcurrencyLimit) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: `Ya hay ${maxConcurrentDownloads} descargas en curso. Espera a que alguna termine.`,
          life: 4000
        });
        return;
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
        setActiveDownload(filename, {
          url: trimmedUrl,
          title: data.title,
          thumbnail: data.thumbnail,
          duration: data.duration,
          timestamp: new Date().getTime()
        });

        if (onDownloadStart) onDownloadStart(filename, { title: data.title, thumbnail: data.thumbnail, duration: data.duration });
        setUrl('');
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
            disabled={internalLoading}
          />
          {!isValidUrl && url.length > 0 && (
            <small className="p-error mt-1 block">
              Por favor ingrese una URL válida de YouTube
            </small>
          )}
          {atConcurrencyLimit && (
            <small className="text-color-secondary mt-1 block">
              Ya hay {activeDownloadCount} descargas en curso (máximo {maxConcurrentDownloads} a la vez).
            </small>
          )}
        </div>

        <Button
          label="Iniciar Descarga"
          icon="pi pi-download"
          onClick={() => handleStartDownload()}
          disabled={!isValidUrl || internalLoading || atConcurrencyLimit}
          loading={internalLoading}
        />
      </div>

      {/* Una tarjeta de estado por cada descarga activa */}
      {Object.entries(downloads).map(([filename, download]) => (
        <DownloadStatusCard
          key={filename}
          filename={filename}
          download={download}
          onCancel={onCancelDownload}
        />
      ))}

      {localError && (
        <Message
          severity="error"
          text={localError}
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
