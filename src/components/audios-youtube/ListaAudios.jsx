import React, { useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

/**
 * Lista de archivos de audio descargados
 */
const ListaAudios = ({ files, onPlay, onDelete, loading }) => {
  const toastRef = useRef(null);

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

  /**
   * Botón de reproducir
   */
  const playActionTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-play"
        className="p-button-rounded p-button-success p-button-sm"
        onClick={() => onPlay(rowData)}
        tooltip="Reproducir"
      />
    );
  };

  /**
   * Botón de descargar
   */
  const downloadActionTemplate = (rowData) => {
    const handleDownload = () => {
      // Crear enlace temporal para descargar
      const link = document.createElement('a');
      link.href = rowData.downloadUrl;
      link.download = rowData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <Button
        icon="pi pi-download"
        className="p-button-rounded p-button-info p-button-sm"
        onClick={handleDownload}
        tooltip="Descargar"
      />
    );
  };

  /**
   * Botón de eliminar con confirmación
   */
  const deleteActionTemplate = (rowData) => {
    const confirmDelete = () => {
      confirmDialog({
        message: `¿Está seguro que desea eliminar el archivo "${rowData.filename}"?`,
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        accept: () => onDelete(rowData),
        reject: () => {}
      });
    };

    return (
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger p-button-sm"
        onClick={confirmDelete}
        tooltip="Eliminar"
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
          field="filename" 
          header="Nombre del Archivo" 
          sortable
          style={{ width: '40%' }}
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
