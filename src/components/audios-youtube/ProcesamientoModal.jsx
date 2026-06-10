import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';

/**
 * Modal para configurar y ejecutar el post-procesamiento de audio
 */
const ProcesamientoModal = ({
  visible,
  onHide,
  audio,
  onProcess,
  processing,
  progress,
  statusMessage,
  error
}) => {
  // Opciones de volumen
  const volumeOptions = [
    { label: '+3 dB (Suave)', value: '3' },
    { label: '+6 dB (Medio)', value: '6' },
    { label: '+10 dB (Fuerte)', value: '10' },
    { label: 'Personalizado', value: 'custom' }
  ];

  // Opciones de split
  const splitOptions = [
    { label: 'Cada 15 minutos', value: '15' },
    { label: 'Cada 30 minutos', value: '30' },
    { label: 'Cada 1 hora', value: '60' },
    { label: 'Cada 2 horas', value: '120' },
    { label: 'Personalizado', value: 'custom' }
  ];

  // Estados del formulario
  const [applyVolume, setApplyVolume] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState('6');
  const [customVolume, setCustomVolume] = useState(6);

  const [applySplit, setApplySplit] = useState(false);
  const [splitInterval, setSplitInterval] = useState('30');
  const [customSplit, setCustomSplit] = useState(30);

  const handleProcess = () => {
    const options = {};

    if (applyVolume) {
      options.volumeIncrease = volumeLevel === 'custom' ? customVolume : volumeLevel;
    }

    if (applySplit) {
      options.splitInterval = splitInterval === 'custom' ? customSplit : splitInterval;
    }

    if (Object.keys(options).length === 0) {
      return; // Nada que procesar
    }

    onProcess(audio.filename, options);
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={onHide}
        disabled={processing}
      />
      {!processing && (
        <Button
          label="Procesar"
          icon="pi pi-cog"
          onClick={handleProcess}
          disabled={!applyVolume && !applySplit}
        />
      )}
    </div>
  );

  return (
    <Dialog
      header={`Procesar Audio: ${audio?.title || audio?.filename}`}
      visible={visible}
      style={{ width: '450px' }}
      modal
      onHide={onHide}
      footer={footer}
      closable={!processing}
    >
      <div className="flex flex-column gap-4 py-2">
        {processing ? (
          <div className="flex flex-column gap-3">
            <div className="flex align-items-center gap-3">
              <i className="pi pi-spin pi-cog text-2xl text-primary"></i>
              <div className="flex flex-column">
                <span className="font-medium">{statusMessage || 'Procesando audio...'}</span>
                <small className="text-secondary">Esto puede tomar varios minutos para archivos largos</small>
              </div>
            </div>
            <ProgressBar value={progress} showValue={progress > 0} />
          </div>
        ) : (
          <>
            {error && (
              <Message severity="error" text={error} className="w-full mb-2" />
            )}

            {/* Sección de Volumen */}
            <div className="field-checkbox">
              <Checkbox
                inputId="applyVolume"
                onChange={e => setApplyVolume(e.checked)}
                checked={applyVolume}
              />
              <label htmlFor="applyVolume" className="font-bold ml-2">Aumentar Volumen</label>
            </div>

            {applyVolume && (
              <div className="flex flex-column gap-2 ml-4">
                <label className="text-sm">Nivel de aumento</label>
                <Dropdown
                  value={volumeLevel}
                  options={volumeOptions}
                  onChange={(e) => setVolumeLevel(e.value)}
                  placeholder="Seleccione nivel"
                  className="w-full"
                />
                {volumeLevel === 'custom' && (
                  <div className="flex align-items-center gap-2 mt-1">
                    <InputNumber
                      value={customVolume}
                      onValueChange={(e) => setCustomVolume(e.value)}
                      suffix=" dB"
                      min={1}
                      max={30}
                      showButtons
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Sección de Split */}
            <div className="field-checkbox mt-2">
              <Checkbox
                inputId="applySplit"
                onChange={e => setApplySplit(e.checked)}
                checked={applySplit}
              />
              <label htmlFor="applySplit" className="font-bold ml-2">Dividir Audio (Split)</label>
            </div>

            {applySplit && (
              <div className="flex flex-column gap-2 ml-4">
                <label className="text-sm">Intervalo de tiempo</label>
                <Dropdown
                  value={splitInterval}
                  options={splitOptions}
                  onChange={(e) => setSplitInterval(e.value)}
                  placeholder="Seleccione intervalo"
                  className="w-full"
                />
                {splitInterval === 'custom' && (
                  <div className="flex align-items-center gap-2 mt-1">
                    <InputNumber
                      value={customSplit}
                      onValueChange={(e) => setCustomSplit(e.value)}
                      suffix=" minutos"
                      min={1}
                      max={600}
                      showButtons
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
};

export default ProcesamientoModal;
