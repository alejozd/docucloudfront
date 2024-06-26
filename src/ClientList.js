import React from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const clients = [
  {
    id: 1,
    name: "Cliente 1",
    phone: "3112764449",
    email: "cliente1@example.com",
  },
  {
    id: 2,
    name: "Cliente 2",
    phone: "573212144586",
    email: "cliente2@example.com",
  },
  // Agrega más clientes según sea necesario
];

const ClientList = () => {
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
          className="p-button-success p-mr-2"
          onClick={() => handleWhatsAppClick(rowData.phone)}
        />
        <Button
          icon="pi pi-envelope"
          className="p-button-info"
          onClick={() => handleEmailClick(rowData.email)}
        />
      </React.Fragment>
    );
  };

  return (
    <Card title="Listado de Clientes">
      <DataTable value={clients} paginator rows={10}>
        <Column field="name" header="Nombre" sortable></Column>
        <Column field="phone" header="Teléfono" sortable></Column>
        <Column field="email" header="Correo" sortable></Column>
        <Column body={actionBodyTemplate} header="Acciones"></Column>
      </DataTable>
    </Card>
  );
};

export default ClientList;
