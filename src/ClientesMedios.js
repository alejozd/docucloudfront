// ClientesMedios.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "./Config";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const ClientesMedios = ({ jwtToken }) => {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await axios.get(
          `${Config.apiUrl}/api/clientes-medios`,
          {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }
        );
        setClientes(response.data);
      } catch (error) {
        console.error("Error al obtener los clientes medios:", error);
      }
    };

    fetchClientes();
  }, [jwtToken]);

  return (
    <div>
      <h2>Clientes Medios</h2>
      <DataTable value={clientes} responsiveLayout="scroll">
        <Column field="nombre_completo" header="Nombre Completo"></Column>
        <Column field="email" header="Email"></Column>
        <Column field="telefono" header="Teléfono"></Column>
        <Column field="empresa" header="Empresa"></Column>
      </DataTable>
    </div>
  );
};

export default ClientesMedios;
