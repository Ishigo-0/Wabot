const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDvnc38fwgRjZ1Psxk40RykJQ9yk_LqdKw");


const ask = async (questionText) => {

  
  
}



async function connectToWhatsApp() {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const chat = model.startChat({
  generationConfig: {
    maxOutputTokens: 600,
  },
});
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    // إنشاء اتصال باستخدام Baileys
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // طباعة رمز QR في المحطة
    });

    // التعامل مع أحداث الاتصال
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            // إعادة الاتصال إذا لم يكن بسبب تسجيل الخروج
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp');
        }
    });

    // حفظ بيانات المصادقة
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async (m) => {
    console.log('الرسائل المستلمة', m);

    if (m.type === 'notify') {
        for (const msg of m.messages) {
                if (!msg.key.fromMe) {
                    console.log('رسالة جديدة:', msg);

                    // التحقق من نوع ومحتوى الرسالة
                    if (msg.message?.conversation) {
                        const messageText = msg.message.conversation.toLowerCase();


const question = await chat.sendMessage(messageText);
                        const answire = await question.response;
  
                        const reply = answire.text()
                        await sock.sendMessage(
                            msg.key.remoteJid, 
                            { text: reply },
                            { quoted: msg }
                        );
                    }
                }
        }
    }
});

}

// بدء الاتصال
connectToWhatsApp();