import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import Config from "./Config";

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/clientes`);
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = (phone) => {
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleEmailClick = (email) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-whatsapp"
          //   className="p-button-success p-mr-2"
          severity="success"
          rounded
          text
          size="large"
          onClick={() => handleWhatsAppClick(rowData.telefono)}
        />
        <Button
          icon="pi pi-envelope"
          //   className="p-button-info"
          severity="info"
          rounded
          text
          size="large"
          onClick={() => handleEmailClick(rowData.email)}
        />
      </React.Fragment>
    );
  };

  return (
    <Card title="Listado de Clientes">
      <DataTable value={clients} paginator rows={10} loading={loading}>
        <Column field="nombres" header="Nombre" sortable></Column>
        <Column field="telefono" header="Teléfono" sortable></Column>
        <Column field="email" header="Correo" sortable></Column>
        <Column body={actionBodyTemplate} header="Acciones"></Column>
      </DataTable>
    </Card>
  );
};

export default ClientList;
