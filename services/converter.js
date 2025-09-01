const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

class ConverterService {
    constructor() {
        // Initialize converter service
    }

    async stickerPack(messageInfo, sock, params) {
        try {
            if (!messageInfo.quotedMsg || !messageInfo.quotedMsg.imageMessage) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎨 Usage: Reply to an image with .take [pack name] [author]\nExample: .take MyPack Anonymous"
                });
            }

            const packName = params[0] || 'Custom Pack';
            const author = params[1] || 'ANONYMOUS X';

            await sock.sendMessage(messageInfo.chatId, {
                text: "🎨 Creating sticker pack... Please wait."
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

            // Process image to sticker format with metadata
            const stickerBuffer = await sharp(buffer)
                .resize(512, 512, { 
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp()
                .toBuffer();

            // Send as sticker with pack info
            await sock.sendMessage(messageInfo.chatId, {
                sticker: stickerBuffer,
                packname: packName,
                author: author
            });

        } catch (error) {
            console.error('Sticker pack creation error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to create sticker pack."
            });
        }
    }

    async toImage(messageInfo, sock, params) {
        try {
            if (!messageInfo.quotedMsg || !messageInfo.quotedMsg.stickerMessage) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🖼️ Usage: Reply to a sticker with .toimg\nThis will convert the sticker to an image."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🖼️ Converting sticker to image..."
            });

            // Download the sticker
            const stickerMessage = messageInfo.quotedMsg.stickerMessage;
            const buffer = await sock.downloadMediaMessage({
                key: messageInfo.quotedMsg.key,
                message: { stickerMessage }
            });

            if (!buffer) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Failed to download sticker."
                });
            }

            // Convert to PNG
            const imageBuffer = await sharp(buffer)
                .png()
                .toBuffer();

            await sock.sendMessage(messageInfo.chatId, {
                image: imageBuffer,
                caption: "🖼️ *Sticker converted to image*\n🤖 Converted by ANONYMOUS X"
            });

        } catch (error) {
            console.error('Sticker to image error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to convert sticker to image."
            });
        }
    }

    async toVideo(messageInfo, sock, params) {
        try {
            if (!messageInfo.quotedMsg || !messageInfo.quotedMsg.gifMessage) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎬 Usage: Reply to a GIF with .tovid\nThis will convert the GIF to a video."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🎬 Converting GIF to video..."
            });

            // Download the GIF
            const gifMessage = messageInfo.quotedMsg.gifMessage;
            const buffer = await sock.downloadMediaMessage({
                key: messageInfo.quotedMsg.key,
                message: { gifMessage }
            });

            if (!buffer) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Failed to download GIF."
                });
            }

            // Save temporary files
            const gifPath = path.join('./temp', `gif_${Date.now()}.gif`);
            const videoPath = path.join('./temp', `video_${Date.now()}.mp4`);

            await fs.writeFile(gifPath, buffer);

            // Convert using ffmpeg (if available)
            exec(`ffmpeg -i "${gifPath}" -movflags +faststart -pix_fmt yuv420p "${videoPath}"`, async (error, stdout, stderr) => {
                try {
                    if (error) {
                        await sock.sendMessage(messageInfo.chatId, {
                            text: "❌ Video conversion failed. FFmpeg not available."
                        });
                    } else {
                        const videoBuffer = await fs.readFile(videoPath);
                        
                        await sock.sendMessage(messageInfo.chatId, {
                            video: videoBuffer,
                            caption: "🎬 *GIF converted to video*\n🤖 Converted by ANONYMOUS X"
                        });
                    }

                    // Cleanup
                    await fs.unlink(gifPath).catch(() => {});
                    await fs.unlink(videoPath).catch(() => {});
                } catch (conversionError) {
                    console.error('Video conversion error:', conversionError);
                    await sock.sendMessage(messageInfo.chatId, {
                        text: "❌ Failed to convert GIF to video."
                    });
                }
            });

        } catch (error) {
            console.error('GIF to video error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to convert GIF to video."
            });
        }
    }

    async viewOnce(messageInfo, sock, params) {
        try {
            if (!messageInfo.quotedMsg || !messageInfo.quotedMsg.viewOnceMessage) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "👁️ Usage: Reply to a view once message with .vv or .viewonce\nThis will reveal the view once content."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "👁️ Revealing view once content..."
            });

            const viewOnceMsg = messageInfo.quotedMsg.viewOnceMessage.message;
            
            if (viewOnceMsg.imageMessage) {
                const buffer = await sock.downloadMediaMessage({
                    key: messageInfo.quotedMsg.key,
                    message: { imageMessage: viewOnceMsg.imageMessage }
                });

                await sock.sendMessage(messageInfo.chatId, {
                    image: buffer,
                    caption: "👁️ *View Once Image Revealed*\n🤖 Revealed by ANONYMOUS X"
                });
            } else if (viewOnceMsg.videoMessage) {
                const buffer = await sock.downloadMediaMessage({
                    key: messageInfo.quotedMsg.key,
                    message: { videoMessage: viewOnceMsg.videoMessage }
                });

                await sock.sendMessage(messageInfo.chatId, {
                    video: buffer,
                    caption: "👁️ *View Once Video Revealed*\n🤖 Revealed by ANONYMOUS X"
                });
            } else {
                await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ This view once message type is not supported."
                });
            }

        } catch (error) {
            console.error('View once error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to reveal view once content."
            });
        }
    }
}

module.exports = ConverterService;