const axios = require('axios');

class TextMakerService {
    constructor() {
        this.textApiBase = 'https://api.textpro.me';
    }

    async createStyledText(messageInfo, sock, params, style) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `✨ Usage: .${style} [text]\nExample: .${style} Hello World`
                });
            }

            const text = params.join(' ');
            
            if (text.length > 100) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Text too long. Maximum 100 characters allowed."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: `✨ Creating ${style} text... Please wait.`
            });

            try {
                // Try to generate styled text using text effects API
                const styleUrls = {
                    metallic: `https://textpro.me/create-metallic-text-glow-online-188.html`,
                    ice: `https://textpro.me/ice-cold-text-effect-862.html`,
                    snow: `https://textpro.me/create-snow-text-effect-online-1002.html`,
                    matrix: `https://textpro.me/matrix-style-text-effect-online-884.html`,
                    neon: `https://textpro.me/neon-text-effect-online-879.html`,
                    fire: `https://textpro.me/realistic-flaming-text-effect-online-226.html`,
                    thunder: `https://textpro.me/create-thunder-text-effect-online-881.html`,
                    hacker: `https://textpro.me/create-hacker-text-effect-blue-green-787.html`,
                    glitch: `https://textpro.me/create-impressive-glitch-text-effects-online-1027.html`,
                    blackpink: `https://textpro.me/create-blackpink-logo-style-online-1001.html`
                };

                // Generate ASCII art style text as fallback
                const styledTexts = {
                    metallic: this.generateMetallicText(text),
                    ice: this.generateIceText(text),
                    snow: this.generateSnowText(text),
                    matrix: this.generateMatrixText(text),
                    neon: this.generateNeonText(text),
                    fire: this.generateFireText(text),
                    thunder: this.generateThunderText(text),
                    hacker: this.generateHackerText(text),
                    glitch: this.generateGlitchText(text),
                    blackpink: this.generateBlackpinkText(text)
                };

                const styledText = styledTexts[style] || text;
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `✨ *${style.toUpperCase()} TEXT*\n\n\`\`\`${styledText}\`\`\`\n\n🤖 Created by ANONYMOUS X\n🔗 For better quality: ${styleUrls[style] || 'https://textpro.me'}`
                });

            } catch (apiError) {
                // Fallback ASCII text
                const simpleStyled = this.generateSimpleStyled(text, style);
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `✨ *${style.toUpperCase()} TEXT*\n\n\`\`\`${simpleStyled}\`\`\`\n\n🤖 Created by ANONYMOUS X`
                });
            }

        } catch (error) {
            console.error(`${style} text error:`, error);
            await sock.sendMessage(messageInfo.chatId, {
                text: `❌ Failed to create ${style} text effect.`
            });
        }
    }

    // Text style generators
    generateMetallicText(text) {
        return text.split('').map(char => {
            if (char === ' ') return '   ';
            return `╔═╗\n║${char}║\n╚═╝`;
        }).join('\n\n');
    }

    generateIceText(text) {
        return `❄️ ${text.toUpperCase().split('').join(' ❄️ ')} ❄️`;
    }

    generateSnowText(text) {
        return `☃️ ${text.toUpperCase().split('').join(' ❄️ ')} ☃️`;
    }

    generateMatrixText(text) {
        const matrixChars = '01';
        let matrix = '';
        for (let i = 0; i < 3; i++) {
            matrix += Array(text.length * 2).fill().map(() => 
                matrixChars[Math.floor(Math.random() * matrixChars.length)]
            ).join('') + '\n';
        }
        matrix += `>>> ${text.toUpperCase()} <<<\n`;
        for (let i = 0; i < 2; i++) {
            matrix += Array(text.length * 2).fill().map(() => 
                matrixChars[Math.floor(Math.random() * matrixChars.length)]
            ).join('') + '\n';
        }
        return matrix;
    }

    generateNeonText(text) {
        return `✨${text.toUpperCase().split('').join('✨')}✨`;
    }

    generateFireText(text) {
        return `🔥 ${text.toUpperCase().split('').join(' 🔥 ')} 🔥`;
    }

    generateThunderText(text) {
        return `⚡ ${text.toUpperCase().split('').join(' ⚡ ')} ⚡`;
    }

    generateHackerText(text) {
        return `[HACKING...]\n> ${text.toLowerCase()}_\n[ACCESS GRANTED]`;
    }

    generateGlitchText(text) {
        const glitched = text.split('').map(char => {
            if (Math.random() < 0.3) {
                return String.fromCharCode(char.charCodeAt(0) + Math.floor(Math.random() * 10) - 5);
            }
            return char;
        }).join('');
        return `g̴l̷i̶t̴c̷h̶e̵d̴: ${glitched}`;
    }

    generateBlackpinkText(text) {
        return `💖 B L A C K P I N K 💖\n✨ ${text.toUpperCase()} ✨\n💖 IN YOUR AREA 💖`;
    }

    generateSimpleStyled(text, style) {
        const styles = {
            metallic: `【${text}】`,
            ice: `❄️${text}❄️`,
            snow: `☃️${text}☃️`,
            matrix: `[${text}]`,
            neon: `✨${text}✨`,
            fire: `🔥${text}🔥`,
            thunder: `⚡${text}⚡`,
            hacker: `>${text}_`,
            glitch: `g̴${text}`,
            blackpink: `💖${text}💖`
        };
        return styles[style] || text;
    }

    // Individual text style methods
    async metallic(messageInfo, sock, params) { 
        return this.createStyledText(messageInfo, sock, params, 'metallic'); 
    }
    async ice(messageInfo, sock, params) { 
        return this.createStyledText(messageInfo, sock, params, 'ice'); 
    }
    async snow(messageInfo, sock, params) { 
        return this.createStyledText(messageInfo, sock, params, 'snow'); 
    }
    async matrix(messageInfo, sock, params) { 
        return this.createStyledText(messageInfo, sock, params, 'matrix'); 
    }
    async neon(messageInfo, sock, params) { 
        return this.createStyledText(messageInfo, sock, params, 'neon'); 
    }
    async fire(messageInfo, sock, params) { 
        return this.createStyledText(messageInfo, sock, params, 'fire'); 
    }
    async thunder(messageInfo, sock, params) { 
        return this.createStyledText(messageInfo, sock, params, 'thunder'); 
    }
    async hacker(messageInfo, sock, params) { 
        return this.createStyledText(messageInfo, sock, params, 'hacker'); 
    }
    async glitch(messageInfo, sock, params) { 
        return this.createStyledText(messageInfo, sock, params, 'glitch'); 
    }
    async blackpink(messageInfo, sock, params) { 
        return this.createStyledText(messageInfo, sock, params, 'blackpink'); 
    }
}

module.exports = TextMakerService;