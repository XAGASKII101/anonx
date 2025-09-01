const fs = require('fs-extra');
const config = require('../config/settings.json');

class AdminService {
    constructor() {
        this.mutedUsers = new Map();
        this.userWarnings = new Map();
    }

    async kick(messageInfo, sock, params) {
        try {
            if (!messageInfo.isGroup) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command can only be used in groups."
                });
            }

            if (!messageInfo.isAdmin && !messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ You need to be a group admin to use this command."
                });
            }

            // Check if replying to a message or mentioning a user
            let targetUser = null;
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            } else if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            }

            if (!targetUser) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Usage: .kick [@user] or reply to a user's message with .kick"
                });
            }

            // Check if target is admin
            const isTargetAdmin = await this.isGroupAdmin(targetUser, messageInfo.chatId, sock);
            if (isTargetAdmin) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Cannot kick group admins."
                });
            }

            await sock.groupParticipantsUpdate(messageInfo.chatId, [targetUser], 'remove');
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `✅ User has been removed from the group.`,
                mentions: [targetUser]
            });

        } catch (error) {
            console.error('Kick error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to kick user. Make sure the bot has admin privileges."
            });
        }
    }

    async promote(messageInfo, sock, params) {
        try {
            if (!messageInfo.isGroup) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command can only be used in groups."
                });
            }

            if (!messageInfo.isAdmin && !messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ You need to be a group admin to use this command."
                });
            }

            let targetUser = null;
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            } else if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            }

            if (!targetUser) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Usage: .promote [@user] or reply to a user's message with .promote"
                });
            }

            await sock.groupParticipantsUpdate(messageInfo.chatId, [targetUser], 'promote');
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `✅ User has been promoted to admin.`,
                mentions: [targetUser]
            });

        } catch (error) {
            console.error('Promote error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to promote user. Make sure the bot has admin privileges."
            });
        }
    }

    async demote(messageInfo, sock, params) {
        try {
            if (!messageInfo.isGroup) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command can only be used in groups."
                });
            }

            if (!messageInfo.isAdmin && !messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ You need to be a group admin to use this command."
                });
            }

            let targetUser = null;
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            } else if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            }

            if (!targetUser) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Usage: .demote [@user] or reply to a user's message with .demote"
                });
            }

            await sock.groupParticipantsUpdate(messageInfo.chatId, [targetUser], 'demote');
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `✅ User has been demoted from admin.`,
                mentions: [targetUser]
            });

        } catch (error) {
            console.error('Demote error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to demote user. Make sure the bot has admin privileges."
            });
        }
    }

    async mute(messageInfo, sock, params) {
        try {
            if (!messageInfo.isGroup) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command can only be used in groups."
                });
            }

            if (!messageInfo.isAdmin && !messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ You need to be a group admin to use this command."
                });
            }

            const duration = parseInt(params[0]) || 60; // Default 60 minutes
            
            let targetUser = null;
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            } else if (params.length > 1 && params[1].includes('@')) {
                targetUser = params[1].replace('@', '') + '@s.whatsapp.net';
            }

            if (!targetUser) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Usage: .mute [minutes] [@user] or reply to a user's message with .mute [minutes]"
                });
            }

            // Store mute information
            const muteKey = `${messageInfo.chatId}_${targetUser}`;
            const muteUntil = Date.now() + (duration * 60 * 1000);
            
            this.mutedUsers.set(muteKey, {
                until: muteUntil,
                chatId: messageInfo.chatId,
                user: targetUser
            });

            await sock.sendMessage(messageInfo.chatId, {
                text: `🔇 User has been muted for ${duration} minutes.`,
                mentions: [targetUser]
            });

            // Auto-unmute after duration
            setTimeout(() => {
                this.mutedUsers.delete(muteKey);
                sock.sendMessage(messageInfo.chatId, {
                    text: `🔊 User has been automatically unmuted.`,
                    mentions: [targetUser]
                });
            }, duration * 60 * 1000);

        } catch (error) {
            console.error('Mute error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to mute user."
            });
        }
    }

    async tagall(messageInfo, sock, params) {
        try {
            if (!messageInfo.isGroup) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command can only be used in groups."
                });
            }

            if (!messageInfo.isAdmin && !messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ You need to be a group admin to use this command."
                });
            }

            const groupMetadata = await sock.groupMetadata(messageInfo.chatId);
            const participants = groupMetadata.participants.map(p => p.id);
            
            const message = params.length > 0 ? params.join(' ') : 'Everyone, attention please!';
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `📢 *Group Announcement*\n\n${message}`,
                mentions: participants
            });

        } catch (error) {
            console.error('Tag all error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to tag all members."
            });
        }
    }

    async warn(messageInfo, sock, params) {
        try {
            if (!messageInfo.isGroup) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command can only be used in groups."
                });
            }

            if (!messageInfo.isAdmin && !messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ You need to be a group admin to use this command."
                });
            }

            let targetUser = null;
            let reason = 'No reason provided';
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
                reason = params.join(' ') || reason;
            } else if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
                reason = params.slice(1).join(' ') || reason;
            }

            if (!targetUser) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Usage: .warn [@user] [reason] or reply to a user's message with .warn [reason]"
                });
            }

            // Store warning
            const warnKey = `${messageInfo.chatId}_${targetUser}`;
            const existingWarnings = this.userWarnings.get(warnKey) || [];
            
            const newWarning = {
                reason,
                timestamp: Date.now(),
                admin: messageInfo.sender
            };
            
            existingWarnings.push(newWarning);
            this.userWarnings.set(warnKey, existingWarnings);

            const warningCount = existingWarnings.length;
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `⚠️ *Warning Issued*\n\n👤 User: @${targetUser.split('@')[0]}\n📝 Reason: ${reason}\n📊 Warnings: ${warningCount}/3`,
                mentions: [targetUser]
            });

            // Auto-kick after 3 warnings
            if (warningCount >= 3) {
                setTimeout(async () => {
                    try {
                        await sock.groupParticipantsUpdate(messageInfo.chatId, [targetUser], 'remove');
                        await sock.sendMessage(messageInfo.chatId, {
                            text: `🚫 User has been automatically removed after 3 warnings.`,
                            mentions: [targetUser]
                        });
                        this.userWarnings.delete(warnKey);
                    } catch (error) {
                        console.error('Auto-kick error:', error);
                    }
                }, 2000);
            }

        } catch (error) {
            console.error('Warn error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to issue warning."
            });
        }
    }

    async ban(messageInfo, sock, params) {
        // Similar to kick but with permanent record
        await this.kick(messageInfo, sock, params);
    }

    async unban(messageInfo, sock, params) {
        try {
            await sock.sendMessage(messageInfo.chatId, {
                text: "🚧 Unban feature is under development. Use group invite links to re-add users."
            });
        } catch (error) {
            console.error('Unban error:', error);
        }
    }

    async unmute(messageInfo, sock, params) {
        try {
            if (!messageInfo.isGroup) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command can only be used in groups."
                });
            }

            if (!messageInfo.isAdmin && !messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ You need to be a group admin to use this command."
                });
            }

            let targetUser = null;
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            } else if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            }

            if (!targetUser) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Usage: .unmute [@user] or reply to a user's message with .unmute"
                });
            }

            const muteKey = `${messageInfo.chatId}_${targetUser}`;
            
            if (!this.mutedUsers.has(muteKey)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ User is not currently muted."
                });
            }

            this.mutedUsers.delete(muteKey);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🔊 User has been unmuted.`,
                mentions: [targetUser]
            });

        } catch (error) {
            console.error('Unmute error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to unmute user."
            });
        }
    }

    async warnings(messageInfo, sock, params) {
        try {
            if (!messageInfo.isGroup) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command can only be used in groups."
                });
            }

            let targetUser = null;
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            } else if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            }

            if (!targetUser) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Usage: .warnings [@user] or reply to a user's message with .warnings"
                });
            }

            const warnKey = `${messageInfo.chatId}_${targetUser}`;
            const userWarnings = this.userWarnings.get(warnKey) || [];

            if (!userWarnings.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `✅ @${targetUser.split('@')[0]} has no warnings.`,
                    mentions: [targetUser]
                });
            }

            let warningText = `⚠️ *Warnings for @${targetUser.split('@')[0]}*\n\n`;
            warningText += `📊 Total Warnings: ${userWarnings.length}/3\n\n`;

            userWarnings.forEach((warning, index) => {
                const date = new Date(warning.timestamp).toLocaleDateString();
                const admin = warning.admin.split('@')[0];
                warningText += `${index + 1}. **${warning.reason}**\n`;
                warningText += `   👮 Admin: @${admin}\n`;
                warningText += `   📅 Date: ${date}\n\n`;
            });

            if (userWarnings.length >= 3) {
                warningText += `🚫 **CRITICAL**: User will be auto-kicked on next warning!`;
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: warningText,
                mentions: [targetUser, warning.admin]
            });

        } catch (error) {
            console.error('Warnings error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to retrieve warnings."
            });
        }
    }

    async deleteMessage(messageInfo, sock, params) {
        try {
            if (!messageInfo.isGroup) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command can only be used in groups."
                });
            }

            if (!messageInfo.isAdmin && !messageInfo.isOwner) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ You need to be a group admin to use this command."
                });
            }

            if (!messageInfo.quotedMsg) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Usage: Reply to a message with .delete or .del to delete it"
                });
            }

            // Delete the quoted message
            await sock.sendMessage(messageInfo.chatId, {
                delete: messageInfo.quotedMsg.key
            });

            // Send confirmation that will auto-delete
            const confirmMsg = await sock.sendMessage(messageInfo.chatId, {
                text: "🗑️ Message deleted by admin."
            });

            // Auto-delete confirmation after 3 seconds
            setTimeout(async () => {
                try {
                    await sock.sendMessage(messageInfo.chatId, {
                        delete: confirmMsg.key
                    });
                } catch (error) {
                    console.log('Failed to delete confirmation message');
                }
            }, 3000);

        } catch (error) {
            console.error('Delete message error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to delete message. Make sure the bot has admin privileges."
            });
        }
    }

    async isGroupAdmin(userId, groupId, sock) {
        try {
            const groupMetadata = await sock.groupMetadata(groupId);
            const participant = groupMetadata.participants.find(p => p.id === userId);
            return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        } catch (error) {
            return false;
        }
    }

    isUserMuted(chatId, userId) {
        const muteKey = `${chatId}_${userId}`;
        const muteInfo = this.mutedUsers.get(muteKey);
        
        if (!muteInfo) return false;
        
        if (Date.now() > muteInfo.until) {
            this.mutedUsers.delete(muteKey);
            return false;
        }
        
        return true;
    }
}

module.exports = AdminService;
