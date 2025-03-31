import React, { useRef, useEffect } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { Image } from "primereact/image";
import logo from "./../assets/images/logo-metro.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ReactToPrint from "react-to-print";

const ComprobantePDF = ({ datos, autoGenerate, nombreArchivo }) => {
  const printRef = useRef();
  const hasGeneratedPDF = useRef(false); // Nueva referencia para controlar la generación del PDF
  // console.log("ComprobantePDF-datos:", datos);
  // console.log("ComprobantePDF-autoGenerate:", autoGenerate);

  useEffect(() => {
    if (autoGenerate && !hasGeneratedPDF.current) {
      generatePDF();
      hasGeneratedPDF.current = true; // Marcar como generado
    }
  }, [autoGenerate]);

  if (!datos || !datos.cliente || !datos.productos) {
    return <p>Datos de la cotización no disponibles.</p>;
  }

  const { cliente, productos, total } = datos;

  const generatePDF = () => {
    const input = document.getElementById("comprobante");
    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const pdfWidth = 210; // Ancho en milímetros (tamaño A4)
      const pdfHeight = (pdfWidth * canvas.height) / canvas.width; // Calculamos la altura manteniendo la proporción
      const imgWidth = 190; // Ajuste según el margen o tamaño del PDF
      const imgHeight = (imgWidth * canvas.height) / canvas.width;
      const xPos = (pdfWidth - imgWidth) / 2;
      const yPos = 20; //(pdfHeight - imgHeight) / 2;
      pdf.addImage(imgData, "PNG", xPos, yPos, imgWidth, imgHeight);
      if (nombreArchivo) {
        pdf.save(`${nombreArchivo}.pdf`);
      } else {
        pdf.save("comprobante.pdf");
      }
    });
  };

  return (
    <div style={styles.container}>
      <div id="comprobante" style={styles.comprobante} ref={printRef}>
        <div style={styles.continerCards}>
          <Card style={styles.card}>
            <Toolbar
              style={{ padding: "0 16px 0 0", backgroundColor: "white" }}
              start={
                <Image
                  style={{ marginRight: "-55px", marginLeft: "5px" }}
                  src={logo}
                  alt="Logo"
                  width="200"
                />
              }
              center={
                <div style={{ textAlign: "center" }}>
                  <p>DISTRIBUIDORA METROCERAMICAS S.A.S.</p>
                  <p>830.112.333-1</p>
                  <p>AUTOPISTA NORTE 138 83, BOGOTÁ</p>
                  <p>PBX 601 6192221</p>
                </div>
              }
              end={
                <div style={{ textAlign: "right" }}>
                  <div style={{ marginBottom: "10px" }}>
                    <strong>COTIZACIÓN</strong>
                  </div>
                  <div>
                    <p style={{ fontWeight: "bold", fontSize: "20px" }}>
                      <span style={{ color: "red" }}>N° </span>
                      {datos.numerocotizacion}
                    </p>
                  </div>
                </div>
              }
            />
            <div style={styles.clientInfo}>
              <div style={styles.leftColumn}>
                <p style={styles.p}>FECHA: {datos.fecha}</p>
                <p style={styles.p}>NOMBRE: {cliente.nombre}</p>
                <p style={styles.p}>NIT: {cliente.identidad}</p>
                <p style={styles.p}>DIRECCIÓN: {cliente.direccion}</p>
              </div>
              <div style={styles.rightColumn}>
                <p style={styles.p}>TELÉFONO: {cliente.telmovil}</p>
                <p style={styles.p}>E-MAIL: {cliente.email}</p>
              </div>
            </div>
          </Card>

          <Card style={styles.card}>
            <DataTable value={productos} showGridlines>
              <Column field="nombre" header="Producto" />
              <Column field="referencia" header="Referencia" />
              <Column field="precio" header="Precio" />
              <Column field="cantidad" header="Cantidad" />
              <Column field="total" header="Total" />
            </DataTable>
          </Card>
          <Card style={styles.card}>
            <p style={styles.pTotal}>
              <strong>Total:</strong> {total}
            </p>
          </Card>
          <Card style={styles.card}>
            <p style={styles.pNotas}>NOTAS: {cliente.notas}</p>
          </Card>
        </div>
      </div>
      <div style={styles.buttonContainer}>
        <Button
          label="Generar PDF"
          icon="pi pi-file-pdf"
          severity="danger"
          onClick={generatePDF}
        />
        <ReactToPrint
          trigger={() => (
            <Button label="Imprimir" icon="pi pi-print" severity="primary" />
          )}
          content={() => printRef.current}
          pageStyle="@page { size: A4; margin: 1cm; } @media print { body { -webkit-print-color-adjust: exact; } }"
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "10px",
    backgroundColor: "#f0f0f0", // Color de fondo general
  },
  continerCards: {
    border: "1px solid #ccc", // Borde de las tarjetas
  },
  comprobante: {
    marginBottom: "10px",
    width: "800px", // Ancho fijo para el PDF
    margin: "0 auto", // Centramos el contenedor
    backgroundColor: "white", // Aseguramos que el fondo sea blanco
  },
  card: {
    marginBottom: "10px",
    backgroundColor: "white", // Color de fondo de las tarjetas
    border: "1px solid #ccc", // Borde de las tarjetas
    boxShadow: "none", // Quita la sombra si no la quieres
  },
  clientInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },
  leftColumn: {
    textAlign: "left",
    width: "60%",
  },
  rightColumn: {
    textAlign: "left",
    width: "40%",
  },
  p: {
    marginBottom: "-10px", // Ajusta este valor según sea necesario para reducir el espacio entre los textos
  },
  pTotal: {
    marginTop: "-10px",
    marginBottom: "-10px",
    textAlign: "right",
  },
  pNotas: {
    margin: 0, // Ajusta este valor según sea necesario
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between", // Distribución de los botones a los extremos
    marginTop: "10px",
  },
};

export default ComprobantePDF;
