import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Config from "./Config";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, registerables } from "chart.js";

// Registrar Chart.js y los plugins necesarios
ChartJS.register(...registerables, ChartDataLabels);

const DashboardVendedores = ({ jwtToken }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      axios
        .get(`${Config.apiUrl}/api/vendedores/estadisticas`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        })
        .then((response) => {
          setEstadisticas(response.data);
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
        backgroundColor: ["#4CAF50", "#FF5733"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      datalabels: {
        anchor: "end",
        align: "center",
        color: "black",
        font: { weight: "bold" },
        formatter: (value) => value.toLocaleString(),
      },
    },
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card title="Total Ventas">
        <p className="text-2xl font-bold">
          ${resumen.totalVentas?.toLocaleString() || 0}
        </p>
      </Card>
      <Card title="Total Pagos">
        <p className="text-2xl font-bold">
          ${resumen.totalPagos?.toLocaleString() || 0}
        </p>
      </Card>
      <Card title="Saldo Pendiente">
        <p className="text-2xl font-bold">
          ${resumen.saldoPendiente?.toLocaleString() || 0}
        </p>
      </Card>
      <Card title="Vendedores con más ventas">
        <Chart
          type="bar"
          data={ventasData}
          options={chartOptions}
          plugins={[ChartDataLabels]}
        />
      </Card>
      <Card title="Vendedores con mayor deuda">
        <Chart
          type="bar"
          data={deudaData}
          options={chartOptions}
          plugins={[ChartDataLabels]}
        />
      </Card>
      <Card title="Distribución de pagos">
        <Chart type="pie" data={pagosVsDeudaData} />
      </Card>
    </div>
  );
};

export default DashboardVendedores;
