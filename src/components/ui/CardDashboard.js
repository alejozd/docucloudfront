import React from "react";
import { Card } from "primereact/card";
import "./CardDashboard.css"; // Archivo CSS personalizado

const CardDashboard = ({ title, value, icon, iconBgColor }) => {
  return (
    <Card className="card-dashboard">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <div className="card-icon" style={{ backgroundColor: iconBgColor }}>
          <i className={`pi ${icon}`} />
        </div>
      </div>
      <h2 className="card-value">{value}</h2>
    </Card>
  );
};

export default CardDashboard;
