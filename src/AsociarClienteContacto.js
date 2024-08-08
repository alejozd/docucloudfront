import React, { useState, useEffect } from "react";
import { ListBox } from "primereact/listbox";
import { PickList } from "primereact/picklist";
import { Button } from "primereact/button";
import axios from "axios";
import Config from "./Config";
// import 'primereact/resources/themes/saga-blue/theme.css';  // Opcional: Cambia por otro tema si prefieres
// import 'primereact/resources/primereact.min.css';
// import 'primeicons/primeicons.css';
// import 'primeflex/primeflex.css';

const AsociarClienteContacto = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [contactosAsociados, setContactosAsociados] = useState([]);

  useEffect(() => {
    // Cargar clientes y contactos desde la API
    const fetchClientes = async () => {
      try {
        const response = await axios.get(`${Config.apiUrl}/api/clientes`);
        setClientes(response.data);
      } catch (error) {
        console.error("Error fetching clientes:", error);
      }
    };

    const fetchContactos = async () => {
      try {
        const response = await axios.get(`${Config.apiUrl}/api/contactos`);
        setContactos(response.data);
      } catch (error) {
        console.error("Error fetching contactos:", error);
      }
    };

    fetchClientes();
    fetchContactos();
  }, []);
  const onClienteChange = (e) => {
    setSelectedCliente(e.value);
    // Aquí puedes cargar los contactos asociados desde el backend al seleccionar un cliente
    setContactosAsociados([]); // Limpiar o cargar los contactos asociados
  };

  const onMoveToTarget = (event) => {
    setContactosAsociados(event.target);
  };

  const onMoveToSource = (event) => {
    setContactos(event.source);
  };

  return (
    <div className="p-fluid">
      <div className="p-field">
        <h3>Seleccionar Cliente</h3>
        <ListBox
          value={selectedCliente}
          options={clientes}
          onChange={onClienteChange}
          optionLabel="name"
          filter
          style={{ width: "15rem" }}
          listStyle={{ maxHeight: "200px" }}
        />
      </div>

      <div className="p-field">
        <h3>Asociar Contactos</h3>
        <PickList
          source={contactos}
          target={contactosAsociados}
          itemTemplate={(item) => <span>{item.name}</span>}
          sourceHeader="Contactos Disponibles"
          targetHeader="Contactos Asociados"
          sourceStyle={{ height: "200px" }}
          targetStyle={{ height: "200px" }}
          onMoveToTarget={onMoveToTarget}
          onMoveToSource={onMoveToSource}
          showSourceControls={false}
          showTargetControls={false}
        />
      </div>

      <div className="p-field">
        <Button label="Guardar Asociaciones" icon="pi pi-save" />
      </div>
    </div>
  );
};

export default AsociarClienteContacto;
