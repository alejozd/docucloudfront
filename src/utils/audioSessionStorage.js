/**
 * Almacenamiento de la sesión del módulo "Audios YouTube" (Utilidades).
 *
 * Antes se guardaba un simple "true" en sessionStorage, que se perdía al
 * cerrar la pestaña, al abrir otra o al reiniciar el navegador, y que además
 * no tenía vencimiento. Ahora se guarda el token firmado por el backend junto
 * con su fecha de expiración en localStorage, de modo que el acceso dura
 * 24 horas en el dispositivo (y se comparte entre pestañas).
 */

const STORAGE_KEY = "docucloud.audioDownloadSession";

// Bandera antigua en sessionStorage. Se limpia para no dejar restos.
const LEGACY_SESSION_KEY = "audioDownloadAuth";

// Respaldo en memoria, usado SOLO cuando localStorage no está disponible
// (modo privado, cuota llena, almacenamiento bloqueado). Nunca debe "revivir"
// una sesión que el usuario o el navegador borraron de localStorage.
let memoryFallback = null;

function safeLocalStorage() {
  try {
    const probe = "__docucloud_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

/**
 * Normaliza un registro guardado y comprueba que siga vigente.
 * @returns {{ token, expiresAt, expiresAtMs } | null}
 */
function normalizeRecord(record) {
  if (!record || typeof record !== "object") return null;
  if (typeof record.token !== "string" || !record.token) return null;

  const expiresAtMs =
    typeof record.expiresAtMs === "number"
      ? record.expiresAtMs
      : new Date(record.expiresAt).getTime();

  if (!Number.isFinite(expiresAtMs)) return null;
  if (expiresAtMs <= Date.now()) return null;

  return {
    token: record.token,
    expiresAt: record.expiresAt,
    expiresAtMs,
  };
}

/**
 * Elimina la bandera antigua basada en sessionStorage.
 */
export function clearLegacyFlag() {
  try {
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch (error) {
    /* sessionStorage no disponible: nada que limpiar */
  }
}

/**
 * Guarda la sesión emitida por el backend.
 * @param {{ token: string, expiresAt: string }} session
 */
export function saveSession({ token, expiresAt }) {
  const record = {
    token,
    expiresAt,
    expiresAtMs: new Date(expiresAt).getTime(),
  };

  memoryFallback = record;

  const storage = safeLocalStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (error) {
      console.warn("No se pudo persistir la sesión en localStorage:", error);
    }
  }

  clearLegacyFlag();
  return record;
}

/**
 * Devuelve la sesión guardada si sigue vigente.
 * Si está vencida o corrupta, la borra y devuelve null.
 * @returns {{ token: string, expiresAt: string, expiresAtMs: number } | null}
 */
export function getStoredSession() {
  const storage = safeLocalStorage();

  // Sin localStorage: mantener la sesión de la pestaña actual en memoria.
  if (!storage) {
    const fromMemory = normalizeRecord(memoryFallback);
    if (!fromMemory) memoryFallback = null;
    return fromMemory;
  }

  let record = null;
  let corrupt = false;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) record = JSON.parse(raw);
  } catch (error) {
    // JSON inválido: se trata como si no hubiera sesión.
    corrupt = true;
  }

  const normalized = normalizeRecord(record);

  if (!normalized) {
    if (record !== null || corrupt) {
      clearSession();
    } else if (memoryFallback) {
      // localStorage está disponible y vacío: el respaldo en memoria ya no
      // aplica (evita "revivir" sesiones borradas desde fuera).
      memoryFallback = null;
    }
    return null;
  }

  return normalized;
}

/**
 * Borra la sesión guardada.
 */
export function clearSession() {
  memoryFallback = null;

  const storage = safeLocalStorage();
  if (storage) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch (error) {
      /* nada que hacer */
    }
  }

  clearLegacyFlag();
}

/**
 * Milisegundos que faltan para que venza la sesión guardada.
 * @returns {number} 0 si no hay sesión válida
 */
export function getMillisecondsUntilExpiry() {
  const session = getStoredSession();
  if (!session) return 0;
  return Math.max(0, session.expiresAtMs - Date.now());
}

export const SESSION_STORAGE_KEY = STORAGE_KEY;
