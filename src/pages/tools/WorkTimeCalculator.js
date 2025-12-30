import React, { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";

import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { SelectButton } from "primereact/selectbutton";

import "primeicons/primeicons.css";
import "../../styles/WorkTimeCalculator.css";

const isValidDayjs = (value) =>
  value && dayjs.isDayjs(value) && value.isValid();
const isFriday = () => dayjs().day() === 5;

const durationOptions = [
  { label: "6h", value: 6 },
  { label: "8h", value: 8 },
  { label: "8.5h", value: 8.5 },
];

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("workHours");
      if (saved) {
        const parsed = JSON.parse(saved);
        setEntryTime(parsed.entryTime ? dayjs(parsed.entryTime) : null);
        setLunchOutTime(
          parsed.lunchOutTime ? dayjs(parsed.lunchOutTime) : null
        );
        setLunchInTime(parsed.lunchInTime ? dayjs(parsed.lunchInTime) : null);
        setExitTime(parsed.exitTime ? dayjs(parsed.exitTime) : null);
        if (parsed.jobDuration) setJobDuration(parsed.jobDuration);
      }
    } catch (e) {
      console.error("Error al cargar localStorage", e);
    }
  }, []);

  useEffect(() => {
    const dataToSave = {
      entryTime: isValidDayjs(entryTime) ? entryTime.toISOString() : null,
      lunchOutTime: isValidDayjs(lunchOutTime)
        ? lunchOutTime.toISOString()
        : null,
      lunchInTime: isValidDayjs(lunchInTime) ? lunchInTime.toISOString() : null,
      exitTime: isValidDayjs(exitTime) ? exitTime.toISOString() : null,
      jobDuration,
    };
    localStorage.setItem("workHours", JSON.stringify(dataToSave));
  }, [entryTime, lunchOutTime, lunchInTime, exitTime, jobDuration]);

  const formatTimeTo12Hour = (date) => {
    if (!date) return "";
    return dayjs(date).format("hh:mm A");
  };

  const showToast = (summary, detail, severity = "success") => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  const calculate = () => {
    setError("");
    if (
      !isValidDayjs(entryTime) ||
      !isValidDayjs(lunchOutTime) ||
      !isValidDayjs(lunchInTime)
    ) {
      setError("Faltan campos obligatorios.");
      showToast("Error", "Completa la entrada y el almuerzo.", "error");
      return;
    }

    const entry = entryTime.toDate();
    const lunchOut = lunchOutTime.toDate();
    const lunchIn = lunchInTime.toDate();

    const workBeforeLunch =
      (lunchOut.getTime() - entry.getTime()) / (1000 * 60 * 60);
    const workAfterLunch = jobDuration - workBeforeLunch;

    const estExit = new Date(
      lunchIn.getTime() + workAfterLunch * 60 * 60 * 1000
    );
    setEstimatedExit(formatTimeTo12Hour(estExit));

    if (isValidDayjs(exitTime)) {
      const exit = exitTime.toDate();
      const totalMinutes =
        (exit.getTime() -
          entry.getTime() -
          (lunchIn.getTime() - lunchOut.getTime())) /
        (1000 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      setTotalTime(`${hours}h ${minutes}m`);
    } else {
      setTotalTime("");
    }
    showToast("Éxito", "Cálculo realizado.");
  };

  const handleReset = () => {
    setEntryTime(null);
    setLunchOutTime(null);
    setLunchInTime(null);
    setExitTime(null);
    setEstimatedExit("");
    setTotalTime("");
    setError("");
    localStorage.removeItem("workHours");
    showToast("Info", "Datos limpiados", "info");
  };

  return (
    <div className="work-time-calculator">
      <Toast ref={toast} />
      <h2>Calculadora de Jornada Laboral</h2>
      <Card className="main-card">
        <div className="p-field job-duration-selector">
          <label className="section-title">Duración de la jornada</label>
          <SelectButton
            value={jobDuration}
            options={durationOptions}
            onChange={(e) => setJobDuration(e.value)}
            className="custom-segmented-control"
          />
        </div>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <div className="time-pickers-container">
            {[
              {
                label: "Hora de entrada",
                val: entryTime,
                set: setEntryTime,
                icon: "pi-sign-in",
              },
              {
                label: "Salida almuerzo",
                val: lunchOutTime,
                set: setLunchOutTime,
                icon: "pi-apple",
              },
              {
                label: "Regreso almuerzo",
                val: lunchInTime,
                set: setLunchInTime,
                icon: "pi-history",
              },
              {
                label: "Salida real (opcional)",
                val: exitTime,
                set: setExitTime,
                icon: "pi-sign-out",
              },
            ].map((field, idx) => (
              <div className="p-field" key={idx}>
                <TimePicker
                  label={field.label}
                  value={field.val}
                  onChange={(v) => field.set(v)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      InputProps: {
                        startAdornment: (
                          <span
                            style={{
                              marginRight: 8,
                              color: field.val ? "#624de6" : "#999",
                            }}
                          >
                            <i className={`pi ${field.icon}`}></i>
                          </span>
                        ),
                      },
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#e0e0e0",
                    },
                  }}
                />
              </div>
            ))}
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

                {/* Divisor visual si ambos existen */}
                {estimatedExit && totalTime && (
                  <div className="result-divider"></div>
                )}

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
