import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import CardDashboard from "../../components/ui/CardDashboard";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, registerables } from "chart.js";
import { SortOrder } from "primereact/api";

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
          if (err.response) {
            setError(
              `Error ${err.response.status}: ${
                err.response.data.message || "No se pudieron cargar los datos"
              }`
            );
          } else if (err.request) {
            setError("No hay conexión con el servidor");
          } else {
            setError("Error desconocido");
          }
          setLoading(false);
        });
      // Limpiar las instancias de los gráficos al desmontar el componente
      return () => {
        if (ventasChartRef.current) ventasChartRef.current.destroy();
        if (deudaChartRef.current) deudaChartRef.current.destroy();
        if (pagosChartRef.current) pagosChartRef.current.destroy();
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

  const colors = ["#42A5F5", "#66BB6A", "#FFA726", "#AB47BC", "#26C6DA"];

  const ventasData = {
    labels: topVendedores.map((v) => v.nombre),
    datasets: [
      {
        label: "Ventas ($)",
        data: topVendedores.map((v) => v.totalVentas || 0),
        backgroundColor: topVendedores.map((_, i) => colors[i % colors.length]),
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
        backgroundColor: [colors[1], colors[3]],
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
        display: true, // Oculta la leyenda
        position: "top", // Posición de la leyenda
        labels: {
          boxWidth: 20, // Ancho de la caja de la leyenda
          font: {
            size: 14, // Tamaño de la fuente de la leyenda
            weight: "bold", // Negrita
          },
        },
      },
    },
  };

  // Opciones del gráfico de pastel
  const pieChartOptions = {
    plugins: {
      tooltip: {
        enabled: true, // Habilita el tooltip al pasar el mouse
      },
      datalabels: {
        formatter: (value, context) => {
          const total = context.chart.data.datasets[0].data.reduce(
            (a, b) => a + b,
            0
          );
          const percentage = ((value / total) * 100).toFixed(2);
          return `${percentage}%`; // Muestra el porcentaje dentro del segmento
        },
        color: "#fff", // Color del texto
        font: {
          size: 14, // Tamaño del texto
          weight: "bold", // Negrita
        },
      },
      legend: {
        display: true,
        position: "top", // Posición de la leyenda
        labels: {
          boxWidth: 20, // Ancho de la caja de la leyenda
          font: {
            size: 14, // Tamaño de la fuente de la leyenda
            weight: "bold", // Negrita
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      display: false, // Oculta la leyenda
    },
  };

  return (
    <div className="card, sales-dashboard">
      <div className="section kpi-section">
        <CardDashboard
          title="Total Ventas"
          value={resumen.totalVentas?.toLocaleString() || 0}
          icon="pi pi-dollar"
          iconBgColor="#4CAF50"
        ></CardDashboard>
        <CardDashboard
          title="Total Pagos"
          value={resumen.totalPagos?.toLocaleString() || 0}
          icon={"pi pi-money-bill"}
          iconBgColor="#FF9800"
        ></CardDashboard>
        <CardDashboard
          title="Saldo Pendiente"
          value={resumen.saldoPendiente?.toLocaleString() || 0}
          icon={"pi pi-exclamation-triangle"}
          iconBgColor="#F44336"
        ></CardDashboard>
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
      </div>
    </div>
  );
};

export default DashboardVendedores;
