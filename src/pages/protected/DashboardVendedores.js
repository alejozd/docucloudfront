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

  const ventasChartRef = useRef(null);
  const deudaChartRef = useRef(null);
  const pagosChartRef = useRef(null);
  const cantidadVentasChartRef = useRef(null);

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      axios
        .get(`${Config.apiUrl}/api/vendedores/estadisticas`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        })
        .then((response) => {
          const newData = response.data;
          if (JSON.stringify(newData) !== JSON.stringify(estadisticas)) {
            setEstadisticas(newData);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error al obtener estadísticas", err);
          setError("Error desconocido");
          setLoading(false);
        });
      return () => {
        if (ventasChartRef.current) ventasChartRef.current.destroy();
        if (deudaChartRef.current) deudaChartRef.current.destroy();
        if (pagosChartRef.current) pagosChartRef.current.destroy();
        if (cantidadVentasChartRef.current)
          cantidadVentasChartRef.current.destroy();
      };
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

  const { topVendedores, mayorDeuda, resumen } = estadisticas;

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

  const deudaData = {
    labels: [mayorDeuda.nombre],
    datasets: [
      {
        label: "Deuda ($)",
        data: [mayorDeuda.saldoPendiente || 0],
        backgroundColor: "#FF6384",
      },
    ],
  };

  const pagosVsDeudaData = {
    labels: ["Total Pagado", "Saldo Pendiente"],
    datasets: [
      {
        data: [resumen.totalPagos, resumen.saldoPendiente],
        backgroundColor: [colors.success, colors.danger], // Verde y rojo
      },
    ],
  };

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
      <div className="section kpi-section">
        <CardDashboard
          title="Total Ventas"
          value={resumen.totalVentas?.toLocaleString() || 0}
          icon="pi pi-dollar"
          iconBgColor="#4CAF50"
        />
        <CardDashboard
          title="Total Pagos"
          value={resumen.totalPagos?.toLocaleString() || 0}
          icon="pi pi-money-bill"
          iconBgColor="#FF9800"
        />
        <CardDashboard
          title="Saldo Pendiente"
          value={resumen.saldoPendiente?.toLocaleString() || 0}
          icon="pi pi-exclamation-triangle"
          iconBgColor="#F44336"
        />
        <CardDashboard
          title="Cantidad Ventas"
          value={resumen.cantidadTotalVentas || 0}
          icon="pi pi-shopping-cart"
          iconBgColor="#2196F3"
        />
        <CardDashboard
          title="Cantidad Pagos"
          value={resumen.cantidadTotalPagos || 0}
          icon="pi pi-credit-card"
          iconBgColor="#9C27B0"
        />
      </div>
      <div className="section charts-section">
        <Card title="Vendedores con más ventas">
          <Chart
            ref={ventasChartRef}
            type="bar"
            data={ventasData}
            options={chartOptions}
            plugins={[ChartDataLabels]}
            height="300px"
          />
        </Card>
        <Card title="Vendedores con mayor deuda">
          <Chart
            ref={deudaChartRef}
            type="bar"
            data={deudaData}
            options={chartOptions}
            plugins={[ChartDataLabels]}
            height="300px"
          />
        </Card>
        <Card title="Distribución de pagos">
          <Chart
            ref={pagosChartRef}
            type="doughnut"
            data={pagosVsDeudaData}
            options={pieChartOptions}
            plugins={[ChartDataLabels]}
          />
        </Card>
        <Card title="Cantidad de Ventas por Vendedor">
          <Chart
            ref={cantidadVentasChartRef}
            type="bar"
            data={cantidadVentasData}
            options={chartOptions}
            plugins={[ChartDataLabels]}
            height="300px"
          />
        </Card>
      </div>
    </div>
  );
};

export default DashboardVendedores;
