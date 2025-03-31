import React, { useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./WorkTimeCalculator.css";

const WorkTimeCalculator = () => {
  const [entryTime, setEntryTime] = useState(null);
  const [lunchOutTime, setLunchOutTime] = useState(null);
  const [lunchInTime, setLunchInTime] = useState(null);
  const [exitTime, setExitTime] = useState(null);
  const [estimatedExit, setEstimatedExit] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [error, setError] = useState("");

  const formatTimeTo12Hour = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours || 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  };

  const calculate = () => {
    setError("");
    if (!entryTime || !lunchOutTime || !lunchInTime) {
      setError("Por favor, complete todas las horas requeridas.");
      return;
    }

    const workBeforeLunch = (lunchOutTime - entryTime) / (1000 * 60 * 60);
    const workAfterLunch = 8.5 - workBeforeLunch;
    const estimatedExitTime = new Date(
      lunchInTime.getTime() + workAfterLunch * 60 * 60 * 1000
    );
    setEstimatedExit(formatTimeTo12Hour(estimatedExitTime));

    if (entryTime && exitTime) {
      const totalWorked =
        (exitTime - entryTime - (lunchInTime - lunchOutTime)) / (1000 * 60);
      const hours = Math.floor(totalWorked / 60);
      const minutes = Math.round(totalWorked % 60); // Redondear los minutos

      // Condicionar la visualización de los minutos
      if (minutes === 0) {
        setTotalTime(`${hours} horas`);
      } else {
        setTotalTime(`${hours} horas y ${minutes} minutos`);
      }
    } else {
      setTotalTime("");
    }
  };

  return (
    <div className="work-time-calculator p-4">
      <h2 className="text-center">Calculadora de Jornada Laboral</h2>
      <Card className="p-mt-4">
        <div className="p-fluid">
          {/* Campo Hora de entrada */}
          <div className="p-field">
            <label htmlFor="entryTime">📅 Hora de entrada</label>
            <Calendar
              id="entryTime"
              value={entryTime}
              onChange={(e) => setEntryTime(e.value)}
              showTime
              timeOnly
              hourFormat="12"
              className="p-inputtext-sm"
            />
          </div>

          {/* Campo Salida almuerzo */}
          <div className="p-field">
            <label htmlFor="lunchOutTime">🍽️ Salida almuerzo</label>
            <Calendar
              id="lunchOutTime"
              value={lunchOutTime}
              onChange={(e) => setLunchOutTime(e.value)}
              showTime
              timeOnly
              hourFormat="12"
              className="p-inputtext-sm"
            />
          </div>

          {/* Campo Regreso almuerzo */}
          <div className="p-field">
            <label htmlFor="lunchInTime">📅 Regreso almuerzo</label>
            <Calendar
              id="lunchInTime"
              value={lunchInTime}
              onChange={(e) => setLunchInTime(e.value)}
              showTime
              timeOnly
              hourFormat="12"
              className="p-inputtext-sm"
            />
          </div>

          {/* Campo Salida real */}
          <div className="p-field">
            <label htmlFor="exitTime">⏰ Salida real (opcional)</label>
            <Calendar
              id="exitTime"
              value={exitTime}
              onChange={(e) => setExitTime(e.value)}
              showTime
              timeOnly
              hourFormat="12"
              className="p-inputtext-sm"
            />
          </div>
        </div>

        {/* Botón Calcular */}
        <div className="p-d-flex p-jc-center p-mt-4">
          <Button
            label="Calcular"
            icon="pi pi-calculator"
            severity="success"
            rounded
            onClick={calculate}
          />
        </div>

        {/* Resultados */}
        {error && (
          <div className="p-mt-4 p-text-center p-error">
            <i className="pi pi-exclamation-triangle p-mr-2"></i>
            {error}
          </div>
        )}
        {estimatedExit || totalTime ? (
          <Card className="p-mt-4">
            <div className="p-d-flex p-flex-column p-ai-center">
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
        ) : null}
      </Card>
    </div>
  );
};

export default WorkTimeCalculator;
