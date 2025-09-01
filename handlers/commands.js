// handlers/commands.js
// ✅ ESM version with export default

export default class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.registerDefaultCommands();
  }

  // Register default bot commands
  registerDefaultCommands() {
    // .help command
    this.commands.set("help", {
      description: "Show available commands",
      execute: async (msg, sock) => {
        await sock.sendMessage(msg.chatId, {
          text: `📖 *ANONYMOUS X Bot Commands* 📖

.help - Show this help message
.ping - Test the bot response
.gpt <question> - Ask AI a question
.joke - Get a random joke`,
        });
      },
    });

    // .ping command
    this.commands.set("ping", {
      description: "Check if bot is alive",
      execute: async (msg, sock) => {
        await sock.sendMessage(msg.chatId, {
          text: "🏓 Pong! – ANONYMOUS X Bot",
        });
      },
    });

    // .joke command
    this.commands.set("joke", {
      description: "Get a random joke",
      execute: async (msg, sock) => {
        const jokes = [
          "😂 Why don’t skeletons fight each other? They don’t have the guts.",
          "🤣 I told my computer I needed a break, and now it won’t stop sending me KitKats.",
          "😅 Parallel lines have so much in common… it’s a shame they’ll never meet.",
        ];
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
        await sock.sendMessage(msg.chatId, { text: randomJoke });
      },
    });
  }

  // Command handler
  async handle(messageInfo, sock) {
    const { text, chatId } = messageInfo;
    if (!text.startsWith(".")) return; // Only process commands with prefix "."

    const args = text.trim().split(/\s+/);
    const commandName = args[0].slice(1).toLowerCase(); // remove prefix (.)
    const command = this.commands.get(commandName);

    if (!command) return;

    try {
      await command.execute(messageInfo, sock);
    } catch (err) {
      console.error(`❌ Error executing command ${commandName}:`, err);
      await sock.sendMessage(chatId, { text: "⚠️ Command failed!" });
    }
  }
}
