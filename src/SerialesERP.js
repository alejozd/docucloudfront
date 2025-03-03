// SerialesERP.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "./Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const SerialesERP = ({ jwtToken }) => {
  const [seriales, setSeriales] = useState([]);

  useEffect(() => {
    const fetchSeriales = async () => {
      try {
        const response = await axios.get(`${Config.apiUrl}/api/seriales-erp`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        setSeriales(response.data);
      } catch (error) {
        console.error("Error al obtener los seriales ERP:", error);
      }
    };

    fetchSeriales();
  }, [jwtToken]);

  return (
    <div>
      <h2>Seriales ERP</h2>
      <DataTable value={seriales} responsiveLayout="scroll">
        <Column field="serial_erp" header="Serial ERP"></Column>
        <Column field="ano_medios" header="Año Medios"></Column>
      </DataTable>
    </div>
  );
};

export default SerialesERP;
