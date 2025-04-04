import React from "react";
import { Card } from "primereact/card";
import "./CardDashboard.css";

const CardDashboard = ({
  title,
  values,
  value,
  icon,
  iconBgColor,
  children,
}) => {
  return (
    <Card className="card-dashboard">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <div className="card-icon" style={{ backgroundColor: iconBgColor }}>
          <i className={`pi ${icon}`} />
        </div>
      </div>
      <div className="card-values">
        {values ? (
          // Mostrar múltiples líneas si se pasa `values`
          values.map((line, index) => (
            <p key={index} className="card-value">
              <span className="card-value-bold">{line.label}</span> {line.text}
            </p>
          ))
        ) : value ? (
          // Mostrar una sola línea si se pasa `value`
          <p className="card-value">
            <span className="card-value-bold">Total:</span> {value}
          </p>
        ) : (
          // Mostrar contenido personalizado si se pasa `children`
          children
        )}
      </div>
    </Card>
  );
};

export default CardDashboard;
