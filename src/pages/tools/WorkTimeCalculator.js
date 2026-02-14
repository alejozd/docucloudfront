import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";

import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { SelectButton } from "primereact/selectbutton";
import { Tag } from "primereact/tag";

import "primeicons/primeicons.css";
import "../../styles/WorkTimeCalculator.css";

const LOCAL_STORAGE_KEY = "workHours";

const isValidDayjs = (value) => value && dayjs.isDayjs(value) && value.isValid();
const isFriday = () => dayjs().day() === 5;

const durationOptions = [
  { label: "6h", value: 6 },
  { label: "8h", value: 8 },
  { label: "8.5h", value: 8.5 },
];

const timeFields = [
  { key: "entryTime", label: "Hora de entrada", icon: "pi-sign-in", required: true },
  { key: "lunchOutTime", label: "Salida almuerzo", icon: "pi-apple", required: true },
  { key: "lunchInTime", label: "Regreso almuerzo", icon: "pi-history", required: true },
  { key: "exitTime", label: "Salida real (opcional)", icon: "pi-sign-out", required: false },
];

const formatTimeTo12Hour = (date) => (date ? dayjs(date).format("hh:mm A") : "");

const parsePersistedTime = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const normalizeDuration = (value) => {
  const numeric = Number(value);
  return durationOptions.some((opt) => opt.value === numeric) ? numeric : isFriday() ? 6 : 8.5;
};

const calculateWorkedMinutes = ({ entry, lunchOut, lunchIn, exit }) => {
  return (exit.getTime() - entry.getTime() - (lunchIn.getTime() - lunchOut.getTime())) / (1000 * 60);
};

