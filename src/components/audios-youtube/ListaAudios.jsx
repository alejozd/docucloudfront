import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

/**
 * Lista de archivos de audio descargados
 */
const ListaAudios = ({ files, onPlay, onDelete, loading }) => {
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

  const handleDownload = (rowData) => {
    const apiKey = process.env.REACT_APP_API_KEY;
    const apiUrl = process.env.REACT_APP_API_URL;
    const audioName = getAudioName(rowData);

    if (!apiKey) {
      console.error('REACT_APP_API_KEY no está definida');
      alert('Error: API Key no configurada');
      return;
    }

    if (!apiUrl) {
      console.error('REACT_APP_API_URL no está definida');
      alert('Error: URL de API no configurada');
      return;
    }

    if (!audioName) {
      console.error('No se encontró el nombre del archivo para descargar', rowData);
      alert('Error: nombre de archivo no disponible');
      return;
    }

    // Codificar el nombre del archivo para URL
    const encodedFilename = encodeURIComponent(audioName);

    // Construir URL con API key como query parameter
    const downloadUrl = `${apiUrl}/api/audio-download/download/${encodedFilename}?api_key=${apiKey}`;

    // Abrir en nueva pestaña
    window.open(downloadUrl, '_blank');
  };

  const confirmDelete = (rowData) => {
    const audioName = getAudioName(rowData);

    confirmDialog({
      message: `¿Eliminar "${audioName}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => onDelete({ ...rowData, filename: audioName }),
      reject: () => {}
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
      <ConfirmDialog />
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
              {deleteActionTemplate(rowData)}
            </div>
          )}
          style={{ width: '20%' }}
        />
      </DataTable>
    </>
  );
};

export default ListaAudios;
