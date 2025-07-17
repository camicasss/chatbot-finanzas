const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
  } = require('@whiskeysockets/baileys');
  const P = require('pino');
  const qrcode = require('qrcode-terminal');
  
  // Importa tus lecciones y quizzes
  const modules = require('./data/lecciones.js');
  const quizzes = require('./data/quizzes.json');  
  
  const sessionState = {}; // Para guardar en qué paso está cada usuario
  
  async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();
  
    const sock = makeWASocket({
      logger: P({ level: 'silent' }),
      auth: state,
      version
    });
  
    sock.ev.on('connection.update', (update) => {
      const { connection, qr, lastDisconnect } = update;
      if (qr) qrcode.generate(qr, { small: true });
      if (connection === 'open') console.log('✅ Conexión exitosa con WhatsApp');
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('❌ Conexión cerrada. Reconectando...', shouldReconnect);
        if (shouldReconnect) connectToWhatsApp();
      }
    });
  
    sock.ev.on('creds.update', saveCreds);
  
    sock.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;
  
      const from = msg.key.remoteJid;
      const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim().toLowerCase();
  
      if (!sessionState[from]) sessionState[from] = { step: 'inicio' };
  
      const state = sessionState[from];
  
      if (['hola', 'hi', 'buenas', 'inicio', 'buenos dias', 'buenas tardes', 'buenas noches' ].includes(text)) {
        state.step = 'inicio';
        await sock.sendMessage(from, { text: 
  `👋 ¡Hola! Bienvenida al Chat de Finanzas para Mujeres 💬
    Soy tu asistente virtual y estoy aquí para acompañarte en el camino hacia una mejor organización de tu dinero.
    No necesitas ser experta, ¡empezamos desde lo básico!
  
  Escribe el número del tema que quieres aprender:
  
  1️⃣ Ahorro
  2️⃣ Presupuesto
  3️⃣ Crédito
  4️⃣ Emprendimiento
  5️⃣ Finanzas Digitales
  
  Por ejemplo, escribe *1* para Ahorro.`});
        return;
      }
  
      // Si el usuario eligió un módulo
      if (state.step === 'inicio') {
        let modulo = '';
        if (text === '1') modulo = 'ahorro';
        if (text === '2') modulo = 'presupuesto';
        if (text === '3') modulo = 'credito';
        if (text === '4') modulo = 'emprendimiento';
        if (text === '5') modulo = 'finanzasDigitales';
  
        if (modulo && modules[modulo]) {
          state.step = 'leccion';
          state.modulo = modulo;
          await sock.sendMessage(from, { text: `📘 *Lección sobre ${modulo.charAt(0).toUpperCase() + modulo.slice(1)}*\n\n${modules[modulo]}` });
          await sock.sendMessage(from, { text: '¿Quieres hacer el quiz de este tema? Escribe *sí* o *no*.' });
          return;
        } else {
          await sock.sendMessage(from, { text: '❓ Por favor escribe un número válido del 1 al 5 o *inicio* para ver el menú.' });
          return;
        }
      }
  
      // Si el usuario responde si quiere el quiz
      if (state.step === 'leccion') {
        if (text === 'sí' || text === 'si') {
          const quiz = quizzes[state.modulo];
          if (quiz && quiz.length > 0) {
            state.step = 'quiz';
            state.quizIndex = 0;
            await sock.sendMessage(from, { text: `📝 *Quiz ${state.modulo}*\n\n${quiz[0].pregunta}\n(Escribe la letra de tu respuesta)` });
          } else {
            await sock.sendMessage(from, { text: '⚠️ Este módulo no tiene preguntas de quiz.' });
            state.step = 'inicio';
          }
          return;
        }
        if (text === 'no') {
          await sock.sendMessage(from, { text: '✅ Perfecto. Si quieres otro tema, escribe *inicio*.' });
          state.step = 'inicio';
          return;
        }
        await sock.sendMessage(from, { text: '❓ Responde *sí* o *no* por favor.' });
        return;
      }
  
      // Si está haciendo el quiz
      if (state.step === 'quiz') {
        const quiz = quizzes[state.modulo];
        const idx = state.quizIndex;
        const respuestaCorrecta = quiz[idx].respuesta;
  
        if (text === respuestaCorrecta) {
          await sock.sendMessage(from, { text: '✅ ¡Respuesta correcta!' });
        } else {
          await sock.sendMessage(from, { text: `❌ Respuesta incorrecta. La correcta era *${respuestaCorrecta}*.` });
        }
  
        state.quizIndex++;
        if (state.quizIndex < quiz.length) {
          await sock.sendMessage(from, { text: `📝 ${quiz[state.quizIndex].pregunta}\n(Escribe la letra de tu respuesta)` });
        } else {
          await sock.sendMessage(from, { text: '🎉 Has terminado el quiz. Escribe *inicio* para elegir otro tema.' });
          state.step = 'inicio';
        }
        return;
      }
  
      // Si no coincide nada
      await sock.sendMessage(from, { text: '❓ No entendí tu mensaje. Escribe *inicio* para ver el menú.' });
    });
  }
  
  connectToWhatsApp().catch(err => console.error('❌ Error:', err));
  