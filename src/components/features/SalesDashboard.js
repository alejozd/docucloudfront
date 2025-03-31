import React, { useEffect, useRef, useState, useMemo } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import CardDashboard from '../ui/CardDashboard';
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  segments,
  productsData,
  segmentSales,
  kpis,
  products,
} from "./../../misc/mockData"; // Importar datos ficticios
import "./SalesDashboard.css";

const SalesDashboard = () => {
  // Referencias para los gráficos
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  // Estado para el segmento seleccionado
  const [selectedSegment, setSelectedSegment] = useState(segments[0] || null);
  console.log("Estado inicial de selectedSegment:", selectedSegment);

  // Filtrar los productos del segmento seleccionado y obtener el Top 6
  const topProducts = useMemo(() => {
    if (!selectedSegment || !productsData[selectedSegment.value]) return [];
    return productsData[selectedSegment.value]
      .slice(0, 6)
      .map((item) => item.product);
  }, [selectedSegment]);

  const topSales = useMemo(() => {
    if (!selectedSegment || !productsData[selectedSegment.value]) return [];
    return productsData[selectedSegment.value]
      .slice(0, 6)
      .map((item) => item.sales);
  }, [selectedSegment]);

  // Datos para el gráfico de pastel
  const pieChartData = useMemo(() => {
    if (!topProducts.length || !topSales.length) {
      return {
        labels: ["Sin datos"],
        datasets: [{ data: [1], backgroundColor: ["#CCCCCC"] }],
      };
    }
    return {
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
  }, [topProducts, topSales]);

  // Opciones del gráfico de pastel
  const pieChartOptions = useMemo(
    () => ({
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
    }),
    []
  );

  // Datos de ejemplo para el gráfico de barras
  const barChartData = useMemo(() => {
    const labels = segments.map((segment) => segment.label); // Nombres de los segmentos
    const data = segments.map((segment) => segmentSales[segment.value]); // Ventas totales

    return {
      labels: labels, // Etiquetas en el eje X (nombres de los segmentos)
      datasets: [
        {
          label: "Ventas Totales por Segmento",
          backgroundColor: [
            "#FF6384", // Rojo
            "#36A2EB", // Azul
            "#FFCE56", // Amarillo
            "#4BC0C0", // Verde claro
            "#9966FF", // Morado
            "#FF9F40", // Naranja
            "#CCCCCC", // Gris
          ],
          data: data, // Valores totales de ventas
        },
      ],
    };
  }, []);

  // Opciones del gráfico de barras
  const barChartOptions = useMemo(
    () => ({
      plugins: {
        tooltip: {
          enabled: true, // Habilita el tooltip al pasar el mouse
        },
        datalabels: {
          anchor: "end", // Posición del texto (arriba de la barra)
          align: "start", // Alineación del texto
          formatter: (value) => value, // Muestra el valor directamente
          color: "#000", // Color del texto
          font: {
            size: 14, // Tamaño del texto
            weight: "bold", // Negrita
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      scales: {
        x: {
          grid: {
            display: false, // Oculta las líneas de la cuadrícula en el eje X
          },
        },
        y: {
          ticks: {
            stepSize: 50, // Intervalo de 50 en 50
            color: "#000", // Color de los números
          },
          grid: {
            drawBorder: false,
          },
        },
      },
    }),
    []
  );

  useEffect(() => {
    console.log("Estado actualizado de selectedSegment:", selectedSegment);
  }, [selectedSegment]);

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
              options={barChartOptions}
              plugins={[ChartDataLabels]}
            />
          </Card>
        </div>
        <div className="chart-container">
          <Card title="Gráfico de Pastel">
            <div className="segment-dropdown">
              <Dropdown
                value={selectedSegment.value}
                options={segments}
                onChange={(e) => {
                  console.log(
                    "Valor seleccionado en el evento (e.value):",
                    e.value
                  );
                  const selected = segments.find((s) => s.value === e.value);
                  console.log("Objeto encontrado en segments:", selected);
                  setSelectedSegment(selected || null);
                }}
                optionLabel="label"
                placeholder="Selecciona un segmento"
                style={{ width: "100%", marginBottom: "10px" }}
              />
            </div>
            <Chart
              ref={pieChartRef}
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
