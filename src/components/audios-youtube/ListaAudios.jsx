import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataView } from 'primereact/dataview';
import audioDownloadService from '../../services/audioDownloadService';
import { formatDuration } from '../../utils/audioUtils';

// Los segmentos de un split se nombran "<base>_<taskId8>_parte<N>.mp3" (ver audioProcessingService.js).
// Se usan para agruparlos bajo un mismo audio en vez de listarlos sueltos.
const SPLIT_PART_REGEX = /^(.*)_([a-f0-9]{8})_parte(\d+)\.mp3$/i;

/**
 * Lista de archivos de audio descargados
 */
const ListaAudios = ({ files, onPlay, onDelete, onProcess, loading, activeFilenames = [], tasksProgress = {} }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' o 'cards'
  const [expandedRows, setExpandedRows] = useState(null);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState(() => new Set());

  const getAudioName = (rowData) => rowData?.name || rowData?.filename || rowData?.titulo || rowData?.title || '';

  // Detectar tamaño de pantalla para vista responsive
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setViewMode('cards');
      } else {
        setViewMode('table');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  /**
   * Formatear tamaño de archivo
   */
  const formatSize = (bytes) => {
    if (bytes === 0 || bytes === undefined || bytes === null) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Formatear fecha
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleDownload = async (rowData) => {
    const audioName = getAudioName(rowData);

    if (!audioName) {
      console.error('No se encontró el nombre del archivo para descargar', rowData);
      alert('Error: nombre de archivo no disponible');
      return;
    }

    try {
      // 1. Generar token temporal
      const tokenData = await audioDownloadService.generateStreamToken(audioName);

      if (!tokenData || !tokenData.streamUrl) {
        console.error('No se pudo generar el token de descarga');
        alert('Error al generar enlace de descarga');
        return;
      }

      // 2. Agregar parámetro ?download=true a la URL
      const downloadUrl = tokenData.streamUrl + '&download=true';

      // 3. Abrir en nueva pestaña (el navegador descargará el archivo)
      window.open(downloadUrl, '_blank');

    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al iniciar la descarga');
    }
  };

  const confirmDelete = (rowData) => {
    const audioName = getAudioName(rowData);

    confirmDialog({
      message: `¿Eliminar "${audioName}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => onDelete({ ...rowData, filename: audioName }),
      reject: () => {},
      closeOnEscape: true,
      dismissableMask: true
    });
  };

  /**
   * Botones de acción para un audio individual (standalone o parte de un split)
   */
  const AudioActions = ({ audio, rounded = true, size = 'sm' }) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-play"
        className={`p-button-${size}`}
        severity="success"
        rounded={rounded}
        onClick={() => onPlay(audio)}
        tooltip="Reproducir"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-download"
        className={`p-button-${size}`}
        severity="info"
        rounded={rounded}
        onClick={() => handleDownload(audio)}
        tooltip="Descargar MP3"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-cog"
        className={`p-button-${size}`}
        severity="secondary"
        rounded={rounded}
        onClick={() => onProcess(audio)}
        tooltip="Procesar Audio"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-trash"
        className={`p-button-${size}`}
        severity="danger"
        rounded={rounded}
        onClick={() => confirmDelete(audio)}
        tooltip="Eliminar"
        tooltipOptions={{ position: 'top' }}
      />
    </div>
  );

  /**
   * Agrupa los archivos: las partes de un mismo split quedan bajo un ítem "grupo",
   * el resto queda igual que antes. El grupo hereda la fecha de su parte más reciente
   * para no romper el orden cronológico de la lista.
   */
  const groupedItems = React.useMemo(() => {
    if (!files || files.length === 0) return [];

    const groups = new Map();
    const standalone = [];

    files.forEach(file => {
      const name = getAudioName(file);
      const match = name.match(SPLIT_PART_REGEX);

      if (match) {
        const [, familyBase, taskPrefix, partNum] = match;
        const key = `${familyBase}_${taskPrefix}`;
        if (!groups.has(key)) {
          groups.set(key, {
            isGroup: true,
            key: `group:${key}`,
            title: familyBase.replace(/_vol\+\d+db$/i, '').replace(/_/g, ' ').trim(),
            parts: []
          });
        }
        groups.get(key).parts.push({ ...file, partNumber: parseInt(partNum, 10) });
      } else {
        standalone.push({ isGroup: false, key: `file:${name}`, ...file });
      }
    });

    const groupItems = Array.from(groups.values()).map(group => {
      const parts = [...group.parts].sort((a, b) => a.partNumber - b.partNumber);
      const createdAt = parts.reduce((latest, p) => {
        const d = new Date(p.createdAt || 0);
        return d > latest ? d : latest;
      }, new Date(0));

      return {
        ...group,
        parts,
        size: parts.reduce((sum, p) => sum + (p.size || 0), 0),
        thumbnail: parts.find(p => p.thumbnail)?.thumbnail || null,
        createdAt
      };
    });

    return [...groupItems, ...standalone].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [files]);

  /**
   * Fila anidada con las partes de un grupo (vista tabla)
   */
  const rowExpansionTemplate = (group) => (
    <div className="p-3 surface-50">
      {group.parts.map(part => {
        const audioName = getAudioName(part);
        const isActive = activeFilenames.includes(audioName);
        const progress = tasksProgress[audioName];

        return (
          <div key={audioName} className="flex align-items-center justify-content-between py-2 border-bottom-1 surface-border">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-angle-right text-color-secondary"></i>
              <span>Parte {part.partNumber}</span>
              <span className="text-color-secondary text-sm">{formatSize(part.size)}</span>
              {isActive && (
                <>
                  <i className="pi pi-spin pi-spinner text-primary text-sm"></i>
                  {progress !== undefined && <span className="text-primary font-bold text-xs">{progress}%</span>}
                </>
              )}
            </div>
            <AudioActions audio={part} />
          </div>
        );
      })}
    </div>
  );

  /**
   * Renderizar cards para móvil
   */
  const renderCard = (item) => {
    if (item.isGroup) {
      const isExpanded = expandedGroupKeys.has(item.key);
      return (
        <div className="col-12 mb-3" key={item.key}>
          <div className="card p-3 shadow-2 surface-card border-round">
            <div
              className="flex align-items-center gap-3 cursor-pointer"
              onClick={() => {
                setExpandedGroupKeys(prev => {
                  const next = new Set(prev);
                  next.has(item.key) ? next.delete(item.key) : next.add(item.key);
                  return next;
                });
              }}
            >
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" className="border-round flex-shrink-0" style={{ width: '3rem', height: '3rem', objectFit: 'cover' }} />
              ) : (
                <div className="w-3rem h-3rem bg-primary border-circle flex align-items-center justify-content-center flex-shrink-0">
                  <i className="pi pi-th-large text-white text-xl"></i>
                </div>
              )}
              <div className="flex flex-column flex-1" style={{ overflow: 'hidden' }}>
                <span className="font-medium text-sm text-overflow-ellipsis overflow-hidden white-space-nowrap">
                  {item.title}
                </span>
                <small className="text-secondary text-xs mt-1">
                  {item.parts.length} partes • {formatSize(item.size)} • {formatDate(item.createdAt)}
                </small>
              </div>
              <i className={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'} text-color-secondary`}></i>
            </div>

            {isExpanded && (
              <div className="mt-3 flex flex-column gap-2">
                {item.parts.map(part => {
                  const audioName = getAudioName(part);
                  const isActive = activeFilenames.includes(audioName);
                  const progress = tasksProgress[audioName];

                  return (
                    <div key={audioName} className="flex align-items-center justify-content-between p-2 border-round surface-100">
                      <div className="flex flex-column">
                        <span className="text-sm font-medium">Parte {part.partNumber}</span>
                        <small className="text-secondary text-xs flex align-items-center gap-2">
                          {formatSize(part.size)}
                          {isActive && (
                            <>
                              <i className="pi pi-spin pi-spinner text-primary"></i>
                              {progress !== undefined && <span className="text-primary font-bold">{progress}%</span>}
                            </>
                          )}
                        </small>
                      </div>
                      <AudioActions audio={part} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    const audio = item;
    const audioName = getAudioName(audio);
    const isActive = activeFilenames.includes(audioName);
    const progress = tasksProgress[audioName];

    return (
      <div className="col-12 mb-3" key={item.key}>
        <div className="card p-3 shadow-2 surface-card border-round">
          <div className="flex flex-column gap-3">
            {/* Título */}
            <div className="flex align-items-center gap-3">
              {audio.thumbnail ? (
                <img
                  src={audio.thumbnail}
                  alt=""
                  className="border-round flex-shrink-0"
                  style={{ width: '3rem', height: '3rem', objectFit: 'cover' }}
                />
              ) : (
                <div className="w-3rem h-3rem bg-primary border-circle flex align-items-center justify-content-center flex-shrink-0">
                  <i className="pi pi-music text-white text-xl"></i>
                </div>
              )}
              <div className="flex flex-column flex-1" style={{ overflow: 'hidden' }}>
                <span className="font-medium text-sm text-overflow-ellipsis overflow-hidden white-space-nowrap">
                  {audio.title || audio.name}
                </span>
                <small className="text-secondary text-xs mt-1 flex align-items-center gap-2 flex-wrap">
                  {formatSize(audio.size)}
                  {formatDuration(audio.duration) && <span>• {formatDuration(audio.duration)}</span>}
                  {isActive && (
                    <>
                      <i className="pi pi-spin pi-spinner text-primary" style={{ fontSize: '0.7rem' }}></i>
                      {progress !== undefined && (
                        <span className="text-primary font-bold">{progress}%</span>
                      )}
                    </>
                  )}
                  • {formatDate(audio.createdAt)}
                </small>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-content-end">
              <AudioActions audio={audio} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center py-5">
        <i className="pi pi-spin pi-spinner text-3xl text-color-secondary"></i>
      </div>
    );
  }

  if (!groupedItems || groupedItems.length === 0) {
    return (
      <div className="flex flex-column align-items-center justify-content-center py-5 text-color-secondary">
        <i className="pi pi-inbox text-5xl mb-3"></i>
        <p className="m-0 text-lg">No hay audios descargados</p>
        <p className="m-0 text-sm">Los audios que descargues aparecerán aquí</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog className="confirm-dialog-responsive" />

      {/* Selector de vista */}
      <div className="flex justify-content-end mb-3">
        <Button
          icon={viewMode === 'table' ? 'pi pi-th-large' : 'pi pi-list'}
          className="p-button-text p-button-sm"
          onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
          tooltip={viewMode === 'table' ? 'Vista Cards' : 'Vista Lista'}
          tooltipOptions={{ position: 'left' }}
        />
      </div>

      {viewMode === 'table' ? (
        <DataTable
          value={groupedItems}
          dataKey="key"
          tableStyle={{ minWidth: '600px' }}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No hay audios disponibles"
          responsiveLayout="scroll"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column expander={(rowData) => rowData.isGroup} style={{ width: '3rem' }} />
          <Column
            field="title"
            header="Título"
            sortable
            style={{ width: '37%' }}
            body={(rowData) => (
              <div className="flex align-items-center gap-2">
                {rowData.thumbnail ? (
                  <img
                    src={rowData.thumbnail}
                    alt=""
                    className="border-round flex-shrink-0"
                    style={{ width: '2.5rem', height: '2.5rem', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="bg-primary border-circle flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '2.5rem', height: '2.5rem' }}
                  >
                    <i className={`pi ${rowData.isGroup ? 'pi-th-large' : 'pi-music'} text-white`}></i>
                  </div>
                )}
                <div style={{ maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <strong>{rowData.title || rowData.name}</strong>
                  {rowData.isGroup ? (
                    <span className="text-color-secondary text-sm"> · {rowData.parts.length} partes</span>
                  ) : (
                    formatDuration(rowData.duration) && (
                      <span className="text-color-secondary text-sm"> · {formatDuration(rowData.duration)}</span>
                    )
                  )}
                  <br />
                  <small style={{ color: '#666' }}>{rowData.isGroup ? 'Dividido en partes' : rowData.name}</small>
                </div>
              </div>
            )}
          />
          <Column
            field="size"
            header="Tamaño"
            sortable
            body={(rowData) => {
              if (rowData.isGroup) return <span>{formatSize(rowData.size)}</span>;

              const audioName = getAudioName(rowData);
              const isActive = activeFilenames.includes(audioName);
              const progress = tasksProgress[audioName];

              return (
                <div className="flex align-items-center gap-2">
                  <span>{formatSize(rowData.size)}</span>
                  {isActive && (
                    <>
                      <i className="pi pi-spin pi-spinner text-primary" title="Archivo en proceso/descarga"></i>
                      {progress !== undefined && (
                        <span className="text-primary font-bold text-xs">{progress}%</span>
                      )}
                    </>
                  )}
                </div>
              );
            }}
            style={{ width: '15%' }}
          />
          <Column
            field="createdAt"
            header="Fecha de Creación"
            sortable
            body={(rowData) => formatDate(rowData.createdAt)}
            style={{ width: '20%' }}
          />
          <Column
            header="Acciones"
            body={(rowData) => rowData.isGroup ? (
              <span className="text-color-secondary text-sm">Expandir para ver partes</span>
            ) : (
              <AudioActions audio={rowData} />
            )}
            style={{ width: '25%' }}
          />
        </DataTable>
      ) : (
        <DataView value={groupedItems} itemTemplate={renderCard} paginator rows={6} />
      )}
    </>
  );
};

export default ListaAudios;
