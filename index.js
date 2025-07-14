const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const lecciones = JSON.parse(fs.readFileSync('./data/lecciones.json'));
const quizzes = JSON.parse(fs.readFileSync('./data/quizzes.json'));

let userSessions = {};

app.post('/webhook', (req, res) => {
  const mensaje = req.body.Body.trim().toLowerCase();
  const numero = req.body.From;

  if (userSessions[numero]) {
    const session = userSessions[numero];

    if (session.estado === 'espera_quiz' && mensaje === 'sí') {
      session.estado = 'quiz';
      session.preguntaActual = 0;
      return responder(res, quizzes[session.modulo][0].pregunta);
    }

    if (session.estado === 'quiz') {
      const quiz = quizzes[session.modulo];
      const preguntaActual = quiz[session.preguntaActual];
      let respuesta = '';
      if (mensaje === preguntaActual.respuesta) {
        respuesta = '✅ ¡Correcto!';
      } else {
        respuesta = '❌ Incorrecto.';
      }
      session.preguntaActual++;
      if (session.preguntaActual < quiz.length) {
        respuesta += '\n\n' + quiz[session.preguntaActual].pregunta;
      } else {
        respuesta += '\n🎉 Has terminado el quiz.';
        delete userSessions[numero];
      }
      return responder(res, respuesta);
    }
  }

  const temas = Object.keys(lecciones);
  const encontrado = temas.find(t => mensaje.includes(t));
  if (encontrado) {
    userSessions[numero] = { estado: 'espera_quiz', modulo: encontrado };
    return responder(
      res,
      `${lecciones[encontrado]}\n\n¿Listo/a para el quiz? Escribe "sí" para comenzar.`
    );
  }

  return responder(
    res,
    `Hola 👋 Soy tu asistente de educación financiera.
Escribe el tema que deseas aprender:
- Ahorro
- Presupuesto
- Crédito
- Emprendimiento
- Finanzas Digitales`
  );
});

function responder(res, texto) {
  res.set('Content-Type', 'text/xml');
  res.send(`<Response><Message>${texto}</Message></Response>`);
}

app.listen(3000, () => {
  console.log('Servidor iniciado en puerto 3000');
});

