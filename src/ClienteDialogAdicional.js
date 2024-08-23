import React, { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { FloatLabel } from "primereact/floatlabel";
import { Checkbox } from "primereact/checkbox";

const ClienteDialogAdicional = () => {
  const [selectedRegimen, setSelectedRegimen] = useState(null);
  const regimenes = [
    { name: "responsable de IVA (48)", code: "1" },
    { name: "No responsable de IVA (49)", code: "2" },
  ];
  const [checkedAreaICA, setCheckedAreaICA] = useState(false);

  return (
    <div className="card p-fluid">
      <div className="flex flex-column mt-3">
        <FloatLabel className="w-full ">
          <Dropdown
            inputId="idregimen"
            value={selectedRegimen}
            onChange={(e) => setSelectedRegimen(e.value)}
            options={regimenes}
            optionLabel="name"
            placeholder="Seleccionar Regimen"
          />
          <label htmlFor="idregimen">Seleccionar Regimen</label>
        </FloatLabel>
      </div>
      <div className="flex flex-row mt-3">
        <Checkbox
          onChange={(e) => setCheckedAreaICA(e.checked)}
          checked={checkedAreaICA}
          style={{ marginRight: "10px" }}
        ></Checkbox>
        <label>¿Desea agregar Area ICA?</label>
      </div>
    </div>
  );
};

export default ClienteDialogAdicional;
