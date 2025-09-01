const fs = require('fs-extra');
const path = require('path');
const config = require('../config/settings.json');

class OwnerService {
    constructor() {
        this.botSettings = {
            mode: 'public', // public/private
            autoStatus: false,
            antiDelete: false,
            autoReact: false
        };
    }

    async setMode(messageInfo, sock, params) {
        try {
            if (!messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command is only available to the bot owner."
                });
            }

            const mode = params[0]?.toLowerCase();
            
            if (!['public', 'private'].includes(mode)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "⚙️ Usage: .mode [public/private]\n\nModes:\n🌐 Public: Bot works in all chats\n🔒 Private: Bot works only for owner"
                });
            }

            this.botSettings.mode = mode;
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `⚙️ *Bot Mode Updated*\n\n📊 Mode: ${mode.toUpperCase()}\n${mode === 'public' ? '🌐 Bot is now accessible to everyone' : '🔒 Bot is now private (owner only)'}`
            });

        } catch (error) {
            console.error('Set mode error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to change bot mode."
            });
        }
    }

    async autoStatus(messageInfo, sock, params) {
        try {
            if (!messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command is only available to the bot owner."
                });
            }

            const setting = params[0]?.toLowerCase();
            
            if (!['on', 'off'].includes(setting)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "📱 Usage: .autostatus [on/off]\n\nThis will automatically update bot's WhatsApp status."
                });
            }

            this.botSettings.autoStatus = setting === 'on';
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `📱 *Auto Status ${setting === 'on' ? 'Enabled' : 'Disabled'}*\n\n${setting === 'on' ? '✅ Bot will automatically update status' : '❌ Auto status updates disabled'}`
            });

        } catch (error) {
            console.error('Auto status error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to change auto status setting."
            });
        }
    }

    async antiDelete(messageInfo, sock, params) {
        try {
            if (!messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command is only available to the bot owner."
                });
            }

            const setting = params[0]?.toLowerCase();
            
            if (!['on', 'off'].includes(setting)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🛡️ Usage: .antidelete [on/off]\n\nThis will prevent deleted messages from being lost."
                });
            }

            this.botSettings.antiDelete = setting === 'on';
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `🛡️ *Anti-Delete ${setting === 'on' ? 'Enabled' : 'Disabled'}*\n\n${setting === 'on' ? '✅ Bot will backup deleted messages' : '❌ Anti-delete protection disabled'}`
            });

        } catch (error) {
            console.error('Anti delete error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to change anti-delete setting."
            });
        }
    }

    async clearSession(messageInfo, sock, params) {
        try {
            if (!messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command is only available to the bot owner."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🔄 Clearing session data... Bot will restart."
            });

            // Clear auth info
            await fs.remove('./auth_info').catch(() => {});
            
            setTimeout(() => {
                process.exit(0); // This will restart the bot
            }, 2000);

        } catch (error) {
            console.error('Clear session error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to clear session."
            });
        }
    }

    async clearTemp(messageInfo, sock, params) {
        try {
            if (!messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command is only available to the bot owner."
                });
            }

            const tempDir = './temp';
            const files = await fs.readdir(tempDir);
            const filesToDelete = files.filter(file => file !== '.gitkeep');

            for (const file of filesToDelete) {
                await fs.unlink(path.join(tempDir, file));
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: `🗑️ *Temporary Files Cleared*\n\n📊 Files deleted: ${filesToDelete.length}\n💾 Temp directory cleaned`
            });

        } catch (error) {
            console.error('Clear temp error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to clear temporary files."
            });
        }
    }

    async setProfilePicture(messageInfo, sock, params) {
        try {
            if (!messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command is only available to the bot owner."
                });
            }

            if (!messageInfo.quotedMsg || !messageInfo.quotedMsg.imageMessage) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🖼️ Usage: Reply to an image with .setpp\nThis will set the bot's profile picture."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🖼️ Setting profile picture..."
            });

            // Download the image
            const imageMessage = messageInfo.quotedMsg.imageMessage;
            const buffer = await sock.downloadMediaMessage({
                key: messageInfo.quotedMsg.key,
                message: { imageMessage }
            });

            if (!buffer) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Failed to download image."
                });
            }

            // Set profile picture
            await sock.updateProfilePicture(sock.user.id, buffer);
            
            await sock.sendMessage(messageInfo.chatId, {
                text: "✅ Profile picture updated successfully!"
            });

        } catch (error) {
            console.error('Set profile picture error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to set profile picture."
            });
        }
    }

    async autoReact(messageInfo, sock, params) {
        try {
            if (!messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command is only available to the bot owner."
                });
            }

            const setting = params[0]?.toLowerCase();
            
            if (!['on', 'off'].includes(setting)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "😊 Usage: .areact [on/off]\n\nThis will make the bot automatically react to messages."
                });
            }

            this.botSettings.autoReact = setting === 'on';
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `😊 *Auto React ${setting === 'on' ? 'Enabled' : 'Disabled'}*\n\n${setting === 'on' ? '✅ Bot will automatically react to messages' : '❌ Auto reactions disabled'}`
            });

        } catch (error) {
            console.error('Auto react error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to change auto react setting."
            });
        }
    }

    async whoAmI(messageInfo, sock, params) {
        try {
            if (!messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command is only available to the bot owner."
                });
            }

            const botInfo = `🤖 *Bot Identity*\n\n` +
                           `📱 Name: ${config.botName}\n` +
                           `🆔 JID: ${sock.user?.id}\n` +
                           `📞 Number: ${sock.user?.id.split('@')[0]}\n` +
                           `⚙️ Mode: ${this.botSettings.mode.toUpperCase()}\n` +
                           `📱 Auto Status: ${this.botSettings.autoStatus ? 'ON' : 'OFF'}\n` +
                           `🛡️ Anti Delete: ${this.botSettings.antiDelete ? 'ON' : 'OFF'}\n` +
                           `😊 Auto React: ${this.botSettings.autoReact ? 'ON' : 'OFF'}\n` +
                           `⏰ Uptime: ${this.formatUptime(process.uptime())}\n` +
                           `🔧 Version: 1.0.0`;

            await sock.sendMessage(messageInfo.chatId, { text: botInfo });

        } catch (error) {
            console.error('Who am I error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get bot information."
            });
        }
    }

    formatUptime(uptime) {
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        result += `${seconds}s`;

        return result.trim();
    }
}

module.exports = OwnerService;