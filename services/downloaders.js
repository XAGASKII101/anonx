const ytdl = require('ytdl-core');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const config = require('../config/settings.json');

class DownloaderService {
    constructor() {
        this.downloadQueue = new Map();
        this.activeDownloads = 0;
    }

    async youtube(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "📺 Usage: .youtube [URL]\nExample: .youtube https://youtu.be/dQw4w9WgXcQ"
                });
            }

            const url = params[0];
            
            if (!ytdl.validateURL(url)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Invalid YouTube URL. Please provide a valid YouTube link."
                });
            }

            if (this.activeDownloads >= config.maxConcurrentDownloads) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "⏳ Too many active downloads. Please try again later."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "📥 Downloading YouTube video... Please wait."
            });

            this.activeDownloads++;

            try {
                const info = await ytdl.getInfo(url);
                const title = info.videoDetails.title;
                const duration = info.videoDetails.lengthSeconds;

                // Check duration limit (max 10 minutes)
                if (duration > 600) {
                    return await sock.sendMessage(messageInfo.chatId, {
                        text: "❌ Video is too long. Maximum duration is 10 minutes."
                    });
                }

                const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
                const fileName = `${Date.now()}.mp4`;
                const filePath = path.join('./temp', fileName);

                // Download video
                const stream = ytdl(url, { format });
                const writeStream = fs.createWriteStream(filePath);
                
                stream.pipe(writeStream);

                writeStream.on('finish', async () => {
                    try {
                        const stats = await fs.stat(filePath);
                        const fileSizeMB = stats.size / (1024 * 1024);

                        if (fileSizeMB > config.maxFileSize) {
                            await fs.unlink(filePath);
                            return await sock.sendMessage(messageInfo.chatId, {
                                text: `❌ File too large (${fileSizeMB.toFixed(1)}MB). Maximum size is ${config.maxFileSize}MB.`
                            });
                        }

                        await sock.sendMessage(messageInfo.chatId, {
                            video: fs.readFileSync(filePath),
                            caption: `📺 *${title}*\n⏱️ Duration: ${this.formatDuration(duration)}\n🤖 Downloaded by ANONYMOUS X`,
                            mimetype: 'video/mp4'
                        });

                        // Clean up
                        await fs.unlink(filePath);
                    } catch (error) {
                        console.error('YouTube download finish error:', error);
                        await sock.sendMessage(messageInfo.chatId, {
                            text: "❌ Failed to process downloaded video."
                        });
                    } finally {
                        this.activeDownloads--;
                    }
                });

            } catch (error) {
                this.activeDownloads--;
                throw error;
            }

        } catch (error) {
            console.error('YouTube download error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to download YouTube video. Please check the URL and try again."
            });
        }
    }

    async instagram(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "📸 Usage: .instagram [URL]\nExample: .instagram https://www.instagram.com/p/ABC123/"
                });
            }

            const url = params[0];

            await sock.sendMessage(messageInfo.chatId, {
                text: "📸 Downloading Instagram media... Please wait."
            });

            // Simplified Instagram download (would need proper API implementation)
            await sock.sendMessage(messageInfo.chatId, {
                text: "🚧 Instagram downloader is under development. Coming soon!"
            });

        } catch (error) {
            console.error('Instagram download error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to download Instagram media."
            });
        }
    }

    async tiktok(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎵 Usage: .tiktok [URL]\nExample: .tiktok https://www.tiktok.com/@user/video/123"
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🎵 Downloading TikTok video... Please wait."
            });

            // Placeholder for TikTok download
            await sock.sendMessage(messageInfo.chatId, {
                text: "🚧 TikTok downloader is under development. Coming soon!"
            });

        } catch (error) {
            console.error('TikTok download error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to download TikTok video."
            });
        }
    }

    async twitter(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🐦 Usage: .twitter [URL]\nExample: .twitter https://twitter.com/user/status/123"
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🐦 Downloading Twitter media... Please wait."
            });

            // Placeholder for Twitter download
            await sock.sendMessage(messageInfo.chatId, {
                text: "🚧 Twitter downloader is under development. Coming soon!"
            });

        } catch (error) {
            console.error('Twitter download error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to download Twitter media."
            });
        }
    }

    async play(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎵 Usage: .play [song name]\nExample: .play Bohemian Rhapsody Queen"
                });
            }

            const query = params.join(' ');
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `🔍 Searching for "${query}"... Please wait.`
            });

            // Search YouTube for the song
            try {
                // This would need a proper YouTube search API implementation
                const searchResults = await this.searchYouTube(query);
                
                if (!searchResults.length) {
                    return await sock.sendMessage(messageInfo.chatId, {
                        text: "❌ No results found for your search query."
                    });
                }

                const firstResult = searchResults[0];
                
                // Download the first result
                await this.downloadYouTubeAudio(firstResult.url, messageInfo, sock);

            } catch (error) {
                await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Search functionality is under development. Please use .youtube with a direct URL for now."
                });
            }

        } catch (error) {
            console.error('Play command error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to play the requested song."
            });
        }
    }

    async searchYouTube(query) {
        // Placeholder for YouTube search API
        // Would need to implement proper YouTube Data API v3 integration
        return [];
    }

    async downloadYouTubeAudio(url, messageInfo, sock) {
        try {
            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title;
            const duration = info.videoDetails.lengthSeconds;

            const fileName = `${Date.now()}.mp3`;
            const filePath = path.join('./temp', fileName);

            // Download audio only
            const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
            const writeStream = fs.createWriteStream(filePath);
            
            stream.pipe(writeStream);

            writeStream.on('finish', async () => {
                try {
                    const stats = await fs.stat(filePath);
                    const fileSizeMB = stats.size / (1024 * 1024);

                    if (fileSizeMB > config.maxFileSize) {
                        await fs.unlink(filePath);
                        return await sock.sendMessage(messageInfo.chatId, {
                            text: `❌ Audio file too large (${fileSizeMB.toFixed(1)}MB).`
                        });
                    }

                    await sock.sendMessage(messageInfo.chatId, {
                        audio: fs.readFileSync(filePath),
                        mimetype: 'audio/mp4',
                        ptt: false,
                        caption: `🎵 *${title}*\n⏱️ Duration: ${this.formatDuration(duration)}\n🤖 Downloaded by ANONYMOUS X`
                    });

                    await fs.unlink(filePath);
                } catch (error) {
                    console.error('Audio download finish error:', error);
                }
            });

        } catch (error) {
            console.error('YouTube audio download error:', error);
            throw error;
        }
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

module.exports = DownloaderService;
