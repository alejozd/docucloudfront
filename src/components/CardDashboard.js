import React from "react";
import { Card } from "primereact/card";
import "./CardDashboard.css"; // Estilos personalizados

const CardDashboard = ({ title, value, icon, description }) => {
  return (
    <Card className="card-dashboard flex-1">
      <div className="grid-container">
        {/* Sección A: Título */}
        <div className="section-a">
          <h3>{title}</h3>
        </div>

        {/* Sección B: Ícono */}
        <div className="section-c">
          <div className="icon-container">{icon}</div>
        </div>

        {/* Sección C: Valor */}
        <div className="section-b">
          <h1>{value}</h1>
        </div>

        {/* Sección D: Descripción */}
        <div className="section-d">
          <p dangerouslySetInnerHTML={{ __html: description }}></p>
        </div>
      </div>
    </Card>
  );
};

export default CardDashboard;
