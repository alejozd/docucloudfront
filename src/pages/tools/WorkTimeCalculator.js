import React, { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";

import "primeicons/primeicons.css";
import "../../styles/WorkTimeCalculator.css";

export default function WorkTimeCalculator() {
  const [entryTime, setEntryTime] = useState(null);
  const [lunchOutTime, setLunchOutTime] = useState(null);
  const [lunchInTime, setLunchInTime] = useState(null);
  const [exitTime, setExitTime] = useState(null);
  const [estimatedExit, setEstimatedExit] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [error, setError] = useState("");

  const toast = React.useRef(null);

  // Cargar desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem("workHours");
    if (saved) {
      const parsed = JSON.parse(saved);
      setEntryTime(parsed.entryTime ? new Date(parsed.entryTime) : null);
      setLunchOutTime(
        parsed.lunchOutTime ? new Date(parsed.lunchOutTime) : null
      );
      setLunchInTime(parsed.lunchInTime ? new Date(parsed.lunchInTime) : null);
      setExitTime(parsed.exitTime ? new Date(parsed.exitTime) : null);
    }
  }, []);

  // Guardar en localStorage cuando cambien los valores
  useEffect(() => {
    const dataToSave = {
      entryTime: entryTime?.toISOString() || null,
      lunchOutTime: lunchOutTime?.toISOString() || null,
      lunchInTime: lunchInTime?.toISOString() || null,
      exitTime: exitTime?.toISOString() || null,
    };
    localStorage.setItem("workHours", JSON.stringify(dataToSave));
  }, [entryTime, lunchOutTime, lunchInTime, exitTime]);

  // Función para convertir dayjs a Date
  const parseDayjsToDate = (time) => {
    if (!time) return null;
    return new Date(time.format("YYYY-MM-DD HH:mm:ss"));
  };

  const formatTimeTo12Hour = (date) => {
    if (!date) return "";
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutes} ${ampm}`;
  };

  const showToast = (summary, detail, severity = "success") => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  const calculate = () => {
    setError("");
    const entry = parseDayjsToDate(entryTime);
    const lunchOut = parseDayjsToDate(lunchOutTime);
    const lunchIn = parseDayjsToDate(lunchInTime);
    const exit = parseDayjsToDate(exitTime);

    // Validaciones
    if (!entry) {
      setError("La hora de entrada es obligatoria.");
      showToast("Error", "La hora de entrada es obligatoria.", "error");
      return;
    }

    if (!lunchOut) {
      setError("La salida a almuerzo es obligatoria.");
      showToast("Error", "La salida a almuerzo es obligatoria.", "error");
      return;
    }

    if (!lunchIn) {
      setError("El regreso del almuerzo es obligatorio.");
      showToast("Error", "El regreso del almuerzo es obligatorio.", "error");
      return;
    }

    if (entry >= lunchOut) {
      setError("La salida a almuerzo debe ser después de la entrada.");
      showToast(
        "Error",
        "La salida a almuerzo debe ser después de la entrada.",
        "error"
      );
      return;
    }

    if (lunchOut >= lunchIn) {
      setError("El regreso del almuerzo debe ser después de la salida.");
      showToast(
        "Error",
        "El regreso del almuerzo debe ser después de la salida.",
        "error"
      );
      return;
    }

    if (exitTime && lunchIn >= exit) {
      setError("La salida real debe ser después del regreso del almuerzo.");
      showToast(
        "Error",
        "La salida real debe ser después del regreso del almuerzo.",
        "error"
      );
      return;
    }

    // Calcular hora estimada de salida
    const workBeforeLunch = (lunchOut - entry) / (1000 * 60 * 60);
    const workAfterLunch = 8.5 - workBeforeLunch;

    const estimatedExitTime = new Date(
      lunchIn.getTime() + workAfterLunch * 60 * 60 * 1000
    );
    setEstimatedExit(formatTimeTo12Hour(estimatedExitTime));

    // Calcular total trabajado si hay salida real
    if (exit) {
      const totalMinutes = (exit - entry - (lunchIn - lunchOut)) / (1000 * 60); // en minutos
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);

      if (minutes === 0) {
        setTotalTime(`${hours} horas`);
      } else {
        setTotalTime(`${hours} horas y ${minutes} minutos`);
      }
    } else {
      setTotalTime("");
    }

    showToast("Éxito", "Cálculo realizado correctamente.");
  };

  return (
    <div className="work-time-calculator">
      <Toast ref={toast} />
      <h2>Calculadora de Jornada Laboral</h2>
      <Card>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {/* Hora de entrada */}
          <div className="p-field">
            <TimePicker
              label="Hora de entrada"
              views={["hours", "minutes"]}
              value={entryTime}
              onChange={(newValue) => setEntryTime(newValue)}
              fullWidth
              slotProps={{
                textField: {
                  InputProps: {
                    startAdornment: (
                      <span style={{ marginRight: 8 }}>
                        <i className="pi pi-sign-in"></i>
                      </span>
                    ),
                  },
                },
              }}
              sx={{
                "& .MuiInputBase-root": { borderRadius: "8px" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ccc",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#7c69ef",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#624de6",
                  boxShadow: "0 0 0 2px rgba(98, 77, 230, 0.2)",
                },
              }}
            />
          </div>

          {/* Salida almuerzo */}
          <div className="p-field">
            <TimePicker
              label="Salida almuerzo"
              views={["hours", "minutes"]}
              value={lunchOutTime}
              onChange={(newValue) => setLunchOutTime(newValue)}
              fullWidth
              slotProps={{
                textField: {
                  InputProps: {
                    startAdornment: (
                      <span style={{ marginRight: 8 }}>
                        <i className="pi pi-apple"></i>
                      </span>
                    ),
                  },
                },
              }}
              sx={{
                "& .MuiInputBase-root": { borderRadius: "8px" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ccc",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#7c69ef",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#624de6",
                  boxShadow: "0 0 0 2px rgba(98, 77, 230, 0.2)",
                },
              }}
            />
          </div>

          {/* Regreso almuerzo */}
          <div className="p-field">
            <TimePicker
              label="Regreso almuerzo"
              views={["hours", "minutes"]}
              value={lunchInTime}
              onChange={(newValue) => setLunchInTime(newValue)}
              fullWidth
              slotProps={{
                textField: {
                  InputProps: {
                    startAdornment: (
                      <span style={{ marginRight: 8 }}>
                        <i className="pi pi-history"></i>
                      </span>
                    ),
                  },
                },
              }}
              sx={{
                "& .MuiInputBase-root": { borderRadius: "8px" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ccc",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#7c69ef",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#624de6",
                  boxShadow: "0 0 0 2px rgba(98, 77, 230, 0.2)",
                },
              }}
            />
          </div>

          {/* Salida real (opcional) */}
          <div className="p-field">
            <TimePicker
              label="Salida real (opcional)"
              views={["hours", "minutes"]}
              value={exitTime}
              onChange={(newValue) => setExitTime(newValue)}
              fullWidth
              slotProps={{
                textField: {
                  InputProps: {
                    startAdornment: (
                      <span style={{ marginRight: 8 }}>
                        <i className="pi pi-sign-out"></i>
                      </span>
                    ),
                  },
                },
              }}
              sx={{
                "& .MuiInputBase-root": { borderRadius: "8px" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ccc",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#7c69ef",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#624de6",
                  boxShadow: "0 0 0 2px rgba(98, 77, 230, 0.2)",
                },
              }}
            />
          </div>

          {/* Botón calcular */}
          <Button
            label="Calcular"
            icon="pi pi-calculator"
            severity="success"
            onClick={calculate}
            style={{ width: "100%" }}
          />
        </LocalizationProvider>

        {/* Mensaje de error */}
        {error && (
          <div className="p-mt-4 p-text-center p-error">
            <i className="pi pi-exclamation-triangle p-mr-2"></i>
            {error}
          </div>
        )}

        {/* Resultados */}
        {(estimatedExit || totalTime) && (
          <Card className="p-mt-4">
            <div style={{ textAlign: "center" }}>
              {estimatedExit && (
                <p>
                  <i className="pi pi-clock p-mr-2"></i>
                  <strong>Hora estimada de salida:</strong> {estimatedExit}
                </p>
              )}
              {totalTime && (
                <p>
                  <i className="pi pi-hourglass p-mr-2"></i>
                  <strong>Total trabajado:</strong> {totalTime}
                </p>
              )}
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
}
