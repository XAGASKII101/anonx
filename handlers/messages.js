const fs = require('fs-extra');
const path = require('path');
const config = require('../config/settings.json');

class MessageHandler {
    constructor() {
        this.userCooldowns = new Map();
        this.messageStats = {
            total: 0,
            commands: 0,
            errors: 0
        };
    }

    async handle(m, sock, commandHandler) {
        try {
            this.messageStats.total++;

            for (const msg of m.messages) {
                if (!msg.message) continue;
                
                const messageInfo = await this.extractMessageInfo(msg, sock);
                if (!messageInfo) continue;

                // Log message for debugging
                this.logMessage(messageInfo);

                // Check if it's a command
                if (messageInfo.text.startsWith(config.prefix)) {
                    await this.handleCommand(messageInfo, sock, commandHandler);
                } else {
                    await this.handleRegularMessage(messageInfo, sock);
                }
            }
        } catch (error) {
            console.error('Message handling error:', error);
            this.messageStats.errors++;
        }
    }

    async extractMessageInfo(msg, sock) {
        try {
            const messageType = Object.keys(msg.message)[0];
            const messageContent = msg.message[messageType];
            
            // Skip if message is from bot itself
            if (msg.key.fromMe) return null;

            const isGroup = msg.key.remoteJid.endsWith('@g.us');
            const sender = msg.key.participant || msg.key.remoteJid;
            const chatId = msg.key.remoteJid;

            let text = '';
            let quotedMsg = null;

            // Extract text based on message type
            switch (messageType) {
                case 'conversation':
                    text = messageContent;
                    break;
                case 'extendedTextMessage':
                    text = messageContent.text || '';
                    quotedMsg = messageContent.contextInfo?.quotedMessage;
                    break;
                case 'imageMessage':
                case 'videoMessage':
                case 'audioMessage':
                case 'documentMessage':
                    text = messageContent.caption || '';
                    break;
                case 'stickerMessage':
                    text = '.sticker'; // Treat stickers as sticker command
                    break;
                default:
                    text = '';
            }

            // Get user info
            let pushName = msg.pushName || 'User';
            let groupMetadata = null;
            
            if (isGroup) {
                try {
                    groupMetadata = await sock.groupMetadata(chatId);
                } catch (error) {
                    console.error('Failed to get group metadata:', error);
                }
            }

            return {
                messageId: msg.key.id,
                chatId,
                sender,
                senderNumber: sender.split('@')[0],
                text: text.trim(),
                messageType,
                messageContent,
                quotedMsg,
                isGroup,
                groupMetadata,
                pushName,
                timestamp: msg.messageTimestamp,
                isOwner: this.isOwner(sender),
                isAdmin: isGroup ? await this.isGroupAdmin(sender, chatId, sock) : false
            };
        } catch (error) {
            console.error('Error extracting message info:', error);
            return null;
        }
    }

    async handleCommand(messageInfo, sock, commandHandler) {
        try {
            this.messageStats.commands++;

            // Check cooldown
            if (this.isOnCooldown(messageInfo.sender)) {
                await sock.sendMessage(messageInfo.chatId, {
                    text: config.messages.cooldown,
                    quoted: { key: { id: messageInfo.messageId }, message: messageInfo.messageContent }
                });
                return;
            }

            // Set cooldown
            this.setCooldown(messageInfo.sender);

            // Process command
            await commandHandler.handle(messageInfo, sock);

        } catch (error) {
            console.error('Command handling error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: config.messages.error,
                quoted: { key: { id: messageInfo.messageId }, message: messageInfo.messageContent }
            });
        }
    }

    async handleRegularMessage(messageInfo, sock) {
        // Handle non-command messages
        // Could implement auto-responses, filters, etc.
        
        // Auto-react if enabled
        if (config.autoReact && Math.random() < 0.1) { // 10% chance
            const reactions = ['👍', '❤️', '😊', '🔥', '👌'];
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            
            try {
                await sock.sendMessage(messageInfo.chatId, {
                    react: {
                        text: randomReaction,
                        key: { id: messageInfo.messageId, fromMe: false, participant: messageInfo.sender }
                    }
                });
            } catch (error) {
                console.error('Auto-react error:', error);
            }
        }
    }

    isOwner(sender) {
        const ownerNumber = config.ownerNumber;
        if (!ownerNumber) return false;
        return sender.includes(ownerNumber);
    }

    async isGroupAdmin(sender, chatId, sock) {
        try {
            if (!chatId.endsWith('@g.us')) return false;
            
            const groupMetadata = await sock.groupMetadata(chatId);
            const participant = groupMetadata.participants.find(p => p.id === sender);
            
            return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        } catch (error) {
            return false;
        }
    }

    isOnCooldown(sender) {
        const lastUsed = this.userCooldowns.get(sender);
        if (!lastUsed) return false;
        
        return Date.now() - lastUsed < config.commandCooldown;
    }

    setCooldown(sender) {
        this.userCooldowns.set(sender, Date.now());
    }

    logMessage(messageInfo) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            chatId: messageInfo.chatId,
            sender: messageInfo.senderNumber,
            text: messageInfo.text.substring(0, 100), // Truncate for privacy
            type: messageInfo.messageType,
            isGroup: messageInfo.isGroup
        };

        // Append to log file
        fs.appendFileSync('./logs/bot.log', JSON.stringify(logEntry) + '\n');
    }

    getStats() {
        return {
            ...this.messageStats,
            activeCooldowns: this.userCooldowns.size
        };
    }
}

module.exports = MessageHandler;
