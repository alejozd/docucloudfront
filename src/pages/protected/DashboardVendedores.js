import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MeterGroup } from "primereact/metergroup";
import CardDashboard from "../../components/ui/CardDashboard";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, registerables } from "chart.js";

// Registrar Chart.js y los plugins necesarios
ChartJS.register(...registerables, ChartDataLabels);

const DashboardVendedores = ({ jwtToken }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetched = useRef(false);
  const [selectedVendedor, setSelectedVendedor] = useState(null);

  // Referencias para almacenar las instancias de los gráficos
  const ventasChartRef = useRef(null);
  const deudaChartRef = useRef(null);
  const pagosChartRef = useRef(null);
  const cantidadVentasChartRef = useRef(null);

  // Paleta de colores moderna
  const colors = {
    primary: "#6366F1", // Azul vibrante (primario)
    secondary: "#EC4899", // Rosa suave (secundario)
    accent: "#F59E0B", // Naranja cálido (énfasis)
    success: "#22C55E", // Verde éxito
    warning: "#FBBF24", // Amarillo advertencia
    danger: "#EF4444", // Rojo peligro
    info: "#3B82F6", // Azul informativo
    neutral: "#6B7280", // Gris neutro
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener estadísticas
        const estadisticasResponse = await axios.get(
          `${Config.apiUrl}/api/vendedores/estadisticas`,
          {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }
        );

        // Obtener datos de ventas
        const ventasResponse = await axios.get(`${Config.apiUrl}/api/ventas`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        // Obtener datos de pagos
        const pagosResponse = await axios.get(`${Config.apiUrl}/api/pagos`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        console.log("Pagos:", pagosResponse.data);

        setEstadisticas(estadisticasResponse.data);
        setVentas(ventasResponse.data);
        setPagos(pagosResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Error al obtener datos:", err);
        setError("Error desconocido");
        setLoading(false);
      }
    };

    if (!fetched.current) {
      fetched.current = true;
      fetchData();
    }
  }, [jwtToken]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} width="100%" height="100px" />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-red-500">{error}</p>;
  if (!estadisticas) return <p>No hay datos disponibles</p>;

  // Estructura predeterminada para resumen
  const defaultResumen = {
    totalVentas: 0,
    totalPagos: 0,
    saldoPendiente: 0,
    cantidadTotalVentas: 0,
    cantidadTotalPagos: 0,
    totalPagosCompletos: 0,
    totalPagosParciales: 0,
    totalPagosPendientes: 0,
  };

  const {
    topVendedores,
    mayorDeuda,
    resumen = defaultResumen,
    ventasDetalladas,
  } = estadisticas;

  // Datos para el gráfico de ventas totales
  const ventasData = {
    labels: topVendedores.map((v) => v.nombre),
    datasets: [
      {
        label: "Ventas ($)",
        data: topVendedores.map((v) => v.totalVentas || 0),
        backgroundColor: topVendedores.map(
          (_, i) =>
            [colors.primary, colors.secondary, colors.accent, colors.info][
              i % 4
            ]
        ),
      },
    ],
  };

  // Datos para el gráfico de mayor deuda
  const deudaData = {
    labels: [mayorDeuda.nombre],
    datasets: [
      {
        label: "Deuda ($)",
        data: [mayorDeuda.saldoPendiente || 0],
        backgroundColor: colors.danger,
      },
    ],
  };

  // Datos para el gráfico de distribución de pagos
  const pagosVsDeudaData = {
    labels: ["Total Pagado", "Saldo Pendiente"],
    datasets: [
      {
        data: [resumen.totalPagos, resumen.saldoPendiente],
        backgroundColor: [colors.success, colors.danger],
      },
    ],
  };

  // Datos para el gráfico de cantidad de ventas por vendedor
  const cantidadVentasData = {
    labels: topVendedores.map((v) => v.nombre),
    datasets: [
      {
        label: "Cantidad de Ventas",
        data: topVendedores.map((v) => v.cantidadVentas),
        backgroundColor: topVendedores.map(
          (_, i) =>
            [colors.info, colors.success, colors.warning, colors.danger][i % 4]
        ),
      },
    ],
  };

  // Opciones generales para los gráficos de barras
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        anchor: "center",
        align: "center",
        color: "white",
        font: { weight: "bold" },
        formatter: (value) => value.toLocaleString(),
      },
      legend: {
        display: false,
      },
    },
  };

  // Opciones para el gráfico de pastel/dona
  const pieChartOptions = {
    plugins: {
      tooltip: { enabled: true },
      datalabels: {
        formatter: (value, context) => {
          const total = context.chart.data.datasets[0].data.reduce(
            (a, b) => a + b,
            0
          );
          const percentage = ((value / total) * 100).toFixed(2);
          return `${percentage}%`;
        },
        color: "#fff",
        font: { size: 14, weight: "bold" },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Datos para el componente MeterGroup
  const totalVentas = resumen.totalVentas || 0;
  const totalPagosCompletos = resumen.totalPagosCompletos || 0;
  const totalPagosParciales = resumen.totalPagosParciales || 0;
  const totalPagosPendientes = resumen.totalPagosPendientes || 0;

  // Calcular porcentajes para el MeterGroup
  const meterValues = [];
  if (totalVentas > 0) {
    meterValues.push(
      {
        label: "Completas",
        color: colors.success,
        value: parseFloat(
          ((totalPagosCompletos / totalVentas) * 100).toFixed(2)
        ),
      },
      {
        label: "Parciales",
        color: colors.warning,
        value: parseFloat(
          ((totalPagosParciales / totalVentas) * 100).toFixed(2)
        ),
      },
      {
        label: "Pendientes",
        color: colors.danger,
        value: parseFloat(
          ((totalPagosPendientes / totalVentas) * 100).toFixed(2)
        ),
      }
    );
  } else {
    // Si no hay ventas, mostrar valores predeterminados
    meterValues.push(
      { label: "Completas", color: colors.success, value: 0 },
      { label: "Parciales", color: colors.warning, value: 0 },
      { label: "Pendientes", color: colors.danger, value: 0 }
    );
  }

  // Filtrar las ventas detalladas por el vendedor seleccionado
  const ventasFiltradas = selectedVendedor
    ? ventas.filter((venta) => venta.vendedor?.nombre === selectedVendedor)
    : ventas;

  // IDs de las ventas del vendedor seleccionado
  const idsVentasFiltradas = ventasFiltradas.map((venta) => venta.id);

  // Filtrar los pagos por las IDs de las ventas del vendedor seleccionado
  const pagosFiltrados = selectedVendedor
    ? pagos.filter((pago) => idsVentasFiltradas.includes(pago.venta_id))
    : pagos;

  return (
    <div className="card sales-dashboard">
      {/* Sección de KPIs */}
      <div className="section kpi-section">
        <CardDashboard
          title="Ventas"
          values={[
            {
              label: "Total",
              text: resumen?.totalVentas
                ? `$${resumen.totalVentas.toLocaleString()}`
                : "$0",
            },
            {
              label: "Cantidad",
              text: resumen?.cantidadTotalVentas
                ? `${resumen.cantidadTotalVentas}`
                : "0",
            },
          ]}
          icon="pi pi-dollar"
          iconBgColor={colors.primary}
        />
        <CardDashboard
          title="Pagos"
          values={[
            {
              label: "Total:",
              text: resumen?.totalPagos
                ? `$${resumen.totalPagos.toLocaleString()}`
                : "$0",
            },
            {
              label: "Cantidad:",
              text: resumen?.cantidadTotalPagos || "0",
            },
          ]}
          icon="pi pi-money-bill"
          iconBgColor={colors.success}
        />

        {/* Tarjeta de Saldo Pendiente */}
        <CardDashboard
          title="Saldo Pendiente"
          value={`$${
            resumen.saldoPendiente
              ? resumen.saldoPendiente.toLocaleString()
              : "0"
          }`}
          icon="pi pi-exclamation-triangle"
          iconBgColor={colors.danger}
        />

        {/* Tarjeta con MeterGroup */}
        <CardDashboard
          title="Estado de Ventas"
          icon="pi pi-chart-bar"
          iconBgColor={colors.primary}
        >
          <div className="meter-container">
            <MeterGroup values={meterValues} />
            <div className="meter-details">
              {meterValues.map((item, index) => (
                <p key={index} className="meter-detail">
                  <span
                    className="color-indicator"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  {item.label}: {item.value}%
                </p>
              ))}
            </div>
          </div>
        </CardDashboard>
      </div>

      {/* Sección de gráficos */}
      <div className="section charts-section">
        <Card title="Vendedores con más ventas">
          <div className="chart-container">
            <Chart
              ref={ventasChartRef}
              type="bar"
              data={ventasData}
              options={chartOptions}
              plugins={[ChartDataLabels]}
              height="300px"
            />
          </div>
        </Card>
        <Card title="Vendedores con mayor deuda">
          <div className="chart-container">
            <Chart
              ref={deudaChartRef}
              type="bar"
              data={deudaData}
              options={chartOptions}
              plugins={[ChartDataLabels]}
              height="300px"
            />
          </div>
        </Card>
        <Card title="Distribución de pagos">
          <div className="chart-container">
            <Chart
              ref={pagosChartRef}
              type="doughnut"
              data={pagosVsDeudaData}
              options={pieChartOptions}
              plugins={[ChartDataLabels]}
            />
          </div>
        </Card>
        <Card title="Cantidad de Ventas por Vendedor">
          <div className="chart-container">
            <Chart
              ref={cantidadVentasChartRef}
              type="bar"
              data={cantidadVentasData}
              options={{
                ...chartOptions,
                onClick: (event, elements) => {
                  if (elements.length > 0) {
                    // Obtener el índice de la barra clicada
                    const clickedIndex = elements[0].index;
                    // Obtener el nombre del vendedor correspondiente
                    const vendedorSeleccionado =
                      cantidadVentasData.labels[clickedIndex];
                    setSelectedVendedor(vendedorSeleccionado);
                  }
                },
              }}
              plugins={[ChartDataLabels]}
              height="300px"
            />
          </div>
        </Card>
      </div>

      {/* Sección de tabla ventas detalladas */}
      <div className="table-card">
        <h3>
          Detalle de Ventas - {selectedVendedor || "Todos los vendedores"}
        </h3>
        <DataTable value={ventasFiltradas} paginator rows={5}>
          <Column field="id" header="ID" />
          <Column field="fecha_venta" header="Fecha" />
          <Column
            field="cliente_medio.nombre_completo"
            header="Cliente"
            body={(rowData) => rowData.cliente_medio?.nombre_completo || "N/A"}
          />
          <Column field="estado_pago" header="Estado Pago" />
          <Column
            field="valor_total"
            header="Monto Total"
            body={(rowData) =>
              `$${parseFloat(rowData.valor_total).toLocaleString()}`
            }
          />
          <Column
            field="vendedor.nombre"
            header="Vendedor"
            body={(rowData) => rowData.vendedor?.nombre || "N/A"}
          />
        </DataTable>
      </div>

      {/* Sección de tabla de pagos */}
      <div className="table-card">
        <h3>Pagos Realizados</h3>
        <DataTable value={pagosFiltrados} paginator rows={5}>
          <Column field="id" header="ID" />
          <Column field="venta_id" header="Venta ID" />
          <Column
            field="monto_pagado"
            header="Monto Pagado"
            body={(rowData) =>
              `$${parseFloat(rowData.monto_pagado).toLocaleString()}`
            }
          />
          <Column field="fecha_pago" header="Fecha de Pago" />
          <Column field="metodo_pago" header="Método de Pago" />
        </DataTable>
      </div>
    </div>
  );
};

export default DashboardVendedores;
