import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';
const API_KEY = import.meta.env.VITE_API_KEY;

// Verificar si API_KEY está definida
if (!API_KEY) {
  console.warn('⚠️ ADVERTENCIA: VITE_API_KEY no está definida en el archivo .env');
  console.warn('Las llamadas a la API podrían fallar sin una clave válida.');
}

const audioDownloadService = {
  /**
   * Iniciar descarga de audio desde YouTube
   * @param {string} url - URL de YouTube
   */
  startDownload: (url) => {
    return axios.post(`${API_BASE_URL}/api/audio-download/download`, 
      { url },
      { headers: { 'x-api-key': API_KEY } }
    );
  },
  
  /**
   * Verificar estado de una descarga
   * @param {string} filename - Nombre del archivo
   */
  getStatus: (filename) => {
    return axios.get(`${API_BASE_URL}/api/audio-download/status/${filename}`, {
      headers: { 'x-api-key': API_KEY }
    });
  },
  
  /**
   * Listar archivos descargados
   */
  listFiles: () => {
    return axios.get(`${API_BASE_URL}/api/audio-download/files`, {
      headers: { 'x-api-key': API_KEY }
    });
  },
  
  /**
   * Eliminar un archivo descargado
   * @param {string} filename - Nombre del archivo
   */
  deleteFile: (filename) => {
    return axios.delete(`${API_BASE_URL}/api/audio-download/delete/${filename}`, {
      headers: { 'x-api-key': API_KEY }
    });
  },
  
  /**
   * Obtener URL para streaming de audio
   * @param {string} filename - Nombre del archivo
   */
  getStreamUrl: (filename) => {
    return `${API_BASE_URL}/api/audio-download/stream/${filename}?api_key=${API_KEY}`;
  }
};

export default audioDownloadService;
