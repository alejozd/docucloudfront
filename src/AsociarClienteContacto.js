import React, { useState, useEffect } from "react";
import { PickList } from "primereact/picklist";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Tooltip } from "primereact/tooltip";
import axios from "axios";
import Config from "./Config";

const AsociarClienteContacto = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [contactosAsociados, setContactosAsociados] = useState([]);

  useEffect(() => {
    // Cargar clientes desde la API
    const fetchClientes = async () => {
      try {
        const response = await axios.get(`${Config.apiUrl}/api/clientes`);
        setClientes(response.data);
      } catch (error) {
        console.error("Error fetching clientes:", error);
      }
    };

    fetchClientes();
  }, []);

  useEffect(() => {
    if (selectedCliente) {
      // Cargar contactos disponibles y asociados cuando se selecciona un cliente
      const fetchContactos = async () => {
        try {
          // Cargar todos los contactos disponibles
          const responseContactos = await axios.get(
            `${Config.apiUrl}/api/contactos`
          );

          // Cargar los contactos asociados al cliente seleccionado
          const responseContactosAsociados = await axios.get(
            `${Config.apiUrl}/api/clientes/${selectedCliente.idcliente}/contactos`
          );

          // Obtener los IDs de los contactos asociados
          const contactosAsociadosIds = responseContactosAsociados.data.map(
            (contacto) => contacto.idcontacto
          );

          // Filtrar los contactos disponibles para excluir los ya asociados
          const contactosDisponibles = responseContactos.data.filter(
            (contacto) => !contactosAsociadosIds.includes(contacto.idcontacto)
          );

          // Actualizar los estados
          setContactos(contactosDisponibles); // Solo los contactos disponibles (no asociados)
          setContactosAsociados(responseContactosAsociados.data); // Solo los contactos asociados
        } catch (error) {
          console.error("Error fetching contactos:", error);
        }
      };

      fetchContactos();
    } else {
      setContactos([]);
      setContactosAsociados([]);
    }
  }, [selectedCliente]);

  const onClienteChange = (e) => {
    setSelectedCliente(e.value);
    setContactos([]);
    // Aquí puedes cargar los contactos asociados desde el backend al seleccionar un cliente
    setContactosAsociados([]); // Limpiar o cargar los contactos asociados
  };

  const onMoveToTarget = (event) => {
    console.log("Event object:", event);
    if (!event || !event.value) {
      console.error("Event object or its properties are undefined:", event);
      return;
    }

    const movedItems = event.value; // Obtener los elementos movidos
    const updatedContactos = contactos.filter(
      (item) =>
        !movedItems.some(
          (movedItem) => movedItem.idcontacto === item.idcontacto
        )
    );
    const updatedContactosAsociados = [...contactosAsociados, ...movedItems];

    setContactos(updatedContactos);
    setContactosAsociados(updatedContactosAsociados);
  };

  const onMoveToSource = (event) => {
    console.log("Event object:", event);
    if (!event || !event.value) {
      console.error("Event object or its properties are undefined:", event);
      return;
    }

    const movedItems = event.value; // Obtener los elementos movidos
    const updatedContactos = [...contactos, ...movedItems];
    const updatedContactosAsociados = contactosAsociados.filter(
      (item) =>
        !movedItems.some(
          (movedItem) => movedItem.idcontacto === item.idcontacto
        )
    );

    setContactos(updatedContactos);
    setContactosAsociados(updatedContactosAsociados);
  };

  const handleSave = async () => {
    if (!selectedCliente) {
      alert("Por favor, seleccione un cliente.");
      return;
    }

    // Extraer los IDs de los contactos asociados
    const contactosAsociadosIds = contactosAsociados.map(
      (contacto) => contacto.idcontacto
    );

    try {
      // Enviar los datos al backend
      await axios.post(
        `${Config.apiUrl}/api/clientes/${selectedCliente.idcliente}/asociar-contactos`,
        {
          contactos: contactosAsociadosIds,
        }
      );

      alert("Asociaciones guardadas correctamente.");
    } catch (error) {
      console.error("Error guardando asociaciones:", error);
      alert("Error al guardar las asociaciones.");
    }
  };

  return (
    <div className="p-fluid">
      <div className="p-field">
        <h3>Seleccionar Cliente</h3>
        <Dropdown
          value={selectedCliente}
          onChange={onClienteChange}
          options={clientes}
          optionLabel="nombres"
          placeholder="Seleccione un cliente"
          filter
          className="w-full md:w-14rem"
        />
      </div>

      <div className="p-field">
        <h3>Asociar Contactos</h3>
        <PickList
          dataKey="idcontacto"
          source={contactos}
          target={contactosAsociados}
          itemTemplate={(item) => <span>{item.nombresca}</span>}
          filter
          filterBy="nombresca"
          sourceHeader="Contactos Disponibles"
          targetHeader="Contactos Asociados"
          sourceStyle={{ height: "200px" }}
          targetStyle={{ height: "200px" }}
          onMoveToTarget={onMoveToTarget}
          onMoveToSource={onMoveToSource}
          showSourceControls={false}
          showTargetControls={false}
          sourceFilterPlaceholder="Buscar por nombre"
          targetFilterPlaceholder="Buscar por nombre"
          pt={{
            moveAllToTargetButton: {
              root: { className: "hidden" },
            },
            moveAllToSourceButton: {
              root: { className: "hidden" },
            },
          }}
        />
      </div>

      <div className="p-field">
        <Button
          label="Guardar Asociaciones"
          icon="pi pi-save"
          onClick={handleSave}
        />
      </div>
    </div>
  );
};

export default AsociarClienteContacto;
