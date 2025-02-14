import { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart"; // Importa el componente Chart de PrimeReact
import CardDashboard from "./components/CardDashboard";
import ChartDataLabels from "chartjs-plugin-datalabels"; // Importa el plugin para los labels

const SalesDashboard = () => {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Datos de ejemplo
  const segments = [
    { label: "Arquitecto", value: "Arquitecto" },
    { label: "Maestro", value: "Maestro" },
    { label: "Constructora", value: "Constructora" },
  ];

  const clients = [
    { id: 1, nombre: "Cliente A", compras: 10, ultimaCompra: "2024-02-01" },
    { id: 2, nombre: "Cliente B", compras: 15, ultimaCompra: "2024-01-15" },
  ];

  const salesData = [
    { segment: "Arquitecto", sales: 12000 },
    { segment: "Maestro", sales: 9000 },
    { segment: "Constructora", sales: 15000 },
  ];

  const productsData = {
    labels: ["Cemento", "Piso", "Sanitario", "Lavamanos"],
    datasets: [
      {
        data: [40, 30, 20, 10],
        backgroundColor: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"],
        hoverBackgroundColor: ["#64B5F6", "#81C784", "#FFB74D", "#FFA07A"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top", // Posición de la leyenda
      },
      datalabels: {
        display: true, // Habilitar labels
        color: "#000", // Color del texto
        font: {
          size: 14, // Tamaño de la fuente
        },
        formatter: (value, context) => {
          return context.chart.data.labels[context.dataIndex]; // Mostrar el label correspondiente
        },
      },
    },
  };

  const openSidebar = (client) => {
    setSelectedClient(client);
    setShowSidebar(true);
  };

  return (
    <div>
      <h2 className="mb-4">Dashboard de Ventas</h2>

      {/* Filtros */}
      <Card className="p-4 flex gap-4 mb-2">
        <Dropdown
          value={selectedSegment}
          options={segments}
          onChange={(e) => setSelectedSegment(e.value)}
          placeholder="Selecciona un segmento"
          className="w-60"
        />
        <Button label="Buscar" icon="pi pi-search" />
      </Card>

      {/* KPIs */}
      <Card className="p-4 mb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardDashboard
            title="Cantidad Ventas"
            value="200"
            icon={<i className="pi pi-inbox text-green-500 text-2xl"></i>}
            description='<span class="highlight">50 nuevas</span> este mes'
          />
          <CardDashboard
            title="Ingresos"
            value="$500.000"
            icon={<i className="pi pi-money-bill text-yellow-500 text-2xl"></i>}
          />
          <CardDashboard
            title="Clientes Activos"
            value="200"
            icon={<i className="pi pi-users text-orange-500 text-2xl"></i>}
          />
          <CardDashboard
            title="Orders"
            value="152"
            icon={
              <i className="pi pi-shopping-cart text-blue-500 text-2xl"></i>
            }
            description='<span class="highlight">24 new</span> desde la última visita'
          />
        </div>
      </Card>

      {/* Tabla de Clientes */}
      <Card className="p-1 mb-4">
        <h3 className="text-xl font-semibold">Clientes del Segmento</h3>
        <DataTable value={clients} paginator rows={5} className="mt-3">
          <Column
            field="nombre"
            header="Cliente"
            sortable
            body={(rowData) => (
              <span
                className="cursor-pointer text-blue-500"
                onClick={() => openSidebar(rowData)}
              >
                {rowData.nombre}
              </span>
            )}
          />
          <Column field="compras" header="Total Compras" sortable />
          <Column field="ultimaCompra" header="Última Compra" sortable />
        </DataTable>
      </Card>

      {/* Gráficos */}
      <Card className="p-4 mb-2">
        {/* Gráfica de Ventas por Segmento */}
        <Card className="p-4 flex-1 mb-4">
          <h2 className="text-xl font-bold mb-4">Ventas por Segmento</h2>
          <Chart
            type="bar"
            data={{
              labels: salesData.map((item) => item.segment),
              datasets: [
                {
                  label: "Ventas",
                  data: salesData.map((item) => item.sales),
                  backgroundColor: "#42A5F5",
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </Card>

        {/* Gráfica de Productos Más Vendidos */}
        <Card className="p-4 flex-1 mb-4">
          <h2 className="text-xl font-bold mb-4">Productos Más Vendidos</h2>
          <Chart
            type="pie"
            data={productsData}
            options={chartOptions}
            plugins={[ChartDataLabels]} // Usa el plugin para los labels
          />
        </Card>
      </Card>

      {/* Sidebar con Detalle del Cliente */}
      <Sidebar
        visible={showSidebar}
        position="right"
        onHide={() => setShowSidebar(false)}
      >
        {selectedClient && (
          <>
            <h3>{selectedClient.nombre}</h3>
            <p>Total Compras: {selectedClient.compras}</p>
            <p>Última Compra: {selectedClient.ultimaCompra}</p>
          </>
        )}
      </Sidebar>
    </div>
  );
};

export default SalesDashboard;
