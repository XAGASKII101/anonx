// Polyfill for File in Node <20
if (typeof File === "undefined") {
  global.File = class File extends Blob {
    constructor(chunks, filename, options = {}) {
      super(chunks, options);
      this.name = filename;
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

/**
 * ANONYMOUS X - WhatsApp Bot
 * Refactored for ESM (no deprecated printQRInTerminal)
 * Copyright (c) 2025
 *
 * MIT Licensed
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";

console.log("🚀 Initializing ANONYMOUS X Bot...");

async function startBot() {
  // Load or create auth state (saves your login session)
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  // Create the socket
  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["ANONYMOUS X", "Chrome", "1.0.0"], // Bot identity
  });

  console.log("⏳ Connecting to WhatsApp...");

  // Listen for connection updates
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    // 👇 Handle QR properly
    if (qr) {
      console.log("📲 Scan this QR to log in:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log(`❌ Connection closed. Reconnecting... ${shouldReconnect}`);
      if (shouldReconnect) {
        startBot();
      } else {
        console.log("❌ Logged out. Please delete 'auth_info' folder and restart.");
      }
    } else if (connection === "open") {
      console.log("✅ ANONYMOUS X Bot connected successfully!");
    }
  });

  // Save session whenever it updates
  sock.ev.on("creds.update", saveCreds);

  // Example auto-reply
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    console.log(`📩 Message from ${from}: ${text}`);

    if (text.toLowerCase() === "ping") {
      await sock.sendMessage(from, { text: "🏓 Pong! – ANONYMOUS X Bot" });
    }
  });
}

// Start the bot
startBot().catch((err) => {
  console.error("Fatal error:", err);
});
