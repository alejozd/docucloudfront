// mockData.js

// Datos de ejemplo para los segmentos
export const segments = [
  { label: "Persona Natural", value: "persona_natural" },
  { label: "Persona Jurídica", value: "persona_juridica" },
  { label: "Constructora", value: "constructora" },
  { label: "Distribuidor/Depósito", value: "distribuidor_deposito" },
  { label: "Maestro/Contratista", value: "maestro_contratista" },
  { label: "Arq/Diseñador", value: "arq_disenador" },
  { label: "Consorcio", value: "consorcio" },
];

// Datos de ejemplo para los productos (simulando ventas por segmento)
export const productsData = {
  persona_natural: [
    { product: "Inodoro", sales: 150 },
    { product: "Lavamanos", sales: 120 },
    { product: "Grifería Monomando", sales: 90 },
    { product: "Ducha Eléctrica", sales: 70 },
    { product: "Piso Cerámico Blanco", sales: 50 },
    { product: "Espejo LED", sales: 30 },
    { product: "Cortina de Baño", sales: 20 },
  ],
  persona_juridica: [
    { product: "Sanitario Dual", sales: 200 },
    { product: "Grifería Industrial", sales: 180 },
    { product: "Mueble de Baño", sales: 150 },
    { product: "Piso Antideslizante", sales: 120 },
    { product: "Accesorios de Baño", sales: 80 },
    { product: "Tina de Hidromasaje", sales: 50 },
    { product: "Extractor de Aire", sales: 30 },
  ],
  constructora: [
    { product: "Piso Cerámico Gris", sales: 100 },
    { product: "Azulejos Decorativos", sales: 90 },
    { product: "Sanitarios Comerciales", sales: 80 },
    { product: "Grifería para Cocina", sales: 70 },
    { product: "Mamparas de Baño", sales: 60 },
    { product: "Desagüe para Ducha", sales: 50 },
    { product: "Silicona Impermeable", sales: 40 },
  ],
  distribuidor_deposito: [
    { product: "Inodoro Inteligente", sales: 130 },
    { product: "Grifería Multifuncional", sales: 110 },
    { product: "Piso Cerámico Negro", sales: 90 },
    { product: "Organizador de Baño", sales: 70 },
    { product: "Regadera de Mano", sales: 50 },
    { product: "Dispensador de Jabón", sales: 30 },
    { product: "Soporte para Toallas", sales: 20 },
  ],
  maestro_contratista: [
    { product: "Sellador de Silicona", sales: 80 },
    { product: "Cemento para Azulejos", sales: 70 },
    { product: "Pegamento para Pisos", sales: 60 },
    { product: "Cinta Impermeable", sales: 50 },
    { product: "Fregadero de Acero", sales: 40 },
    { product: "Desagüe Universal", sales: 30 },
    { product: "Tapetes de Baño", sales: 20 },
  ],
  arq_disenador: [
    { product: "Piso Cerámico Marmolado", sales: 120 },
    { product: "Grifería Minimalista", sales: 100 },
    { product: "Espejo Redondo", sales: 80 },
    { product: "Accesorios Cromados", sales: 60 },
    { product: "Iluminación LED", sales: 40 },
    { product: "Toalleros Eléctricos", sales: 20 },
    { product: "Bañera Freestanding", sales: 10 },
  ],
  consorcio: [
    { product: "Sanitarios Públicos", sales: 150 },
    { product: "Grifería de Alta Resistencia", sales: 130 },
    { product: "Piso Cerámico Industrial", sales: 110 },
    { product: "Mamparas de Vidrio Templado", sales: 90 },
    { product: "Extractores Industriales", sales: 70 },
    { product: "Sistemas de Drenaje", sales: 50 },
    { product: "Accesorios para Discapacitados", sales: 30 },
  ],
};

// Datos de ejemplo para los KPIs
export const kpis = [
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
export const products = [
  { id: 1, name: "Inodoro", quantity: 10, price: "$200" },
  { id: 2, name: "Lavamanos", quantity: 5, price: "$150" },
  { id: 3, name: "Grifería Monomando", quantity: 8, price: "$80" },
];
