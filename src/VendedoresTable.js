import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

const VendedoresTable = ({
  vendedores,
  loading,
  onViewCartera,
  onEdit,
  onDelete,
}) => {
  return (
    <DataTable
      value={vendedores}
      loading={loading}
      paginator
      rows={10}
      rowsPerPageOptions={[5, 10, 20]}
      emptyMessage="No se encontraron vendedores."
    >
      <Column field="id" header="ID" />
      <Column field="nombre" header="Nombre" sortable />
      <Column
        field="activo"
        header="Activo"
        body={(rowData) => <span>{rowData.activo ? "Sí" : "No"}</span>}
      />
      <Column
        header="Acciones"
        body={(rowData) => (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              icon="pi pi-pencil"
              rounded
              text
              severity="info"
              onClick={() => onEdit(rowData)}
            />
            <Button
              icon="pi pi-trash"
              rounded
              text
              severity="danger"
              onClick={() => onDelete(rowData.id)}
            />
            <Button
              icon="pi pi-eye"
              rounded
              text
              severity="success"
              onClick={() => onViewCartera(rowData.id, rowData.nombre)}
            />
          </div>
        )}
      />
    </DataTable>
  );
};

export default VendedoresTable;
