import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import CardDashboard from "../../components/ui/CardDashboard";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, registerables } from "chart.js";

// Registrar Chart.js y los plugins necesarios
ChartJS.register(...registerables, ChartDataLabels);

const DashboardVendedores = ({ jwtToken }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetched = useRef(false);

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
    if (!fetched.current) {
      fetched.current = true;
      axios
        .get(`${Config.apiUrl}/api/vendedores/estadisticas`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        })
        .then((response) => {
          const newData = response.data;
          console.log("Datos recibidos:", newData);
          setEstadisticas(newData);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error al obtener estadísticas", err);
          setError("Error desconocido");
          setLoading(false);
        });
    }

    // Guardamos las referencias actuales en variables locales
    const ventasChart = ventasChartRef.current;
    const deudaChart = deudaChartRef.current;
    const pagosChart = pagosChartRef.current;
    const cantidadVentasChart = cantidadVentasChartRef.current;

    // Función de limpieza
    return () => {
      if (ventasChart?.destroy) ventasChart.destroy();
      if (deudaChart?.destroy) deudaChart.destroy();
      if (pagosChart?.destroy) pagosChart.destroy();
      if (cantidadVentasChart?.destroy) cantidadVentasChart.destroy();
    };
  }, [jwtToken]); // Dependencias del useEffect

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
  };

  const { topVendedores, mayorDeuda, resumen = defaultResumen } = estadisticas;

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
          // value={`$${
          //   resumen.saldoPendiente
          //     ? resumen.saldoPendiente.toLocaleString()
          //     : "0"
          // }`}
          icon="pi pi-exclamation-triangle"
          iconBgColor={colors.danger}
        />
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
              options={chartOptions}
              plugins={[ChartDataLabels]}
              height="300px"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardVendedores;
