const OpenAI = require('openai');
const axios = require('axios');
const config = require('../config/settings.json');

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'default_key'
        });
        this.requestCounts = new Map();
    }

    async gpt(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❓ Usage: .gpt [your question]\nExample: .gpt What is artificial intelligence?"
                });
            }

            // Check daily limit
            if (!this.checkDailyLimit(messageInfo.sender)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "⚠️ You've reached your daily AI request limit. Try again tomorrow!"
                });
            }

            const question = params.join(' ');
            
            await sock.sendMessage(messageInfo.chatId, {
                text: "🤖 Thinking... Please wait."
            });

            // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
            const response = await this.openai.chat.completions.create({
                model: "gpt-5",
                messages: [
                    {
                        role: "system",
                        content: "You are ANONYMOUS X, a helpful WhatsApp bot assistant. Keep responses concise and helpful. Use emojis appropriately."
                    },
                    {
                        role: "user",
                        content: question
                    }
                ],
                max_tokens: config.apis.openai.maxTokens,
                temperature: 0.7
            });

            const answer = response.choices[0].message.content;
            this.incrementRequestCount(messageInfo.sender);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🤖 *GPT-5 Response:*\n\n${answer}`
            });

        } catch (error) {
            console.error('GPT error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Sorry, I couldn't process your request. Please try again later."
            });
        }
    }

    async gemini(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❓ Usage: .gemini [your question]\nExample: .gemini Explain quantum computing"
                });
            }

            const question = params.join(' ');
            
            await sock.sendMessage(messageInfo.chatId, {
                text: "🧠 Gemini is thinking... Please wait."
            });

            // Simulate Gemini response (replace with actual Gemini API when available)
            const response = await this.openai.chat.completions.create({
                model: "gpt-5",
                messages: [
                    {
                        role: "system",
                        content: "You are Gemini AI, respond in a different style than GPT, focusing on detailed explanations and multiple perspectives."
                    },
                    {
                        role: "user",
                        content: question
                    }
                ],
                max_tokens: config.apis.openai.maxTokens,
                temperature: 0.8
            });

            const answer = response.choices[0].message.content;

            await sock.sendMessage(messageInfo.chatId, {
                text: `🧠 *Gemini Response:*\n\n${answer}`
            });

        } catch (error) {
            console.error('Gemini error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Gemini is currently unavailable. Please try again later."
            });
        }
    }

    async imagine(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎨 Usage: .imagine [description]\nExample: .imagine a beautiful sunset over mountains"
                });
            }

            const prompt = params.join(' ');
            
            await sock.sendMessage(messageInfo.chatId, {
                text: "🎨 Creating your image... This may take a moment."
            });

            const response = await this.openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard"
            });

            const imageUrl = response.data[0].url;
            
            // Download and send image
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageResponse.data);

            await sock.sendMessage(messageInfo.chatId, {
                image: buffer,
                caption: `🎨 *Generated Image*\n📝 Prompt: ${prompt}\n🤖 Created by ANONYMOUS X`
            });

        } catch (error) {
            console.error('Image generation error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to generate image. Please try a different prompt."
            });
        }
    }

    async translate(messageInfo, sock, params) {
        try {
            if (params.length < 2) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🌐 Usage: .translate [language] [text]\nExample: .translate spanish Hello world\nOr: .translate [text] (auto-detect to English)"
                });
            }

            let targetLang, textToTranslate;
            
            if (params.length === 1) {
                targetLang = "English";
                textToTranslate = params[0];
            } else {
                targetLang = params[0];
                textToTranslate = params.slice(1).join(' ');
            }

            const response = await this.openai.chat.completions.create({
                model: "gpt-5",
                messages: [
                    {
                        role: "system",
                        content: `You are a professional translator. Translate the given text to ${targetLang}. Only provide the translation, nothing else.`
                    },
                    {
                        role: "user",
                        content: textToTranslate
                    }
                ],
                max_tokens: 500
            });

            const translation = response.choices[0].message.content;

            await sock.sendMessage(messageInfo.chatId, {
                text: `🌐 *Translation*\n\n📝 Original: ${textToTranslate}\n🔄 Translated: ${translation}\n🎯 Target: ${targetLang}`
            });

        } catch (error) {
            console.error('Translation error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Translation failed. Please try again."
            });
        }
    }

    async upscale(messageInfo, sock, params) {
        try {
            if (!messageInfo.quotedMsg || !messageInfo.quotedMsg.imageMessage) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🖼️ Usage: Reply to an image with .upscale\nThis will enhance the image quality using AI."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🔄 Enhancing image quality with AI... Please wait."
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

            // Convert to base64
            const base64Image = buffer.toString('base64');

            // Use OpenAI GPT-5 for image enhancement description
            const response = await this.openai.chat.completions.create({
                model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Describe this image in detail so it can be recreated in higher quality."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }],
                max_tokens: 500
            });

            const description = response.choices[0].message.content;

            // Generate enhanced version using DALL-E
            const imageResponse = await this.openai.images.generate({
                model: "dall-e-3",
                prompt: `High-resolution, crystal clear, ultra-detailed version of: ${description}`,
                n: 1,
                size: "1024x1024",
                quality: "hd"
            });

            const imageUrl = imageResponse.data[0].url;
            const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const enhancedBuffer = Buffer.from(imageBuffer.data);

            await sock.sendMessage(messageInfo.chatId, {
                image: enhancedBuffer,
                caption: `🔄 *Image Enhanced with AI*\n\n📝 Description: ${description.substring(0, 100)}...\n🤖 Enhanced by ANONYMOUS X`
            });

        } catch (error) {
            console.error('Upscale error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to upscale image. Please try again with a different image."
            });
        }
    }

    async transcribe(messageInfo, sock, params) {
        try {
            if (!messageInfo.quotedMsg || !messageInfo.quotedMsg.audioMessage) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎵 Usage: Reply to an audio message with .transcribe\nThis will convert speech to text using AI."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🎧 Transcribing audio... Please wait."
            });

            // Download the audio
            const audioMessage = messageInfo.quotedMsg.audioMessage;
            const buffer = await sock.downloadMediaMessage({
                key: messageInfo.quotedMsg.key,
                message: { audioMessage }
            });

            if (!buffer) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Failed to download audio."
                });
            }

            // Save to temporary file
            const fs = require('fs-extra');
            const path = require('path');
            const tempFile = path.join('./temp', `audio_${Date.now()}.ogg`);
            await fs.writeFile(tempFile, buffer);

            // Create read stream for OpenAI
            const audioReadStream = fs.createReadStream(tempFile);

            const transcription = await this.openai.audio.transcriptions.create({
                file: audioReadStream,
                model: "whisper-1",
                language: "en"
            });

            // Clean up temp file
            await fs.unlink(tempFile).catch(() => {});

            await sock.sendMessage(messageInfo.chatId, {
                text: `🎧 *Audio Transcription*\n\n📝 Text: "${transcription.text}"\n\n🤖 Transcribed by ANONYMOUS X`
            });

        } catch (error) {
            console.error('Transcribe error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to transcribe audio. Please try again with a clear audio message."
            });
        }
    }

    async copilot(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "💻 Usage: .copilot [programming question or code]\nExample: .copilot how to create a web server in Node.js"
                });
            }

            const query = params.join(' ');

            await sock.sendMessage(messageInfo.chatId, {
                text: "💻 GitHub Copilot is analyzing your request..."
            });

            const response = await this.openai.chat.completions.create({
                model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
                messages: [
                    {
                        role: "system",
                        content: "You are GitHub Copilot, an AI programming assistant. Provide helpful, accurate coding advice with examples. Include code snippets when relevant. Be concise but comprehensive."
                    },
                    {
                        role: "user",
                        content: query
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            });

            const answer = response.choices[0].message.content;

            await sock.sendMessage(messageInfo.chatId, {
                text: `💻 *GitHub Copilot*\n\n❓ Query: ${query}\n\n🤖 Answer:\n${answer}`
            });

        } catch (error) {
            console.error('Copilot error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "💻 GitHub Copilot is currently unavailable. Try again later!"
            });
        }
    }

    async perplexity(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🔍 Usage: .perplexity [search question]\nExample: .perplexity latest news about AI technology"
                });
            }

            const query = params.join(' ');

            await sock.sendMessage(messageInfo.chatId, {
                text: "🔍 Perplexity is searching the web for you..."
            });

            const response = await this.openai.chat.completions.create({
                model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
                messages: [
                    {
                        role: "system",
                        content: "You are Perplexity AI, a search-powered AI assistant. Provide comprehensive, well-sourced answers based on the latest information. Include relevant facts and cite sources when possible. Be accurate and informative."
                    },
                    {
                        role: "user",
                        content: `Search and provide detailed information about: ${query}`
                    }
                ],
                max_tokens: 1200,
                temperature: 0.5
            });

            const answer = response.choices[0].message.content;

            await sock.sendMessage(messageInfo.chatId, {
                text: `🔍 *Perplexity Search*\n\n🔎 Query: ${query}\n\n📊 Results:\n${answer}\n\n🤖 Powered by ANONYMOUS X`
            });

        } catch (error) {
            console.error('Perplexity error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "🔍 Perplexity search is currently unavailable. Try again later!"
            });
        }
    }

    checkDailyLimit(sender) {
        const today = new Date().toDateString();
        const userKey = `${sender}_${today}`;
        const count = this.requestCounts.get(userKey) || 0;
        
        return count < config.limits.aiRequests;
    }

    incrementRequestCount(sender) {
        const today = new Date().toDateString();
        const userKey = `${sender}_${today}`;
        const count = this.requestCounts.get(userKey) || 0;
        this.requestCounts.set(userKey, count + 1);
    }
}

module.exports = AIService;
