import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Chart } from "primereact/chart";
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

  const chartData = {
    labels: ["Total Ventas", "Total Pagos", "Saldo Total"],
    datasets: [
      {
        label: "Valor (COP)",
        data: [
          cartera.totales.totalVentas,
          cartera.totales.totalPagos,
          cartera.totales.saldoTotal,
        ],
        backgroundColor: ["#42A5F5", "#66BB6A", "#FFA726"],
        hoverBackgroundColor: ["#64B5F6", "#81C784", "#FFB74D"],
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 10,
          },
          padding: 6, // Reducido de 8 a 6
          usePointStyle: true,
          boxWidth: 6, // Ancho más pequeño para los puntos de leyenda
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.label}: ${new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
            }).format(context.raw)}`;
          },
        },
      },
      datalabels: {
        // Plugin adicional para mostrar valores dentro del gráfico
        formatter: (value) => {
          return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
          }).format(value);
        },
        font: {
          weight: "bold",
          size: 10,
        },
        anchor: "center",
        align: "center",
        offset: 0,
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    cutout: "60%",
    spacing: 2, // Espacio entre elementos
  };

  return (
    <Dialog
      visible={showCarteraDialog}
      header={`Detalle de Cartera - ${cartera.nombre}`}
      onHide={onClose}
      style={{ width: "95vw", maxWidth: "700px" }} // Diálogo un poco más angosto
      breakpoints={{ "960px": "75vw", "640px": "90vw" }}
      contentStyle={{ padding: "1rem" }} // Bordes redondeados
    >
      {/* Sección de Totales con Gráfico - Versión optimizada */}
      <div
        className="flex flex-wrap align-items-center justify-content-between"
        style={{ marginBottom: "0.1rem" }}
      >
        {" "}
        {/* Reducido mb */}
        {/* Totales compactos */}
        <div className="flex flex-column" style={{ minWidth: "200px" }}>
          <h4 className="mt-0 mb-2" style={{ fontSize: "1.1rem" }}>
            Resumen
          </h4>{" "}
          {/* Título más pequeño */}
          <div className="mb-1">
            {" "}
            {/* Reducido margen inferior */}
            <div className="text-sm font-medium">Total Ventas:</div>
            <div className="text-lg">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
              }).format(cartera.totales.totalVentas)}
            </div>
          </div>
          <div className="mb-1">
            <div className="text-sm font-medium">Total Pagos:</div>
            <div className="text-lg">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
              }).format(cartera.totales.totalPagos)}
            </div>
          </div>
          <div className="mb-1">
            <div className="text-sm font-medium">Saldo Total:</div>
            <div
              className="text-lg"
              style={{
                color:
                  cartera.totales.saldoTotal <= 50000
                    ? "#28a745"
                    : cartera.totales.saldoTotal > 50000 &&
                      cartera.totales.saldoTotal <= 100000
                    ? "#fd7e14"
                    : "#dc3545",
                fontWeight: "bold",
              }}
            >
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
              }).format(cartera.totales.saldoTotal)}
            </div>
          </div>
        </div>
        {/* Gráfico optimizado */}
        <div
          style={{
            width: "160px", // Reducido de 180px
            height: "160px",
            position: "relative", // Para mejor posicionamiento
          }}
        >
          <Chart type="doughnut" data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Detalle por Venta */}
      <div style={{ marginTop: "0.2rem", padding: "0.2rem" }}>
        <h3 className="mt-0 mb-2" style={{ padding: "0.2rem" }}>
          Detalle por Venta
        </h3>
        <DataTable
          value={cartera.ventas}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          scrollable
          scrollHeight="flex"
        >
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
              const color =
                rowData.saldo <= 50000
                  ? "#28a745"
                  : rowData.saldo > 50000 && rowData.saldo <= 100000
                  ? "#fd7e14"
                  : "#dc3545";
              return (
                <span style={{ color, fontWeight: "bold" }}>
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                  }).format(rowData.saldo)}
                </span>
              );
            }}
          />
        </DataTable>
      </div>
    </Dialog>
  );
};

export default CarteraDialog;
