import React, { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";

import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { RadioButton } from "primereact/radiobutton";

import "primeicons/primeicons.css";
import "../../styles/WorkTimeCalculator.css";

// Helper para validar si es un objeto dayjs válido
const isValidDayjs = (value) => {
  return value && dayjs.isDayjs(value) && value.isValid();
};

// Detecta si el día actual es Viernes (dayjs().day() devuelve 0 para Domingo, 5 para Viernes)
const isFriday = () => {
  return dayjs().day() === 5;
};

export default function WorkTimeCalculator() {
  const [entryTime, setEntryTime] = useState(null);
  const [lunchOutTime, setLunchOutTime] = useState(null);
  const [lunchInTime, setLunchInTime] = useState(null);
  const [exitTime, setExitTime] = useState(null);
  const [jobDuration, setJobDuration] = useState(isFriday() ? 6.0 : 8.5);
  const [estimatedExit, setEstimatedExit] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [error, setError] = useState("");

  const toast = React.useRef(null);

  // Cargar desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("workHours");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Usamos una lógica más robusta para asegurarnos de que la fecha es válida
        setEntryTime(
          parsed.entryTime && dayjs(parsed.entryTime).isValid()
            ? dayjs(parsed.entryTime)
            : null
        );
        setLunchOutTime(
          parsed.lunchOutTime && dayjs(parsed.lunchOutTime).isValid()
            ? dayjs(parsed.lunchOutTime)
            : null
        );
        setLunchInTime(
          parsed.lunchInTime && dayjs(parsed.lunchInTime).isValid()
            ? dayjs(parsed.lunchInTime)
            : null
        );
        setExitTime(
          parsed.exitTime && dayjs(parsed.exitTime).isValid()
            ? dayjs(parsed.exitTime)
            : null
        );
        if (parsed.jobDuration) {
          setJobDuration(parsed.jobDuration);
        } else {
          setJobDuration(isFriday() ? 6.0 : 8.5);
        }
      } else {
        // [NUEVO] Si no hay nada en localStorage, inicializa la duración basada en el día.
        setJobDuration(isFriday() ? 6.0 : 8.5);
      }
    } catch (e) {
      console.error("Error al cargar datos desde localStorage:", e);
      localStorage.removeItem("workHours");
      setJobDuration(isFriday() ? 6.0 : 8.5);
    }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    const dataToSave = {
      // Usamos la función helper para validar antes de guardar
      entryTime: isValidDayjs(entryTime) ? entryTime.toISOString() : null,
      lunchOutTime: isValidDayjs(lunchOutTime)
        ? lunchOutTime.toISOString()
        : null,
      lunchInTime: isValidDayjs(lunchInTime) ? lunchInTime.toISOString() : null,
      exitTime: isValidDayjs(exitTime) ? exitTime.toISOString() : null,
      jobDuration: jobDuration,
    };

    localStorage.setItem("workHours", JSON.stringify(dataToSave));
  }, [entryTime, lunchOutTime, lunchInTime, exitTime, jobDuration]);

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

    const entry = isValidDayjs(entryTime) ? entryTime.toDate() : null;
    const lunchOut = isValidDayjs(lunchOutTime) ? lunchOutTime.toDate() : null;
    const lunchIn = isValidDayjs(lunchInTime) ? lunchInTime.toDate() : null;
    const exit = isValidDayjs(exitTime) ? exitTime.toDate() : null;
    const totalJobDurationHours = jobDuration;

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

    if (exit && lunchIn >= exit) {
      setError("La salida real debe ser después del regreso del almuerzo.");
      showToast(
        "Error",
        "La salida real debe ser después del regreso del almuerzo.",
        "error"
      );
      return;
    }

    const workBeforeLunch =
      (lunchOut.getTime() - entry.getTime()) / (1000 * 60 * 60);
    const workAfterLunch = totalJobDurationHours - workBeforeLunch;

    const estimatedExitTime = new Date(
      lunchIn.getTime() + workAfterLunch * 60 * 60 * 1000
    );
    setEstimatedExit(formatTimeTo12Hour(estimatedExitTime));

    if (exit) {
      const totalMinutes =
        (exit.getTime() -
          entry.getTime() -
          (lunchIn.getTime() - lunchOut.getTime())) /
        (1000 * 60);
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
        <div className="p-field job-duration-selector">
          <label>Duración de la jornada</label>
          <div className="p-formgrid p-grid p-dir-col">
            {[6, 8, 8.5].map((duration) => (
              <div key={duration} className="p-field-radiobutton p-col-fixed">
                <RadioButton
                  inputId={`duration${duration}`}
                  name="jobDuration"
                  value={duration}
                  onChange={(e) => setJobDuration(e.value)}
                  checked={jobDuration === duration}
                />
                <label htmlFor={`duration${duration}`}>{duration} Horas</label>
              </div>
            ))}
          </div>
        </div>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
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

          <Button
            label="Calcular"
            icon="pi pi-calculator"
            severity="success"
            onClick={calculate}
            style={{ width: "100%" }}
          />
        </LocalizationProvider>

        {error && (
          <div className="p-mt-4 p-text-center p-error">
            <i className="pi pi-exclamation-triangle p-mr-2"></i>
            {error}
          </div>
        )}

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
