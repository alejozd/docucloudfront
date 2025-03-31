import React, { useRef } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { useFormik } from "formik";
import { Toast } from "primereact/toast";
import emailjs from "emailjs-com"; // Librería para enviar correos electrónicos automaticamente

// Utility function to show toast messages
const showToast = (toast, severity, summary, detail) => {
  toast.current.show({ severity, summary, detail });
};

// Email service abstraction
const sendEmail = (templateParams) => {
  return emailjs.send(
    "service_p1m3hb3",
    "template_7gotzgk",
    templateParams,
    "_wv37ukba9HbYShcd"
  );
};

// Form validation logic
const validateForm = (values) => {
  const errors = {};

  if (!values.nombre) {
    errors.nombre = "El nombre es requerido.";
  }

  if (!values.telefono) {
    errors.telefono = "El teléfono es requerido.";
  }

  if (!values.email) {
    errors.email = "El correo electrónico es requerido.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Correo electrónico inválido.";
  }

  if (!values.mensaje) {
    errors.mensaje = "El mensaje es requerido.";
  }

  return errors;
};

// Form field component
const FormField = ({ id, label, component: Component, formik, ...props }) => (
  <>
    <label htmlFor={id}>{label}</label>
    <Component
      id={id}
      name={id}
      value={formik.values[id]}
      onChange={formik.handleChange}
      className={formik.errors[id] ? "p-invalid" : ""}
      {...props}
    />
    {formik.errors[id] && (
      <small className="p-error">{formik.errors[id]}</small>
    )}
  </>
);

const Contactar = () => {
  const toast = useRef(null);

  const formik = useFormik({
    initialValues: {
      nombre: "",
      telefono: "",
      email: "",
      mensaje: "",
    },
    validate: validateForm,
    onSubmit: (values, { resetForm }) => {
      const templateParams = {
        from_name: values.nombre,
        to_name: "Alejandro",
        message: values.mensaje,
        phone: values.telefono,
        reply_to: values.email,
      };

      sendEmail(templateParams)
        .then((response) => {
          console.log(
            "Correo enviado correctamente:",
            response.status,
            response.text
          );
          showToast(
            toast,
            "success",
            "Formulario enviado",
            "El mensaje ha sido enviado con éxito"
          );
          resetForm();
        })
        .catch((error) => {
          console.error("Error al enviar el correo:", error);
          showToast(toast, "error", "Error", error.text);
        });
    },
  });

  return (
    <div className="card">
      <h1>Contacto</h1>
      <div className="card flex justify-content-center">
        <Toast ref={toast} />

        <form onSubmit={formik.handleSubmit} className="flex flex-column gap-2">
          <FormField
            id="nombre"
            label="Nombre"
            component={InputText}
            formik={formik}
          />
          <FormField
            id="telefono"
            label="Teléfono"
            component={InputText}
            formik={formik}
          />
          <FormField
            id="email"
            label="Correo Electrónico"
            component={InputText}
            formik={formik}
          />
          <FormField
            id="mensaje"
            label="Mensaje"
            component={InputTextarea}
            formik={formik}
            rows={5}
            autoResize
          />

          <Button type="submit" label="Enviar" />
        </form>
      </div>
    </div>
  );
};

export default Contactar;
