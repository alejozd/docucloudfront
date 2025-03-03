// ClavesGeneradas.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "./Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const ClavesGeneradas = ({ jwtToken }) => {
  const [claves, setClaves] = useState([]);

  useEffect(() => {
    const fetchClaves = async () => {
      try {
        const response = await axios.get(
          `${Config.apiUrl}/api/claves-medios-generadas`,
          {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }
        );
        setClaves(response.data);
      } catch (error) {
        console.error("Error al obtener las claves generadas:", error);
      }
    };

    fetchClaves();
  }, [jwtToken]);

  return (
    <div>
      <h2>Claves Generadas</h2>
      <DataTable value={claves} responsiveLayout="scroll">
        <Column field="clave" header="Clave"></Column>
        <Column field="fecha_generacion" header="Fecha de Generación"></Column>
      </DataTable>
    </div>
  );
};

export default ClavesGeneradas;
