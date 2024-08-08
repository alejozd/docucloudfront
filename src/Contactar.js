import React, { useRef } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { useFormik } from "formik";
import { Toast } from "primereact/toast";
import emailjs from "emailjs-com"; // Librería para enviar correos electrónicos automaticamente

const Contactar = () => {
  const toast = useRef(null);

  const showSuccessMessage = () => {
    toast.current.show({
      severity: "success",
      summary: "Formulario enviado",
      detail: "El mensaje ha sido enviado con éxito",
    });
  };

  const showErrorMessage = (error) => {
    toast.current.show({ severity: "error", summary: "Error", detail: error });
  };

  const enviarCorreo = (values) => {
    const templateParams = {
      from_name: values.nombre,
      to_name: "Alejandro",
      message: values.mensaje,
      phone: values.telefono,
      reply_to: values.email,
    };

    emailjs
      .send(
        "service_p1m3hb3",
        "template_7gotzgk",
        templateParams,
        "_wv37ukba9HbYShcd"
      )
      .then(
        (response) => {
          console.log(
            "Correo enviado correctamente:",
            response.status,
            response.text
          );
          showSuccessMessage();
          formik.resetForm();
        },
        (error) => {
          console.error("Error al enviar el correo:", error);
          showErrorMessage(error.text);
        }
      );
  };

  const formik = useFormik({
    initialValues: {
      nombre: "",
      telefono: "",
      email: "",
      mensaje: "",
    },
    validate: (values) => {
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
    },
    onSubmit: (values) => {
      enviarCorreo(values);
    },
  });

  return (
    <div className="card">
      <h1>Contacto</h1>
      <div className="card flex justify-content-center">
        <Toast ref={toast} />

        <form onSubmit={formik.handleSubmit} className="flex flex-column gap-2">
          <label htmlFor="nombre">Nombre</label>
          <InputText
            id="nombre"
            name="nombre"
            value={formik.values.nombre}
            onChange={formik.handleChange}
            className={formik.errors.nombre ? "p-invalid" : ""}
          />
          {formik.errors.nombre && (
            <small className="p-error">{formik.errors.nombre}</small>
          )}

          <label htmlFor="telefono">Teléfono</label>
          <InputText
            id="telefono"
            name="telefono"
            value={formik.values.telefono}
            onChange={formik.handleChange}
            className={formik.errors.telefono ? "p-invalid" : ""}
          />
          {formik.errors.telefono && (
            <small className="p-error">{formik.errors.telefono}</small>
          )}

          <label htmlFor="email">Correo Electrónico</label>
          <InputText
            id="email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            className={formik.errors.email ? "p-invalid" : ""}
          />
          {formik.errors.email && (
            <small className="p-error">{formik.errors.email}</small>
          )}

          <label htmlFor="mensaje">Mensaje</label>
          <InputTextarea
            id="mensaje"
            name="mensaje"
            value={formik.values.mensaje}
            onChange={formik.handleChange}
            rows={5}
            autoResize
            className={formik.errors.mensaje ? "p-invalid" : ""}
          />
          {formik.errors.mensaje && (
            <small className="p-error">{formik.errors.mensaje}</small>
          )}

          <Button type="submit" label="Enviar" />
        </form>
      </div>
    </div>
  );
};

export default Contactar;
