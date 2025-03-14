import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { convertToLocalDate } from "./dateUtils";
import { formatDate } from "./dateUtils";

const CarteraDialog = ({ cartera, showCarteraDialog, onClose }) => {
  // Estado para controlar las filas expandidas
  const [expandedRows, setExpandedRows] = useState([]);

  // Retorno anticipado si no hay cartera
  if (!cartera) return null;

  // Plantilla para mostrar los pagos asociados a una venta
  const rowExpansionTemplate = (data) => {
    return (
      <div className="p-3">
        <h5>Pagos Asociados</h5>
        <DataTable value={data.pagos}>
          <Column field="id" header="ID Pago" style={{ width: "10%" }} />
          <Column
            field="monto"
            header="Monto"
            body={(rowData) =>
              new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
              }).format(rowData.monto_pagado)
            }
            style={{ width: "20%" }}
          />
          <Column
            field="fecha_pago"
            header="Fecha de Pago"
            body={(rowData) => {
              const fechaLocal = convertToLocalDate(rowData.fecha_pago);
              return formatDate(fechaLocal);
            }}
            style={{ width: "20%" }}
          />
          <Column
            field="metodo_pago"
            header="Método de Pago"
            style={{ width: "20%" }}
          />
        </DataTable>
      </div>
    );
  };

  return (
    <Dialog
      visible={showCarteraDialog}
      header={`Detalle de Cartera - ${cartera.nombre}`}
      onHide={onClose}
      className="p-fluid p-m-0"
      style={{ width: "90%", maxWidth: "600px" }}
    >
      {/* Totales */}
      <div style={{ marginBottom: "12px" }}>
        <strong>Total Ventas:</strong>{" "}
        {new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
        }).format(cartera.totales.totalVentas)}
      </div>
      <div style={{ marginBottom: "12px" }}>
        <strong>Total Pagos:</strong>{" "}
        {new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
        }).format(cartera.totales.totalPagos)}
      </div>
      <div style={{ marginBottom: "12px" }}>
        <strong>Saldo Total:</strong>{" "}
        <span
          style={{
            color:
              cartera.totales.saldoTotal <= 50000
                ? "#28a745" // Verde si el saldo es menor o igual a 50,000
                : cartera.totales.saldoTotal > 50000 &&
                  cartera.totales.saldoTotal <= 100000
                ? "#fd7e14" // Naranja si el saldo está entre 50,000 y 100,000
                : "#dc3545", // Rojo si el saldo es mayor a 100,000
            fontWeight: "bold",
          }}
        >
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
          }).format(cartera.totales.saldoTotal)}
        </span>
      </div>

      {/* Detalle por Venta */}
      <h4>Detalle por Venta</h4>
      <DataTable
        value={cartera.ventas}
        expandedRows={expandedRows} // Estado para controlar las filas expandidas
        onRowToggle={(e) => setExpandedRows(e.data)} // Actualizar las filas expandidas
        rowExpansionTemplate={rowExpansionTemplate} // Plantilla para los pagos
      >
        {/* Columna de expansión */}
        <Column expander style={{ width: "3em" }} />
        <Column field="venta_id" header="ID Venta" />
        <Column
          field="fecha_venta"
          header="Fecha de Venta"
          body={(rowData) => {
            const fechaLocal = convertToLocalDate(rowData.fecha_venta);
            return formatDate(fechaLocal);
          }}
        />
        <Column
          field="valor_venta"
          header="Valor de Venta"
          body={(rowData) =>
            new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
            }).format(rowData.valor_venta)
          }
        />
        <Column
          field="total_pagos"
          header="Total Pagos"
          body={(rowData) =>
            new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
            }).format(rowData.total_pagos)
          }
        />
        <Column
          field="saldo"
          header="Saldo"
          body={(rowData) => {
            let color =
              rowData.saldo <= 50000
                ? "#28a745" // Verde si el saldo es menor o igual a 50,000
                : rowData.saldo > 50000 && rowData.saldo <= 100000
                ? "#fd7e14" // Naranja si el saldo está entre 50,000 y 100,000
                : "#dc3545"; // Rojo si el saldo es mayor a 100,000

            return (
              <span
                style={{
                  color: color,
                  fontWeight: "bold",
                }}
              >
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                }).format(rowData.saldo)}
              </span>
            );
          }}
        />
      </DataTable>
    </Dialog>
  );
};

export default CarteraDialog;
