const STORAGE_KEY = 'activeAudioDownloads';
const LEGACY_STORAGE_KEY = 'activeAudioDownload'; // clave anterior, soportaba solo 1 descarga a la vez

/**
 * Lee el mapa de descargas activas persistido en localStorage.
 * Migra automáticamente la clave legacy (una sola descarga) si todavía existe.
 * @returns {Object} { [filename]: { filename, url, title, thumbnail, duration, timestamp } }
 */
export const getActiveDownloads = () => {
  let map = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) map = JSON.parse(raw) || {};
  } catch (e) {
    map = {};
  }

  const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacyRaw) {
    try {
      const legacy = JSON.parse(legacyRaw);
      if (legacy?.filename && !map[legacy.filename]) {
        map[legacy.filename] = legacy;
      }
    } catch (e) {}
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  return map;
};

export const setActiveDownload = (filename, data) => {
  const map = getActiveDownloads();
  map[filename] = { ...data, filename };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

export const removeActiveDownload = (filename) => {
  const map = getActiveDownloads();
  delete map[filename];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

export const findActiveDownloadByUrl = (url) => {
  const map = getActiveDownloads();
  return Object.values(map).find(entry => entry.url === url) || null;
};