export default function WorkTimeCalculator() {
  const [entryTime, setEntryTime] = useState(null);
  const [lunchOutTime, setLunchOutTime] = useState(null);
  const [lunchInTime, setLunchInTime] = useState(null);
  const [exitTime, setExitTime] = useState(null);
  const [jobDuration, setJobDuration] = useState(isFriday() ? 6 : 8.5);
  const [estimatedExit, setEstimatedExit] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [error, setError] = useState("");

  const toast = useRef(null);

  const timeState = useMemo(
    () => ({ entryTime, lunchOutTime, lunchInTime, exitTime }),
    [entryTime, lunchOutTime, lunchInTime, exitTime]
  );

  const completion = useMemo(() => {
    const requiredCount = timeFields.filter((field) => field.required).length;
    const completed = timeFields.filter((field) => field.required && isValidDayjs(timeState[field.key])).length;
    return `${completed}/${requiredCount}`;
  }, [timeState]);

  const showToast = useCallback((summary, detail, severity = "success") => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const hydrateFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      setEntryTime(parsePersistedTime(parsed.entryTime));
      setLunchOutTime(parsePersistedTime(parsed.lunchOutTime));
      setLunchInTime(parsePersistedTime(parsed.lunchInTime));
      setExitTime(parsePersistedTime(parsed.exitTime));
      setJobDuration(normalizeDuration(parsed.jobDuration));
    } catch (storageError) {
      console.error("Error al cargar localStorage", storageError);
      showToast("Advertencia", "No se pudieron cargar datos guardados.", "warn");
    }
  }, [showToast]);

  useEffect(() => {
    hydrateFromLocalStorage();
  }, [hydrateFromLocalStorage]);

  useEffect(() => {
    const payload = {
      entryTime: isValidDayjs(entryTime) ? entryTime.toISOString() : null,
      lunchOutTime: isValidDayjs(lunchOutTime) ? lunchOutTime.toISOString() : null,
      lunchInTime: isValidDayjs(lunchInTime) ? lunchInTime.toISOString() : null,
      exitTime: isValidDayjs(exitTime) ? exitTime.toISOString() : null,
      jobDuration,
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  }, [entryTime, lunchOutTime, lunchInTime, exitTime, jobDuration]);

  const validateTimes = () => {
    if (!isValidDayjs(entryTime) || !isValidDayjs(lunchOutTime) || !isValidDayjs(lunchInTime)) {
      return "Completa hora de entrada, salida y regreso de almuerzo.";
    }

    const entry = entryTime.toDate();
    const lunchOut = lunchOutTime.toDate();
    const lunchIn = lunchInTime.toDate();

    if (lunchOut <= entry) return "La salida a almuerzo debe ser después de la entrada.";
    if (lunchIn <= lunchOut) return "El regreso de almuerzo debe ser posterior a la salida.";

    if (isValidDayjs(exitTime)) {
      const exit = exitTime.toDate();
      if (exit <= lunchIn) return "La salida real debe ser posterior al regreso de almuerzo.";
    }

    return "";
  };

  const calculate = () => {
    setError("");
    const validationError = validateTimes();

    if (validationError) {
      setError(validationError);
      showToast("Error", validationError, "error");
      return;
    }

    const entry = entryTime.toDate();
    const lunchOut = lunchOutTime.toDate();
    const lunchIn = lunchInTime.toDate();

    const workBeforeLunchHours = (lunchOut.getTime() - entry.getTime()) / (1000 * 60 * 60);
    const pendingHours = jobDuration - workBeforeLunchHours;

    if (pendingHours < 0) {
      const message = "Ya superaste la duración seleccionada antes del almuerzo.";
      setError(message);
      setEstimatedExit(formatTimeTo12Hour(lunchIn));
      setTotalTime("");
      showToast("Aviso", message, "warn");
      return;
    }

    const estimatedExitDate = new Date(lunchIn.getTime() + pendingHours * 60 * 60 * 1000);
    setEstimatedExit(formatTimeTo12Hour(estimatedExitDate));

    if (isValidDayjs(exitTime)) {
      const exit = exitTime.toDate();
      const totalMinutes = calculateWorkedMinutes({ entry, lunchOut, lunchIn, exit });
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      setTotalTime(`${hours}h ${minutes}m`);
    } else {
      setTotalTime("");
    }

    showToast("Éxito", "Cálculo realizado correctamente.");
  };

  const handleReset = () => {
    setEntryTime(null);
    setLunchOutTime(null);
    setLunchInTime(null);
    setExitTime(null);
    setEstimatedExit("");
    setTotalTime("");
    setError("");
    setJobDuration(isFriday() ? 6 : 8.5);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    showToast("Info", "Datos limpiados", "info");
  };

  const fieldSetters = {
    entryTime: setEntryTime,
    lunchOutTime: setLunchOutTime,
    lunchInTime: setLunchInTime,
    exitTime: setExitTime,
  };

  return (
    <div className="work-time-calculator">
      <Toast ref={toast} />

      <div className="work-time-header">
        <h2>Calculadora de Jornada Laboral</h2>
        <p>Calcula salida estimada y total trabajado en segundos.</p>
      </div>

      <Card className="main-card">
        <div className="work-time-hero">
          <Tag value={`Jornada ${jobDuration}h`} icon="pi pi-briefcase" severity="info" />
          <Tag value={`Campos completos ${completion}`} icon="pi pi-check-circle" severity="success" />
        </div>

        <div className="p-field job-duration-selector">
          <label className="section-title">Duración de la jornada</label>
          <SelectButton
            value={jobDuration}
            options={durationOptions}
            onChange={(event) => setJobDuration(event.value)}
            className="custom-segmented-control"
          />
        </div>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <div className="time-pickers-container">
            {timeFields.map((field) => {
              const value = timeState[field.key];
              const setValue = fieldSetters[field.key];

              return (
                <div className="p-field" key={field.key}>
                  <TimePicker
                    label={field.label}
                    value={value}
                    onChange={(newValue) => setValue(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: field.required,
                        InputProps: {
                          startAdornment: (
                            <span style={{ marginRight: 8, color: value ? "#624de6" : "#999" }}>
                              <i className={`pi ${field.icon}`}></i>
                            </span>
                          ),
                        },
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="button-group">
            <Button
              label="Calcular"
              icon="pi pi-calculator"
              onClick={calculate}
              className="calculate-btn"
            />
            <Button
              label="Limpiar"
              icon="pi pi-refresh"
              onClick={handleReset}
              className="reset-btn"
            />
          </div>
        </LocalizationProvider>

        {error && (
          <div className="p-error-message">
            <i className="pi pi-exclamation-circle"></i> {error}
          </div>
        )}

        {(estimatedExit || totalTime) && (
          <div className="result-fade-in">
            <Card className="result-card">
              <div className="result-grid">
                {estimatedExit && (
                  <div className="result-block">
                    <div className="result-icon-box">
                      <i className="pi pi-clock"></i>
                    </div>
                    <div className="result-info">
                      <span className="result-label">Salida estimada</span>
                      <span className="result-value">{estimatedExit}</span>
                    </div>
                  </div>
                )}

                {estimatedExit && totalTime && <div className="result-divider"></div>}

                {totalTime && (
                  <div className="result-block">
                    <div className="result-icon-box accent">
                      <i className="pi pi-hourglass"></i>
                    </div>
                    <div className="result-info">
                      <span className="result-label">Total trabajado</span>
                      <span className="result-value">{totalTime}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}
