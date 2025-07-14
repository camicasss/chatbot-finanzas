# chatbot-finanzas
# Chatbot de Inclusión Financiera

Este proyecto es un chatbot educativo que funciona en WhatsApp. Está diseñado para enseñar a madres cabeza de hogar conceptos clave de finanzas personales de manera sencilla e interactiva.

## Funcionalidades

- Lecciones sobre:
  - Ahorro
  - Presupuesto
  - Crédito
  - Emprendimiento
  - Finanzas Digitales
- Menú interactivo de selección de temas
- Quizzes automáticos con retroalimentación inmediata

##  Tecnologías utilizadas

- Node.js
- [Baileys](https://github.com/WhiskeySockets/Baileys) (librería para conexión a WhatsApp)
- JavaScript

## Estructura del proyecto

- `bot.js`: lógica principal del bot.
- `data/modules.js`: contiene el contenido de todas las lecciones.
- `data/quizzes.json`: preguntas y respuestas de cada quiz.
- `auth_info/`: carpeta generada automáticamente para las credenciales de WhatsApp (**no subir a GitHub**).

## Requisitos

- Node.js instalado en tu máquina.
- Una cuenta activa de WhatsApp.
- Dependencias instaladas con:

  ```bash
  npm install
  ```

##  Cómo usar

1. Ejecuta el bot con:

   ```bash
   node bot.js
   ```

2. Escanea el código QR que aparecerá en la consola usando WhatsApp Web.
3. Envía `hola` o `inicio` al bot para ver el menú de temas.

## Créditos

Desarrollado con  por Camila Castro.

