import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';

/**
 * Modal para pedir password de autenticación
 * Similar al módulo "Aerolínea" (ZamAir)
 */
const PasswordModal = ({ visible, onHide, onAuthenticate, loading }) => {
  const [password, setPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleAuthenticate = () => {
    if (!password.trim()) {
      setErrorMsg('Por favor ingrese el password');
      return;
    }
    onAuthenticate(password);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAuthenticate();
    }
  };

  const footerContent = (
    <div className="flex justify-content-end gap-2">
      <Button 
        label="Cancelar" 
        icon="pi pi-times" 
        className="p-button-text" 
        onClick={onHide} 
      />
      <Button 
        label="Ingresar" 
        icon="pi pi-check" 
        onClick={handleAuthenticate} 
        loading={loading}
        disabled={!password.trim()}
      />
    </div>
  );

  return (
    <Dialog
      header="Autenticación Requerida"
      visible={visible}
      modal
      closable={false}
      dismissableMask={false}
      style={{ width: '400px' }}
      footer={footerContent}
      onHide={onHide}
    >
      <div className="flex flex-column gap-3 p-3">
        <p className="m-0 text-color-secondary">
          Por favor ingrese el password para acceder al módulo de descarga de audios desde YouTube.
        </p>
        
        <div className="flex flex-column gap-2">
          <label htmlFor="password" className="font-medium">Password</label>
          <InputText
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMsg('');
            }}
            onKeyPress={handleKeyPress}
            placeholder="Ingrese el password"
            className="w-full"
            autoFocus
          />
          {errorMsg && (
            <small className="p-error">{errorMsg}</small>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default PasswordModal;
