// Clientes.js
import React, { useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://zetamini.ddns.net/api/clientes");
      setClientes(response.data);
    } catch (error) {
      console.error("Error fetching clientes", error);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Clientes</h1>
      <Button
        label="Cargar Clientes"
        icon="pi pi-download"
        onClick={fetchClientes}
      />
      <DataTable
        value={clientes}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
      >
        <Column field="idcliente" header="ID" />
        <Column field="nombres" header="Nombre" />
        <Column field="identidad" header="Identidad" />
        <Column field="direccion" header="Dirección" />
        <Column field="telefono" header="Teléfono" />
        <Column field="email" header="Email" />
        <Column field="contacto1" header="Contacto 1" />
        <Column field="telefonoc1" header="Teléfono C1" />
        <Column field="emailc1" header="Email C1" />
        <Column field="contacto2" header="Contacto 2" />
        <Column field="telefonoc2" header="Teléfono C2" />
        <Column field="emailc2" header="Email C2" />
      </DataTable>
    </div>
  );
};

export default Clientes;
