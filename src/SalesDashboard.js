import React, { useEffect, useRef, useState } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import CardDashboard from "./components/CardDashboard";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "./SalesDashboard.css";

const SalesDashboard = () => {
  // Referencias para los gráficos
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  // Datos de ejemplo para los KPIs
  const kpis = [
    {
      title: "Ventas Totales",
      value: "$10,000",
      icon: "pi-dollar",
      iconBgColor: "#4CAF50",
    },
    {
      title: "Clientes Activos",
      value: "150",
      icon: "pi-users",
      iconBgColor: "#FF9800",
    },
    {
      title: "Pedidos Pendientes",
      value: "25",
      icon: "pi-shopping-cart",
      iconBgColor: "#F44336",
    },
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

  // Datos de ejemplo para los segmentos
  const segments = [
    { name: "Electrónica", code: "electronics" },
    { name: "Ropa", code: "clothing" },
    { name: "Hogar", code: "home" },
  ];

  // Datos de ejemplo para los productos (simulando ventas por segmento)
  const productsData = {
    electronics: [
      { product: "Laptop", sales: 150 },
      { product: "Smartphone", sales: 120 },
      { product: "Tablet", sales: 90 },
      { product: "Headphones", sales: 70 },
      { product: "Smartwatch", sales: 50 },
      { product: "Camera", sales: 30 },
      { product: "Printer", sales: 20 },
    ],
    clothing: [
      { product: "Jeans", sales: 200 },
      { product: "T-Shirt", sales: 180 },
      { product: "Jacket", sales: 150 },
      { product: "Shoes", sales: 120 },
      { product: "Hat", sales: 80 },
      { product: "Socks", sales: 50 },
      { product: "Belt", sales: 30 },
    ],
    home: [
      { product: "Sofa", sales: 100 },
      { product: "Bed", sales: 90 },
      { product: "Table", sales: 80 },
      { product: "Chair", sales: 70 },
      { product: "Lamp", sales: 60 },
      { product: "Curtains", sales: 50 },
      { product: "Rug", sales: 40 },
    ],
  };

  // Estado para el segmento seleccionado
  const [selectedSegment, setSelectedSegment] = useState(segments[0]); // Por defecto, selecciona "Electrónica"

  // Filtrar los productos del segmento seleccionado y obtener el Top 6
  const topProducts = productsData[selectedSegment.code]
    .slice(0, 6) // Tomar los primeros 6 productos
    .map((item) => item.product); // Extraer los nombres de los productos
  const topSales = productsData[selectedSegment.code]
    .slice(0, 6) // Tomar los primeros 6 productos
    .map((item) => item.sales); // Extraer las ventas

  // Datos para el gráfico de pastel
  const pieChartData = {
    labels: topProducts,
    datasets: [
      {
        data: topSales,
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
      },
    ],
  };

  // Opciones del gráfico de pastel
  const pieChartOptions = {
    plugins: {
      tooltip: {
        enabled: true, // Habilita el tooltip al pasar el mouse
      },
      datalabels: {
        formatter: (value, context) => {
          return value; // Muestra el valor dentro del segmento
        },
        color: "#fff", // Color del texto
        font: {
          size: 14, // Tamaño del texto
          weight: "bold", // Negrita
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
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
          <CardDashboard key={index} {...kpi} />
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
            <div className="segment-dropdown">
              <Dropdown
                value={selectedSegment}
                options={segments}
                onChange={(e) => setSelectedSegment(e.value)}
                optionLabel="name"
                placeholder="Selecciona un segmento"
                style={{ width: "100%", marginBottom: "10px" }}
              />
            </div>
            <Chart
              type="pie"
              data={pieChartData}
              options={pieChartOptions}
              plugins={[ChartDataLabels]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
