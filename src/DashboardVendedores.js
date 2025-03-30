import React, { useEffect, useState } from "react";
import axios from "axios";
import Config from "./Config";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, registerables } from "chart.js";

// Registrar Chart.js y los plugins necesarios
ChartJS.register(...registerables, ChartDataLabels);

const DashboardVendedores = ({ jwtToken }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${Config.apiUrl}/api/vendedores/estadisticas`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      })
      .then((response) => {
        setEstadisticas(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener estadísticas", err);
        setError("No se pudieron cargar los datos");
        setLoading(false);
      });
  }, [jwtToken]);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (
    !estadisticas ||
    !estadisticas.topVendedores ||
    !estadisticas.mayorDeuda ||
    !estadisticas.resumen
  ) {
    return <p>No hay datos disponibles</p>;
  }

  const { topVendedores, mayorDeuda, resumen } = estadisticas;

  const ventasData = {
    labels: topVendedores.map((v) => v.nombre),
    datasets: [
      {
        label: "Ventas ($)",
        data: topVendedores.map((v) => v.totalVentas || 0),
        backgroundColor: "#42A5F5",
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

  const chartOptions = {
    responsive: true,
    plugins: {
      datalabels: {
        anchor: "end",
        align: "top",
        color: "black",
        font: { weight: "bold" },
        formatter: (value) => value.toLocaleString(),
      },
    },
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
};

export default DashboardVendedores;
