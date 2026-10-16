import axios from "axios";
import Config from "../components/features/Config";

const API_BASE_URL = process.env.REACT_APP_API_URL || Config.apiUrl || "http://localhost:3100";
const API_KEY = process.env.REACT_APP_API_KEY;

// Verificar si API_KEY está definida
if (!API_KEY) {
  console.warn(
    "⚠️ ADVERTENCIA: REACT_APP_API_KEY no está definida en el archivo .env",
  );
  console.warn("Las llamadas a la API podrían fallar sin una clave válida.");
}

const audioDownloadService = {
  /**
   * Valida la clave de acceso en el SERVIDOR y obtiene una sesión de 24 horas.
   * La clave ya no se compara en el navegador: nunca queda en el bundle.
   * Endpoint público (no requiere x-api-key).
   * @param {string} password - Clave de acceso del módulo
   * @returns {Promise} { ok, token, expiresAt, expiresInHours }
   */
  createSession: (password) => {
    return axios.post(`${API_BASE_URL}/api/audio-download/session`, { password });
  },

  /**
   * Verifica contra el servidor que un token de sesión siga siendo válido.
   * Sirve para detectar revocaciones sin esperar las 24 horas.
   * @param {string} token - Token de sesión
   */
  checkSession: (token) => {
    return axios.get(`${API_BASE_URL}/api/audio-download/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /**
   * Iniciar descarga de audio desde YouTube
   * @param {string} url - URL de YouTube
   */
  startDownload: (url) => {
    return axios.post(
      `${API_BASE_URL}/api/audio-download/download`,
      { url },
      { headers: { "x-api-key": API_KEY } },
    );
  },

  /**
   * Verificar estado de una descarga
   * @param {string} filename - Nombre del archivo
   */
  getStatus: (filename) => {
    return axios.get(
      `${API_BASE_URL}/api/audio-download/status/${encodeURIComponent(filename)}?t=${Date.now()}`,
      {
        headers: { "x-api-key": API_KEY },
      },
    );
  },

  /**
   * Listar archivos descargados
   */
  listFiles: () => {
    return axios.get(`${API_BASE_URL}/api/audio-download/files?t=${Date.now()}`, {
      headers: { "x-api-key": API_KEY },
    });
  },

  /**
   * Eliminar un archivo descargado
   * @param {string} filename - Nombre del archivo
   */
  deleteFile: (filename) => {
    return axios.delete(
      `${API_BASE_URL}/api/audio-download/delete/${encodeURIComponent(filename)}`,
      {
        headers: { "x-api-key": API_KEY },
      },
    );
  },

  /**
   * Obtener URL para streaming de audio
   * @param {string} filename - Nombre del archivo
   */
  getStreamUrl: (filename) => {
    if (!API_KEY) {
      console.error("❌ REACT_APP_API_KEY NO ESTÁ DEFINIDA");
      return null;
    }

    if (!API_BASE_URL) {
      console.error("❌ REACT_APP_API_URL NO ESTÁ DEFINIDA");
      return null;
    }

    const encodedFilename = encodeURIComponent(filename);
    // IMPORTANTE: También codificar la API key porque tiene caracteres especiales
    // Codificación completa incluyendo caracteres que encodeURIComponent ignora (*, !, ', (, ))
    const encodedApiKey = encodeURIComponent(API_KEY).replace(
      /[!'()*]/g,
      (c) => {
        return "%" + c.charCodeAt(0).toString(16).toUpperCase();
      },
    );

    const url = `${API_BASE_URL}/api/audio-download/download/${encodedFilename}?api_key=${encodedApiKey}`;
    return url;
  },

  /**
   * Genera un token temporal para streaming de audio
   * @param {string} filename - Nombre del archivo
   * @returns {Promise} Promesa con el token y URL de streaming
   */
  generateStreamToken: async (filename) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/audio-download/generate-token`,
        { filename },
        { headers: { "x-api-key": API_KEY } }
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Error generando token:', error);
      throw error;
    }
  },

  /**
   * Iniciar procesamiento de audio (volumen, split, etc.)
   * @param {string} filename - Nombre del archivo original
   * @param {Array} operations - Lista de operaciones [{ type, level/interval }]
   */
  processAudio: (filename, operations) => {
    return axios.post(
      `${API_BASE_URL}/api/audio-download/process`,
      { filename, operations },
      { headers: { "x-api-key": API_KEY } },
    );
  },

  /**
   * Verificar estado de un procesamiento
   * @param {string} taskId - ID de la tarea
   */
  getProcessStatus: (taskId) => {
    return axios.get(
      `${API_BASE_URL}/api/audio-download/process-status/${encodeURIComponent(taskId)}?t=${Date.now()}`,
      { headers: { "x-api-key": API_KEY } },
    );
  },
};

export default audioDownloadService;
