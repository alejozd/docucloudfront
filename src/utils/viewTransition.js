import { flushSync } from "react-dom";

/**
 * Ejecuta una actualizacion de estado dentro de una View Transition cuando el
 * navegador la soporta. Si no hay soporte, o el usuario pidio menos movimiento,
 * la actualizacion se aplica igual sin animacion.
 */
export function conTransicion(actualizar) {
  const sinSoporte =
    typeof document === "undefined" ||
    typeof document.startViewTransition !== "function";

  const menosMovimiento =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (sinSoporte || menosMovimiento) {
    actualizar();
    return;
  }

  document.startViewTransition(() => {
    flushSync(actualizar);
  });
}
