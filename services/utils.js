const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

class UtilsService {
    constructor() {
        this.weatherApiKey = process.env.WEATHER_API_KEY || 'demo_key';
    }

    async sticker(messageInfo, sock, params) {
        try {
            // Check if replying to an image
            if (!messageInfo.quotedMsg || !messageInfo.quotedMsg.imageMessage) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "📎 Usage: Reply to an image with .sticker\nOr send an image with .sticker as caption"
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🎨 Creating sticker... Please wait."
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

            // Process image to sticker format
            const stickerBuffer = await sharp(buffer)
                .resize(512, 512, { 
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp()
                .toBuffer();

            // Send as sticker
            await sock.sendMessage(messageInfo.chatId, {
                sticker: stickerBuffer
            });

        } catch (error) {
            console.error('Sticker creation error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to create sticker. Make sure you replied to an image."
            });
        }
    }

    async weather(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🌤️ Usage: .weather [city name]\nExample: .weather London"
                });
            }

            const city = params.join(' ');
            
            await sock.sendMessage(messageInfo.chatId, {
                text: "🌤️ Getting weather information..."
            });

            try {
                // Using OpenWeatherMap API (requires API key)
                const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
                    params: {
                        q: city,
                        appid: this.weatherApiKey,
                        units: 'metric'
                    }
                });

                const weather = response.data;
                
                const weatherText = `🌤️ *Weather in ${weather.name}, ${weather.sys.country}*\n\n` +
                                   `🌡️ Temperature: ${weather.main.temp}°C\n` +
                                   `🤔 Feels like: ${weather.main.feels_like}°C\n` +
                                   `📝 Description: ${weather.weather[0].description}\n` +
                                   `💧 Humidity: ${weather.main.humidity}%\n` +
                                   `🌬️ Wind: ${weather.wind.speed} m/s\n` +
                                   `👁️ Visibility: ${weather.visibility / 1000} km\n` +
                                   `🔽 Pressure: ${weather.main.pressure} hPa`;

                await sock.sendMessage(messageInfo.chatId, { text: weatherText });

            } catch (apiError) {
                if (apiError.response?.status === 404) {
                    await sock.sendMessage(messageInfo.chatId, {
                        text: "❌ City not found. Please check the spelling and try again."
                    });
                } else {
                    await sock.sendMessage(messageInfo.chatId, {
                        text: "❌ Weather service is currently unavailable. Please try again later."
                    });
                }
            }

        } catch (error) {
            console.error('Weather error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get weather information."
            });
        }
    }

    async calculator(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🔢 Usage: .calculator [expression]\nExample: .calculator 2 + 2\nSupports: +, -, *, /, %, ^, sqrt(), sin(), cos(), tan()"
                });
            }

            const expression = params.join(' ');
            
            // Security: only allow safe mathematical expressions
            if (!/^[0-9+\-*/.() ^sqrt()sin()cos()tan()%\s]+$/.test(expression)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Invalid expression. Only mathematical operations are allowed."
                });
            }

            try {
                // Simple evaluation for basic math
                let result;
                const sanitized = expression
                    .replace(/\^/g, '**')
                    .replace(/sqrt\(/g, 'Math.sqrt(')
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(');

                result = eval(sanitized);

                await sock.sendMessage(messageInfo.chatId, {
                    text: `🔢 *Calculator*\n\n📝 Expression: ${expression}\n🎯 Result: ${result}`
                });

            } catch (mathError) {
                await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Invalid mathematical expression. Please check your input."
                });
            }

        } catch (error) {
            console.error('Calculator error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Calculator error occurred."
            });
        }
    }

    async screenshot(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "📷 Usage: .ss [URL]\nExample: .ss https://www.google.com"
                });
            }

            const url = params[0];
            
            // Basic URL validation
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Invalid URL. Please include http:// or https://"
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "📷 Taking screenshot... Please wait."
            });

            // Placeholder for screenshot functionality
            // Would need puppeteer or similar for actual implementation
            await sock.sendMessage(messageInfo.chatId, {
                text: "🚧 Screenshot feature is under development. Coming soon!"
            });

        } catch (error) {
            console.error('Screenshot error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to take screenshot."
            });
        }
    }

    async textToSpeech(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🔊 Usage: .tts [text]\nExample: .tts Hello, this is a test message"
                });
            }

            const text = params.join(' ');
            
            if (text.length > 200) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Text too long. Maximum 200 characters allowed."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🔊 Converting text to speech... Please wait."
            });

            // Placeholder for TTS functionality
            // Would need Google TTS API or similar
            await sock.sendMessage(messageInfo.chatId, {
                text: "🚧 Text-to-speech feature is under development. Coming soon!"
            });

        } catch (error) {
            console.error('TTS error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to convert text to speech."
            });
        }
    }

    async qrCode(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "📱 Usage: .qr [text]\nExample: .qr https://www.google.com"
                });
            }

            const text = params.join(' ');
            
            // Generate QR code using online service
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
            
            const response = await axios.get(qrUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            await sock.sendMessage(messageInfo.chatId, {
                image: buffer,
                caption: `📱 *QR Code Generated*\n\n📝 Content: ${text}\n🤖 Generated by ANONYMOUS X`
            });

        } catch (error) {
            console.error('QR Code error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to generate QR code."
            });
        }
    }

    async translate(messageInfo, sock, params) {
        try {
            if (params.length < 2) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🌐 Usage: .translate [target_language] [text]\nExample: .translate spanish Hello world"
                });
            }

            const targetLang = params[0];
            const text = params.slice(1).join(' ');

            // Placeholder for translation service
            await sock.sendMessage(messageInfo.chatId, {
                text: `🌐 *Translation*\n\n📝 Original: ${text}\n🔄 Target: ${targetLang}\n\n🚧 Translation service is under development. Coming soon!`
            });

        } catch (error) {
            console.error('Translation error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Translation failed."
            });
        }
    }

    async support(messageInfo, sock, params) {
        try {
            const supportInfo = `🆘 *ANONYMOUS X Support*\n\n` +
                               `💬 Need help? Here's how to get support:\n\n` +
                               `📝 Commands: Type .help for all commands\n` +
                               `🐛 Bug Reports: Contact bot owner\n` +
                               `💡 Feature Requests: Contact bot owner\n` +
                               `📚 Documentation: Type .help [category]\n\n` +
                               `🔧 Bot Information:\n` +
                               `• Version: 1.0.0\n` +
                               `• Platform: WhatsApp\n` +
                               `• Features: 100+ Commands\n\n` +
                               `💝 Thank you for using ANONYMOUS X!`;

            await sock.sendMessage(messageInfo.chatId, { text: supportInfo });

        } catch (error) {
            console.error('Support error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Support information unavailable."
            });
        }
    }

    async github(messageInfo, sock, params) {
        try {
            const githubInfo = `🐙 *GitHub Information*\n\n` +
                              `📦 Repository: ANONYMOUS X WhatsApp Bot\n` +
                              `👨‍💻 Developer: Anonymous Developer\n` +
                              `🌟 Features:\n` +
                              `• 100+ Commands\n` +
                              `• AI Integration (GPT-5)\n` +
                              `• Media Downloads\n` +
                              `• Games & Fun\n` +
                              `• Group Management\n` +
                              `• Economy System\n\n` +
                              `🔗 Source: Private Repository\n` +
                              `⭐ Star us if you like the bot!\n\n` +
                              `🤖 Built with love using Baileys`;

            await sock.sendMessage(messageInfo.chatId, { text: githubInfo });

        } catch (error) {
            console.error('GitHub error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ GitHub information unavailable."
            });
        }
    }

    async topMembers(messageInfo, sock, params) {
        try {
            if (!messageInfo.isGroup) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command can only be used in groups."
                });
            }

            const groupMetadata = await sock.groupMetadata(messageInfo.chatId);
            const participants = groupMetadata.participants;

            let topMembersText = `👑 *Top Members - ${groupMetadata.subject}*\n\n`;
            topMembersText += `📊 Total Members: ${participants.length}\n\n`;

            // Show admins first
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const regularMembers = participants.filter(p => !p.admin);

            if (admins.length > 0) {
                topMembersText += `👮 *Admins (${admins.length}):*\n`;
                admins.forEach((admin, index) => {
                    const number = admin.id.split('@')[0];
                    const role = admin.admin === 'superadmin' ? '👑 Owner' : '👮 Admin';
                    topMembersText += `${index + 1}. @${number} ${role}\n`;
                });
                topMembersText += '\n';
            }

            topMembersText += `👥 *Recent Members:*\n`;
            const recentMembers = regularMembers.slice(0, 10);
            recentMembers.forEach((member, index) => {
                const number = member.id.split('@')[0];
                topMembersText += `${index + 1}. @${number}\n`;
            });

            await sock.sendMessage(messageInfo.chatId, {
                text: topMembersText,
                mentions: [...admins.map(a => a.id), ...recentMembers.map(m => m.id)]
            });

        } catch (error) {
            console.error('Top members error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get group members list."
            });
        }
    }

    async getJid(messageInfo, sock, params) {
        try {
            let targetUser = null;
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            } else if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            } else {
                targetUser = messageInfo.sender;
            }

            const number = targetUser.split('@')[0];
            const jidInfo = `🆔 *JID Information*\n\n` +
                           `👤 User: @${number}\n` +
                           `🆔 JID: ${targetUser}\n` +
                           `📱 Number: +${number}\n` +
                           `💬 Chat: ${messageInfo.chatId}\n\n` +
                           `📋 Use this JID for technical purposes.`;

            await sock.sendMessage(messageInfo.chatId, {
                text: jidInfo,
                mentions: [targetUser]
            });

        } catch (error) {
            console.error('JID error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get JID information."
            });
        }
    }

    async tts(messageInfo, sock, params) {
        // Alias to existing textToSpeech method
        return this.textToSpeech(messageInfo, sock, params);
    }

    async attp(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎨 Usage: .attp [text]\nExample: .attp Hello World\nThis creates an animated text sticker."
                });
            }

            const text = params.join(' ');
            
            if (text.length > 20) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Text too long. Maximum 20 characters for animated stickers."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🎨 Creating animated text sticker..."
            });

            try {
                // Using online ATTP service
                const attpUrl = `https://api.xteam.xyz/attp?file&text=${encodeURIComponent(text)}`;
                const response = await axios.get(attpUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data);

                await sock.sendMessage(messageInfo.chatId, {
                    sticker: buffer
                });

            } catch (apiError) {
                // Fallback: create simple text sticker
                const textImage = `📝 *${text}* 📝`;
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `🎨 *Animated Text*\n\n${textImage}\n\n🚧 ATTP service temporarily unavailable. Showing text version.`
                });
            }

        } catch (error) {
            console.error('ATTP error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to create animated text sticker."
            });
        }
    }

    async emojiMix(messageInfo, sock, params) {
        try {
            if (params.length < 2) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎭 Usage: .emojimix [emoji1] [emoji2]\nExample: .emojimix 😀 😍\nThis mixes two emojis together!"
                });
            }

            const emoji1 = params[0];
            const emoji2 = params[1];

            await sock.sendMessage(messageInfo.chatId, {
                text: "🎭 Mixing emojis... Please wait."
            });

            try {
                // Using Google's emoji mixer API
                const mixUrl = `https://www.gstatic.com/android/keyboard/emojikitchen/20210831/u${emoji1.codePointAt(0).toString(16)}/u${emoji1.codePointAt(0).toString(16)}_u${emoji2.codePointAt(0).toString(16)}.png`;
                
                const response = await axios.get(mixUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data);

                await sock.sendMessage(messageInfo.chatId, {
                    sticker: buffer,
                    caption: `🎭 *Emoji Mix*\n\n${emoji1} + ${emoji2} = Mixed!\n🤖 Created by ANONYMOUS X`
                });

            } catch (apiError) {
                // Fallback
                await sock.sendMessage(messageInfo.chatId, {
                    text: `🎭 *Emoji Mix*\n\n${emoji1} + ${emoji2} = ${emoji1}${emoji2}\n\n💡 Mixed emojis! (Visual mixing coming soon)`
                });
            }

        } catch (error) {
            console.error('Emoji mix error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to mix emojis."
            });
        }
    }

    async blur(messageInfo, sock, params) {
        try {
            if (!messageInfo.quotedMsg || !messageInfo.quotedMsg.imageMessage) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🌫️ Usage: Reply to an image with .blur\nThis will add a blur effect to the image."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🌫️ Adding blur effect... Please wait."
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

            // Apply blur effect using Sharp
            const blurredBuffer = await sharp(buffer)
                .blur(10) // Blur radius
                .jpeg({ quality: 90 })
                .toBuffer();

            await sock.sendMessage(messageInfo.chatId, {
                image: blurredBuffer,
                caption: "🌫️ *Blur Effect Applied*\n🤖 Processed by ANONYMOUS X"
            });

        } catch (error) {
            console.error('Blur error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to apply blur effect."
            });
        }
    }

    async wasted(messageInfo, sock, params) {
        try {
            if (!messageInfo.quotedMsg || !messageInfo.quotedMsg.imageMessage) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "💀 Usage: Reply to an image with .wasted\nThis adds the 'WASTED' GTA effect to the image."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "💀 Adding WASTED effect... Please wait."
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

            // Apply wasted effect (grayscale + overlay text simulation)
            const wastedBuffer = await sharp(buffer)
                .greyscale()
                .modulate({
                    brightness: 0.3, // Darken
                    contrast: 1.5    // Increase contrast
                })
                .jpeg({ quality: 85 })
                .toBuffer();

            await sock.sendMessage(messageInfo.chatId, {
                image: wastedBuffer,
                caption: "💀 *WASTED*\n\n🎮 GTA Style Effect Applied\n🤖 Created by ANONYMOUS X"
            });

        } catch (error) {
            console.error('Wasted error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to apply wasted effect."
            });
        }
    }

    async character(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎭 Usage: .character [character name]\nExample: .character Naruto\nGet information about anime/fictional characters."
                });
            }

            const characterName = params.join(' ');

            await sock.sendMessage(messageInfo.chatId, {
                text: "🎭 Searching character database..."
            });

            // Character database (simplified)
            const characters = {
                'naruto': {
                    name: 'Naruto Uzumaki',
                    anime: 'Naruto',
                    description: 'Main protagonist, aspires to become Hokage',
                    abilities: 'Shadow Clone Jutsu, Rasengan, Nine-Tails Chakra',
                    personality: 'Energetic, determined, never gives up'
                },
                'goku': {
                    name: 'Son Goku',
                    anime: 'Dragon Ball',
                    description: 'Saiyan warrior protecting Earth',
                    abilities: 'Kamehameha, Ultra Instinct, Super Saiyan transformations',
                    personality: 'Pure-hearted, loves fighting, always hungry'
                },
                'luffy': {
                    name: 'Monkey D. Luffy',
                    anime: 'One Piece',
                    description: 'Captain of the Straw Hat Pirates',
                    abilities: 'Rubber powers (Gomu Gomu no Mi), Haki',
                    personality: 'Carefree, determined, loyal to friends'
                }
            };

            const character = characters[characterName.toLowerCase()];
            
            if (character) {
                const characterInfo = `🎭 *Character Profile*\n\n` +
                                    `👤 Name: ${character.name}\n` +
                                    `📺 Anime: ${character.anime}\n` +
                                    `📝 Description: ${character.description}\n` +
                                    `⚡ Abilities: ${character.abilities}\n` +
                                    `🎯 Personality: ${character.personality}\n\n` +
                                    `🤖 From ANONYMOUS X Character Database`;

                await sock.sendMessage(messageInfo.chatId, { text: characterInfo });
            } else {
                await sock.sendMessage(messageInfo.chatId, {
                    text: `🎭 *Character Search*\n\n❌ Character "${characterName}" not found in database.\n\n💡 Try popular characters like:\n• Naruto\n• Goku\n• Luffy\n\n🚧 More characters coming soon!`
                });
            }

        } catch (error) {
            console.error('Character error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to search character database."
            });
        }
    }

    async onBot(messageInfo, sock, params) {
        try {
            await sock.sendMessage(messageInfo.chatId, {
                text: `🤖 *ANONYMOUS X Bot Status*\n\n✅ Bot is ONLINE and fully operational!\n\n📊 Status Information:\n• Commands: 100+ Available\n• Response Time: Fast\n• Services: All Active\n• Mode: Public\n\n🚀 Ready to serve you!`
            });
        } catch (error) {
            console.error('OnBot error:', error);
        }
    }

    async offBot(messageInfo, sock, params) {
        try {
            await sock.sendMessage(messageInfo.chatId, {
                text: `🤖 *Bot Status Update*\n\n⚠️ This command simulates offline mode.\nIn reality, the bot remains online to process this message!\n\n💡 Note: Only bot owner can actually shut down the bot.`
            });
        } catch (error) {
            console.error('OffBot error:', error);
        }
    }

    async say(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "💬 Usage: .say [message]\nExample: .say Hello everyone!\nThe bot will repeat your message."
                });
            }

            const message = params.join(' ');
            
            if (message.length > 500) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Message too long. Maximum 500 characters allowed."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: `🤖 *ANONYMOUS X Says:*\n\n"${message}"`
            });

        } catch (error) {
            console.error('Say error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to send message."
            });
        }
    }

    async dictionary(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "📚 Usage: .dictionary [word]\nExample: .dictionary awesome\nGet the definition of any word."
                });
            }

            const word = params[0].toLowerCase();

            // Simple dictionary database
            const dictionary = {
                'awesome': 'Extremely impressive or daunting; inspiring awe.',
                'beautiful': 'Pleasing the senses or mind aesthetically.',
                'computer': 'An electronic device for storing and processing data.',
                'dictionary': 'A book or electronic resource that lists words with their meanings.',
                'excellent': 'Extremely good; outstanding.',
                'fantastic': 'Extraordinarily good or attractive.',
                'genius': 'Exceptional intellectual or creative power or natural ability.',
                'happy': 'Feeling or showing pleasure or contentment.',
                'intelligent': 'Having or showing intelligence, especially of a high level.',
                'joy': 'A feeling of great pleasure and happiness.',
                'knowledge': 'Facts, information, and skills acquired through experience or education.',
                'love': 'An intense feeling of deep affection.',
                'magnificent': 'Impressively beautiful, elaborate, or extravagant.',
                'nature': 'The physical world collectively, including plants, animals, and landscape.',
                'outstanding': 'Clearly noticeable; exceptionally good.',
                'perfect': 'Having all required or desirable elements or qualities.',
                'quality': 'The standard of something as measured against other things.',
                'remarkable': 'Worthy of attention; striking.',
                'success': 'The accomplishment of an aim or purpose.',
                'technology': 'The application of scientific knowledge for practical purposes.',
                'unique': 'Being the only one of its kind; unlike anything else.',
                'victory': 'An act of defeating an enemy or opponent.',
                'wonderful': 'Inspiring delight, pleasure, or admiration.',
                'excellence': 'The quality of being outstanding or extremely good.',
                'youth': 'The period between childhood and adult age.',
                'zenith': 'The highest point reached by a celestial or other object.'
            };

            const definition = dictionary[word];
            
            if (definition) {
                await sock.sendMessage(messageInfo.chatId, {
                    text: `📚 *Dictionary*\n\n📖 Word: **${word.charAt(0).toUpperCase() + word.slice(1)}**\n\n📝 Definition:\n"${definition}"\n\n🤖 Powered by ANONYMOUS X Dictionary`
                });
            } else {
                await sock.sendMessage(messageInfo.chatId, {
                    text: `📚 *Dictionary*\n\n❌ Word "${word}" not found in dictionary.\n\n💡 Try common words like: awesome, beautiful, computer, excellent, etc.\n\n🚧 Full dictionary coming soon!`
                });
            }

        } catch (error) {
            console.error('Dictionary error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Dictionary lookup failed."
            });
        }
    }

    async userInfo(messageInfo, sock, params) {
        try {
            let targetUser = messageInfo.sender;
            
            if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            } else if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            }

            const userNumber = targetUser.split('@')[0];
            const isGroup = messageInfo.isGroup;

            let userInfoText = `👤 *User Information*\n\n`;
            userInfoText += `📱 Number: @${userNumber}\n`;
            userInfoText += `🆔 JID: ${targetUser}\n`;
            userInfoText += `💬 Chat Type: ${isGroup ? 'Group' : 'Private'}\n`;
            
            if (isGroup) {
                try {
                    const groupMetadata = await sock.groupMetadata(messageInfo.chatId);
                    const participant = groupMetadata.participants.find(p => p.id === targetUser);
                    if (participant) {
                        const role = participant.admin === 'superadmin' ? '👑 Owner' : 
                                    participant.admin === 'admin' ? '👮 Admin' : '👤 Member';
                        userInfoText += `👥 Group Role: ${role}\n`;
                    }
                } catch (e) {
                    userInfoText += `👥 Group Role: Member\n`;
                }
            }

            userInfoText += `📅 Query Time: ${new Date().toLocaleString()}\n`;
            userInfoText += `🤖 Requested by: @${messageInfo.sender.split('@')[0]}`;

            await sock.sendMessage(messageInfo.chatId, {
                text: userInfoText,
                mentions: [targetUser, messageInfo.sender]
            });

        } catch (error) {
            console.error('User info error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get user information."
            });
        }
    }

    async serverInfo(messageInfo, sock, params) {
        try {
            if (!messageInfo.isGroup) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This command can only be used in groups."
                });
            }

            const groupMetadata = await sock.groupMetadata(messageInfo.chatId);
            
            const serverInfoText = `🏢 *Group Information*\n\n` +
                                   `📋 Name: ${groupMetadata.subject}\n` +
                                   `🆔 ID: ${groupMetadata.id}\n` +
                                   `👥 Members: ${groupMetadata.participants.length}\n` +
                                   `👮 Admins: ${groupMetadata.participants.filter(p => p.admin).length}\n` +
                                   `📅 Created: ${new Date(groupMetadata.creation * 1000).toLocaleDateString()}\n` +
                                   `📝 Description: ${groupMetadata.desc || 'No description'}\n` +
                                   `🔒 Only Admins can edit: ${groupMetadata.restrict ? 'Yes' : 'No'}\n` +
                                   `📢 Only Admins can send: ${groupMetadata.announce ? 'Yes' : 'No'}\n\n` +
                                   `🤖 Generated by ANONYMOUS X`;

            await sock.sendMessage(messageInfo.chatId, {
                text: serverInfoText
            });

        } catch (error) {
            console.error('Server info error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get group information."
            });
        }
    }

    async currency(messageInfo, sock, params) {
        try {
            if (params.length < 3) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "💱 Usage: .currency [amount] [from] [to]\nExample: .currency 100 USD EUR\nConvert between currencies."
                });
            }

            const amount = parseFloat(params[0]);
            const fromCurrency = params[1].toUpperCase();
            const toCurrency = params[2].toUpperCase();

            if (isNaN(amount)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Please enter a valid amount."
                });
            }

            // Simple currency rates (in a real bot, you'd use a live API)
            const rates = {
                'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110, 'INR': 74, 'CAD': 1.25 },
                'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 129, 'INR': 87, 'CAD': 1.47 },
                'GBP': { 'USD': 1.37, 'EUR': 1.16, 'JPY': 150, 'INR': 101, 'CAD': 1.71 },
                'JPY': { 'USD': 0.009, 'EUR': 0.0078, 'GBP': 0.0067, 'INR': 0.67, 'CAD': 0.011 },
                'INR': { 'USD': 0.013, 'EUR': 0.011, 'GBP': 0.0099, 'JPY': 1.49, 'CAD': 0.017 },
                'CAD': { 'USD': 0.80, 'EUR': 0.68, 'GBP': 0.58, 'JPY': 88, 'INR': 59 }
            };

            if (fromCurrency === toCurrency) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `💱 *Currency Converter*\n\n${amount} ${fromCurrency} = ${amount} ${toCurrency}\n\n💡 Same currency conversion!`
                });
            }

            if (!rates[fromCurrency] || !rates[fromCurrency][toCurrency]) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `💱 *Currency Converter*\n\n❌ Conversion not available for ${fromCurrency} to ${toCurrency}\n\n💡 Supported: USD, EUR, GBP, JPY, INR, CAD`
                });
            }

            const convertedAmount = (amount * rates[fromCurrency][toCurrency]).toFixed(2);

            await sock.sendMessage(messageInfo.chatId, {
                text: `💱 *Currency Converter*\n\n💰 ${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}\n\n📊 Exchange Rate: 1 ${fromCurrency} = ${rates[fromCurrency][toCurrency]} ${toCurrency}\n📅 Updated: ${new Date().toLocaleDateString()}\n\n⚠️ Rates are approximate`
            });

        } catch (error) {
            console.error('Currency error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Currency conversion failed."
            });
        }
    }

    async time(messageInfo, sock, params) {
        try {
            const now = new Date();
            
            const timeInfo = `🕐 *Current Time*\n\n` +
                            `📅 Date: ${now.toLocaleDateString()}\n` +
                            `⏰ Time: ${now.toLocaleTimeString()}\n` +
                            `🌍 Timezone: ${now.toTimeString().split(' ')[1]}\n` +
                            `📊 Timestamp: ${now.getTime()}\n` +
                            `📆 Day: ${now.toLocaleDateString('en-US', { weekday: 'long' })}\n` +
                            `📈 Year: ${now.getFullYear()}\n\n` +
                            `🤖 Generated by ANONYMOUS X`;

            await sock.sendMessage(messageInfo.chatId, { text: timeInfo });

        } catch (error) {
            console.error('Time error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get time information."
            });
        }
    }

    async date(messageInfo, sock, params) {
        try {
            const now = new Date();
            
            const dateInfo = `📅 *Date Information*\n\n` +
                            `📆 Today: ${now.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}\n` +
                            `📊 Format: ${now.toLocaleDateString()}\n` +
                            `🌍 ISO Format: ${now.toISOString().split('T')[0]}\n` +
                            `📈 Day of Year: ${Math.ceil((now - new Date(now.getFullYear(), 0, 0)) / 86400000)}\n` +
                            `📉 Days in Month: ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}\n` +
                            `🔢 Week Number: ${Math.ceil(((now - new Date(now.getFullYear(), 0, 1)) / 86400000 + 1) / 7)}\n\n` +
                            `🤖 Generated by ANONYMOUS X`;

            await sock.sendMessage(messageInfo.chatId, { text: dateInfo });

        } catch (error) {
            console.error('Date error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get date information."
            });
        }
    }

    async ping(messageInfo, sock, params) {
        try {
            const startTime = Date.now();
            
            const pingMsg = await sock.sendMessage(messageInfo.chatId, {
                text: "🏓 Pinging..."
            });
            
            const endTime = Date.now();
            const latency = endTime - startTime;

            await sock.sendMessage(messageInfo.chatId, {
                text: `🏓 *Ping Results*\n\n⚡ Response Time: ${latency}ms\n📡 Status: Online\n🔄 Bot Performance: ${latency < 100 ? 'Excellent' : latency < 300 ? 'Good' : 'Average'}\n\n✅ ANONYMOUS X is responsive!`
            });

        } catch (error) {
            console.error('Ping error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Ping test failed."
            });
        }
    }
}

module.exports = UtilsService;
