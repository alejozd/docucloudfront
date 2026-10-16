import {
  saveSession,
  getStoredSession,
  clearSession,
  getMillisecondsUntilExpiry,
  clearLegacyFlag,
  SESSION_STORAGE_KEY,
} from "../audioSessionStorage";

const HOUR = 60 * 60 * 1000;

const makeSession = (hoursFromNow = 24) => ({
  token: "token-de-prueba",
  expiresAt: new Date(Date.now() + hoursFromNow * HOUR).toISOString(),
});

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("audioSessionStorage", () => {
  it("no devuelve sesión cuando no hay nada guardado", () => {
    expect(getStoredSession()).toBeNull();
    expect(getMillisecondsUntilExpiry()).toBe(0);
  });

  it("guarda y recupera una sesión vigente", () => {
    const session = makeSession(24);
    saveSession(session);

    const stored = getStoredSession();
    expect(stored).not.toBeNull();
    expect(stored.token).toBe(session.token);
    expect(stored.expiresAt).toBe(session.expiresAt);
    expect(stored.expiresAtMs).toBe(new Date(session.expiresAt).getTime());
  });

  it("persiste en localStorage (sobrevive a cerrar la pestaña)", () => {
    saveSession(makeSession(24));

    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw).token).toBe("token-de-prueba");
  });

  it("NO usa sessionStorage (causa de que pidiera la clave a cada rato)", () => {
    saveSession(makeSession(24));

    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("descarta y borra una sesión vencida", () => {
    saveSession(makeSession(-1));

    expect(getStoredSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("mantiene la sesión hasta justo antes de las 24 horas", () => {
    saveSession({
      token: "casi-vencida",
      expiresAt: new Date(Date.now() + 1000).toISOString(),
    });

    expect(getStoredSession()).not.toBeNull();
    expect(getMillisecondsUntilExpiry()).toBeGreaterThan(0);
  });

  it("ignora registros corruptos o sin token", () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, "no-es-json");
    expect(getStoredSession()).toBeNull();

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ expiresAt: new Date(Date.now() + HOUR).toISOString() }),
    );
    expect(getStoredSession()).toBeNull();

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ token: "x", expiresAt: "fecha-invalida" }),
    );
    expect(getStoredSession()).toBeNull();
  });

  it("no revive desde memoria una sesión borrada por fuera", () => {
    saveSession(makeSession(24));

    // Simula que el usuario (o el navegador) borra el almacenamiento.
    window.localStorage.clear();

    expect(getStoredSession()).toBeNull();
  });

  it("mantiene la sesión en memoria si localStorage está bloqueado", () => {
    const spy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("almacenamiento bloqueado");
      });

    saveSession(makeSession(24));

    // Sin persistencia disponible, al menos la pestaña actual no vuelve a pedir la clave.
    expect(getStoredSession()).not.toBeNull();
    expect(getStoredSession().token).toBe("token-de-prueba");

    spy.mockRestore();
  });

  it("clearSession elimina la sesión guardada", () => {
    saveSession(makeSession(24));
    clearSession();

    expect(getStoredSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("limpia la bandera antigua de sessionStorage", () => {
    window.sessionStorage.setItem("audioDownloadAuth", "true");

    clearLegacyFlag();

    expect(window.sessionStorage.getItem("audioDownloadAuth")).toBeNull();
  });

  it("saveSession elimina la bandera antigua de sessionStorage", () => {
    window.sessionStorage.setItem("audioDownloadAuth", "true");

    saveSession(makeSession(24));

    expect(window.sessionStorage.getItem("audioDownloadAuth")).toBeNull();
  });

  it("calcula el tiempo restante en milisegundos", () => {
    saveSession(makeSession(1));

    const remaining = getMillisecondsUntilExpiry();
    expect(remaining).toBeGreaterThan(59 * 60 * 1000);
    expect(remaining).toBeLessThanOrEqual(1 * HOUR);
  });
});
