// Convierte una fecha en formato ISO o UTC a una fecha local
export const convertToLocalDate = (fecha) => {
  if (!fecha) return null;

  const fechaUtc = new Date(fecha);
  return new Date(
    fechaUtc.getUTCFullYear(),
    fechaUtc.getUTCMonth(),
    fechaUtc.getUTCDate()
  );
};

// Formatea una fecha en formato dd/mm/yyyy
export const formatDate = (fecha) => {
  if (!fecha) return "";

  let date;
  if (typeof fecha === "string") {
    // Si es una cadena, asumimos que está en formato ISO o UTC
    date = new Date(fecha);
  } else if (fecha instanceof Date) {
    // Si ya es un objeto Date, usamos directamente
    date = fecha;
  } else {
    return ""; // Manejar casos inválidos
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
