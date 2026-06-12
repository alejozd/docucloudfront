import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import '../../styles/PasswordModal.css';

// Obtener API Key desde variables de entorno
const REACT_APP_API_KEY = process.env.REACT_APP_API_KEY;

/**
 * Modal para pedir password de autenticación
 * Similar al módulo "Aerolínea" (ZamAir)
 * Usa la ZAM_API_KEY del backend para validación
 */
const PasswordModal = ({ visible, onHide, onAuthenticate, loading }) => {
  const [password, setPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  
  // Verificar si REACT_APP_API_KEY está definida
  React.useEffect(() => {
    if (!REACT_APP_API_KEY) {
      console.warn('⚠️ ADVERTENCIA: REACT_APP_API_KEY no está definida en el archivo .env');
      console.warn('Por favor, configura REACT_APP_API_KEY en tu archivo .env con la misma clave que el backend');
    }
  }, []);

  const handleAuthenticate = () => {
    if (!password.trim()) {
      setErrorMsg('Por favor ingrese el password');
      return;
    }
    
    // Validar que el password coincida con REACT_APP_API_KEY
    if (REACT_APP_API_KEY && password !== REACT_APP_API_KEY) {
      setErrorMsg('Password incorrecto. Verifique la clave.');
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
    <div className="password-modal-footer">
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
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-lock password-modal-header-icon"></i>
          <span className="font-bold">Acceso Restringido</span>
        </div>
      }
      visible={visible}
      modal
      closable={false}
      dismissableMask={false}
      style={{ width: '90vw', maxWidth: '400px' }}
      footer={footerContent}
      onHide={onHide}
      className="p-fluid"
    >
      <div className="password-modal-content">
        <div className="password-modal-info">
          <div className="password-modal-shield-badge">
            <i className="pi pi-shield password-modal-shield-icon"></i>
          </div>
          <span className="password-modal-title">Autenticación Requerida</span>
          <p className="password-modal-description">
            Ingrese su <strong>clave de acceso</strong> para habilitar las herramientas de descarga y procesamiento.
          </p>
        </div>
        
        {!REACT_APP_API_KEY && (
          <div className="password-modal-warning">
            <i className="pi pi-exclamation-triangle password-modal-warning-icon"></i>
            <div className="flex flex-column">
              <span className="password-modal-warning-title">Falta Configuración</span>
              <span className="password-modal-warning-text">
                API Key no encontrada en el entorno.
              </span>
            </div>
          </div>
        )}
        
        <div className="password-modal-field-group">
          <span className="p-input-icon-left w-full">
            <i className="pi pi-key z-2" />
            <Password
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Clave de acceso"
              toggleMask
              feedback={false}
              autoFocus
              inputClassName="password-modal-input-field"
              className="password-modal-password-comp"
            />
          </span>
          {errorMsg && (
            <small className="password-modal-error">
              <i className="pi pi-times-circle"></i>
              {errorMsg}
            </small>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default PasswordModal;
