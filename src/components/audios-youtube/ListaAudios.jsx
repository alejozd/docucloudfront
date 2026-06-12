import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataView } from 'primereact/dataview';
import audioDownloadService from '../../services/audioDownloadService';

/**
 * Lista de archivos de audio descargados
 */
const ListaAudios = ({ files, onPlay, onDelete, onProcess, loading }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' o 'cards'

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

  const getAudioName = (rowData) => rowData?.name || rowData?.filename || rowData?.titulo || '';
  
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
   * Botón de reproducir
   */
  const playActionTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-play"
        className="p-button-sm"
        severity="success"
        rounded
        onClick={() => onPlay(rowData)}
        tooltip="Reproducir"
        tooltipOptions={{ position: 'top' }}
      />
    );
  };

  /**
   * Renderizar cards para móvil
   */
  const renderCard = (audio) => {
    return (
      <div className="col-12 mb-3">
        <div className="card p-3 shadow-2 surface-card border-round">
          <div className="flex flex-column gap-3">
            {/* Título */}
            <div className="flex align-items-center gap-3">
              <div className="w-3rem h-3rem bg-primary border-circle flex align-items-center justify-content-center flex-shrink-0">
                <i className="pi pi-music text-white text-xl"></i>
              </div>
              <div className="flex flex-column flex-1" style={{ overflow: 'hidden' }}>
                <span className="font-medium text-sm text-overflow-ellipsis overflow-hidden white-space-nowrap">
                  {audio.title || audio.name}
                </span>
                <small className="text-secondary text-xs mt-1">
                  {formatSize(audio.size)} • {formatDate(audio.createdAt)}
                </small>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 justify-content-end">
              <Button
                icon="pi pi-play"
                className="p-button-rounded p-button-success p-button-sm"
                onClick={() => onPlay(audio)}
                tooltip="Reproducir"
              />
              <Button
                icon="pi pi-download"
                className="p-button-rounded p-button-info p-button-sm"
                onClick={() => handleDownload(audio)}
                tooltip="Descargar"
              />
              <Button
                icon="pi pi-cog"
                className="p-button-rounded p-button-secondary p-button-sm"
                onClick={() => onProcess(audio)}
                tooltip="Procesar"
              />
              <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-danger p-button-sm"
                onClick={() => confirmDelete(audio)}
                tooltip="Eliminar"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Botón de descargar
   */
  const downloadActionTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-download"
        severity="success"
        rounded
        onClick={() => handleDownload(rowData)}
        tooltip="Descargar MP3"
        tooltipOptions={{ position: 'top' }}
      />
    );
  };

  /**
   * Botón de eliminar con confirmación
   */
  const deleteActionTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-trash"
        className="p-button-sm"
        severity="danger"
        rounded
        onClick={() => confirmDelete(rowData)}
        tooltip="Eliminar"
        tooltipOptions={{ position: 'top' }}
      />
    );
  };

  /**
   * Ordenar archivos por fecha (más reciente primero)
   */
  const sortedFiles = React.useMemo(() => {
    if (!files || files.length === 0) return [];

    return [...files].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.fecha || 0);
      const dateB = new Date(b.createdAt || b.fecha || 0);
      return dateB - dateA;
    });
  }, [files]);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center py-5">
        <i className="pi pi-spin pi-spinner text-3xl text-color-secondary"></i>
      </div>
    );
  }

  if (!sortedFiles || sortedFiles.length === 0) {
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
      <ConfirmDialog className="confirm-dialog-responsive" containerClassName="confirm-dialog-responsive" />

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
          value={sortedFiles}
          tableStyle={{ minWidth: '600px' }}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No hay audios disponibles"
          responsiveLayout="scroll"
        >
          <Column
            field="title"
            header="Título"
            sortable
            style={{ width: '40%' }}
            body={(rowData) => (
              <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <strong>{rowData.title || rowData.name}</strong>
                <br />
                <small style={{ color: '#666' }}>{rowData.name}</small>
              </div>
            )}
          />
          <Column
            field="size"
            header="Tamaño"
            sortable
            body={(rowData) => formatSize(rowData.size)}
            style={{ width: '15%' }}
          />
          <Column
            field="createdAt"
            header="Fecha de Creación"
            sortable
            body={(rowData) => formatDate(rowData.createdAt)}
            style={{ width: '25%' }}
          />
          <Column
            header="Acciones"
            body={(rowData) => (
              <div className="flex gap-2">
                {playActionTemplate(rowData)}
                {downloadActionTemplate(rowData)}
              <Button
                icon="pi pi-cog"
                className="p-button-sm"
                severity="secondary"
                rounded
                onClick={() => onProcess(rowData)}
                tooltip="Procesar Audio"
                tooltipOptions={{ position: 'top' }}
              />
                {deleteActionTemplate(rowData)}
              </div>
            )}
          style={{ width: '25%' }}
          />
        </DataTable>
      ) : (
        <DataView value={sortedFiles} itemTemplate={renderCard} paginator rows={6} />
      )}
    </>
  );
};

export default ListaAudios;
