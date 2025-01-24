import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";

const WorkTimeCalculator = () => {
  const [entryTime, setEntryTime] = useState(null);
  const [lunchOutTime, setLunchOutTime] = useState(null);
  const [lunchInTime, setLunchInTime] = useState(null);
  const [exitTime, setExitTime] = useState(null);
  const [estimatedExit, setEstimatedExit] = useState("");
  const [totalTime, setTotalTime] = useState("");

  const calculate = () => {
    if (entryTime && lunchOutTime && lunchInTime) {
      const workBeforeLunch = (lunchOutTime - entryTime) / (1000 * 60 * 60);
      const workAfterLunch = 8.5 - workBeforeLunch;
      const estimatedExitTime = new Date(
        lunchInTime.getTime() + workAfterLunch * 60 * 60 * 1000
      );
      setEstimatedExit(estimatedExitTime.toLocaleTimeString());
    }

    if (entryTime && exitTime) {
      const totalWorked =
        (exitTime - entryTime - (lunchInTime - lunchOutTime)) / (1000 * 60);
      const hours = Math.floor(totalWorked / 60);
      const minutes = totalWorked % 60;
      setTotalTime(`${hours} horas y ${minutes} minutos`);
    }
  };

  return (
    <div className="p-4">
      <h2>Calculadora de Jornada Laboral</h2>
      <div className="p-grid p-fluid">
        <div className="p-col-12 p-md-6">
          <label htmlFor="entryTime">Hora de entrada</label>
          <Calendar
            id="entryTime"
            value={entryTime}
            onChange={(e) => setEntryTime(e.value)}
            showTime
            timeOnly
            hourFormat="12"
          />
        </div>
        <div className="p-col-12 p-md-6">
          <label htmlFor="lunchOutTime">Hora de salida a almorzar</label>
          <Calendar
            id="lunchOutTime"
            value={lunchOutTime}
            onChange={(e) => setLunchOutTime(e.value)}
            showTime
            timeOnly
            hourFormat="12"
          />
        </div>
        <div className="p-col-12 p-md-6">
          <label htmlFor="lunchInTime">Hora de entrada del almuerzo</label>
          <Calendar
            id="lunchInTime"
            value={lunchInTime}
            onChange={(e) => setLunchInTime(e.value)}
            showTime
            timeOnly
            hourFormat="12"
          />
        </div>
        <div className="p-col-12 p-md-6">
          <label htmlFor="exitTime">Hora de salida real (opcional)</label>
          <Calendar
            id="exitTime"
            value={exitTime}
            onChange={(e) => setExitTime(e.value)}
            showTime
            timeOnly
            hourFormat="12"
          />
        </div>
      </div>
      <Button label="Calcular" className="p-mt-4" onClick={calculate} />
      <div className="p-mt-4">
        {estimatedExit && (
          <p>
            <strong>Hora estimada de salida:</strong> {estimatedExit}
          </p>
        )}
        {totalTime && (
          <p>
            <strong>Total trabajado:</strong> {totalTime}
          </p>
        )}
      </div>
    </div>
  );
};

export default WorkTimeCalculator;
