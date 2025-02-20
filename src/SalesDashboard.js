import React, { useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "./SalesDashboard.css";

const SalesDashboard = () => {
  // Referencias para los gráficos
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  // Datos de ejemplo para los KPIs
  const kpis = [
    { title: "Ventas Totales", value: "$10,000" },
    { title: "Clientes Activos", value: "150" },
    { title: "Pedidos Pendientes", value: "25" },
  ];

  // Datos de ejemplo para el DataTable
  const products = [
    { id: 1, name: "Producto A", quantity: 10, price: "$20" },
    { id: 2, name: "Producto B", quantity: 5, price: "$15" },
    { id: 3, name: "Producto C", quantity: 8, price: "$25" },
  ];

  // Datos de ejemplo para el gráfico de barras
  const barChartData = {
    labels: ["Enero", "Febrero", "Marzo", "Abril"],
    datasets: [
      {
        label: "Ventas",
        backgroundColor: "#42A5F5",
        data: [65, 59, 80, 81],
      },
    ],
  };

  // Datos de ejemplo para el gráfico de pastel
  const pieChartData = {
    labels: ["Ventas Online", "Ventas en Tienda"],
    datasets: [
      {
        data: [300, 50],
        backgroundColor: ["#FFA726", "#66BB6A"],
      },
    ],
  };

  // Efecto para manejar el redimensionamiento de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (barChartRef.current && barChartRef.current.chart) {
        barChartRef.current.chart.resize();
      }
      if (pieChartRef.current && pieChartRef.current.chart) {
        pieChartRef.current.chart.resize();
      }
    };

    window.addEventListener("resize", handleResize);

    // Limpieza del listener cuando el componente se desmonta
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="sales-dashboard">
      {/* Sección de KPIs */}
      <div className="section kpi-section">
        {kpis.map((kpi, index) => (
          <Card key={index} title={kpi.title} className="kpi-card">
            <h2>{kpi.value}</h2>
          </Card>
        ))}
      </div>

      {/* Sección de DataTable */}
      <div className="section datatable-section">
        <Card title="Lista de Productos">
          <DataTable value={products} responsiveLayout="scroll">
            <Column field="id" header="ID"></Column>
            <Column field="name" header="Nombre"></Column>
            <Column field="quantity" header="Cantidad"></Column>
            <Column field="price" header="Precio"></Column>
          </DataTable>
        </Card>
      </div>

      {/* Sección de Gráficos */}
      <div className="section charts-section">
        <div className="chart-container">
          <Card title="Gráfico de Barras">
            <Chart
              ref={barChartRef}
              type="bar"
              data={barChartData}
              options={{ maintainAspectRatio: false }}
            />
          </Card>
        </div>
        <div className="chart-container">
          <Card title="Gráfico de Pastel">
            <Chart
              ref={pieChartRef}
              type="pie"
              data={pieChartData}
              options={{ maintainAspectRatio: false }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
