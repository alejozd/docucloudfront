import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3100';

const audioDownloadService = {
  /**
   * Iniciar descarga de audio desde YouTube
   * @param {string} url - URL de YouTube
   * @param {string} apiKey - API Key para autenticación
   */
  startDownload: (url, apiKey) => {
    return axios.post(`${API_BASE_URL}/api/audio-download/download`, 
      { url },
      { headers: { 'x-api-key': apiKey } }
    );
  },
  
  /**
   * Verificar estado de una descarga
   * @param {string} filename - Nombre del archivo
   * @param {string} apiKey - API Key para autenticación
   */
  getStatus: (filename, apiKey) => {
    return axios.get(`${API_BASE_URL}/api/audio-download/status/${filename}`, {
      headers: { 'x-api-key': apiKey }
    });
  },
  
  /**
   * Listar archivos descargados
   * @param {string} apiKey - API Key para autenticación
   */
  listFiles: (apiKey) => {
    return axios.get(`${API_BASE_URL}/api/audio-download/files`, {
      headers: { 'x-api-key': apiKey }
    });
  },
  
  /**
   * Eliminar un archivo descargado
   * @param {string} filename - Nombre del archivo
   * @param {string} apiKey - API Key para autenticación
   */
  deleteFile: (filename, apiKey) => {
    return axios.delete(`${API_BASE_URL}/api/audio-download/delete/${filename}`, {
      headers: { 'x-api-key': apiKey }
    });
  },
  
  /**
   * Obtener URL para streaming de audio
   * @param {string} filename - Nombre del archivo
   * @param {string} apiKey - API Key para autenticación
   */
  getStreamUrl: (filename, apiKey) => {
    return `${API_BASE_URL}/api/audio-download/download/${filename}?api_key=${apiKey}`;
  }
};

export default audioDownloadService;
