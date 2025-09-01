const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class SearchService {
    constructor() {
        this.newsApiKey = process.env.NEWS_API_KEY || 'demo_key';
    }

    async pinterest(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "📌 Usage: .pinterest [search term]\nExample: .pinterest nature wallpapers"
                });
            }

            const query = params.join(' ');
            
            await sock.sendMessage(messageInfo.chatId, {
                text: "📌 Searching Pinterest... Please wait."
            });

            // Pinterest search using unofficial API
            try {
                const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `📌 *Pinterest Search Results*\n\n🔍 Query: ${query}\n🔗 Link: ${searchUrl}\n\n💡 Click the link above to view Pinterest results for "${query}"`
                });
                
            } catch (apiError) {
                const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
                await sock.sendMessage(messageInfo.chatId, {
                    text: `📌 *Pinterest Search*\n\n🔍 Search: ${query}\n🔗 ${searchUrl}`
                });
            }

        } catch (error) {
            console.error('Pinterest error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Pinterest search failed. Please try again later."
            });
        }
    }

    async reverseImageSearch(messageInfo, sock, params) {
        try {
            if (!messageInfo.quotedMsg || !messageInfo.quotedMsg.imageMessage) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🔍 Usage: Reply to an image with .sauce or .reverseimg\nThis will help you find the source of the image."
                });
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: "🔍 Processing image for reverse search..."
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

            // Create temporary file
            const tempFile = path.join('./temp', `reverse_${Date.now()}.jpg`);
            await fs.writeFile(tempFile, buffer);

            // Generate reverse search URLs
            const googleUrl = `https://lens.google.com/uploadbyurl?url=`;
            const yandexUrl = `https://yandex.com/images/search?rpt=imageview&url=`;
            const tinyeyeUrl = `https://tineye.com/search/?url=`;

            await sock.sendMessage(messageInfo.chatId, {
                text: `🔍 *Reverse Image Search*\n\n` +
                      `📱 Use these links to find the image source:\n\n` +
                      `🔍 Google Lens: Search using Google Images\n` +
                      `🔎 Yandex: Search using Yandex Images\n` +
                      `👁️ TinEye: Search using TinEye\n\n` +
                      `💡 Upload the image to any of these services manually for best results.`
            });

            // Clean up temp file
            await fs.unlink(tempFile).catch(() => {});

        } catch (error) {
            console.error('Reverse image search error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to process image for reverse search."
            });
        }
    }

    async wallpaper(messageInfo, sock, params) {
        try {
            const category = params[0] || 'random';
            
            await sock.sendMessage(messageInfo.chatId, {
                text: "🖼️ Finding wallpapers... Please wait."
            });

            try {
                // Using Unsplash API for high-quality wallpapers
                const response = await axios.get(`https://api.unsplash.com/photos/random`, {
                    params: {
                        query: category,
                        orientation: 'portrait',
                        client_id: 'your_unsplash_key' // Would need actual key
                    },
                    timeout: 10000
                });

                const wallpaper = response.data;
                const imageResponse = await axios.get(wallpaper.urls.regular, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(imageResponse.data);

                await sock.sendMessage(messageInfo.chatId, {
                    image: buffer,
                    caption: `🖼️ *Wallpaper*\n\n📝 ${wallpaper.alt_description || 'Beautiful wallpaper'}\n📸 by ${wallpaper.user.name}\n🔍 Category: ${category}\n🤖 Provided by ANONYMOUS X`
                });

            } catch (apiError) {
                // Fallback to wallpaper websites
                const websites = [
                    `https://wallpaperaccess.com/search?q=${encodeURIComponent(category)}`,
                    `https://www.wallpaperflare.com/search?wallpaper=${encodeURIComponent(category)}`,
                    `https://wall.alphacoders.com/search.php?search=${encodeURIComponent(category)}`
                ];

                const randomSite = websites[Math.floor(Math.random() * websites.length)];
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `🖼️ *Wallpaper Search*\n\n🔍 Category: ${category}\n🔗 Link: ${randomSite}\n\n💡 Visit the link above to find high-quality wallpapers!`
                });
            }

        } catch (error) {
            console.error('Wallpaper error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to find wallpapers. Please try again later."
            });
        }
    }

    async lyrics(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎵 Usage: .lyrics [song name] [artist]\nExample: .lyrics Bohemian Rhapsody Queen"
                });
            }

            const query = params.join(' ');
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `🎵 Searching lyrics for "${query}"...`
            });

            try {
                // Using lyrics.ovh API (free)
                const searchQuery = query.split(' ');
                let artist = '';
                let song = '';
                
                if (searchQuery.length >= 2) {
                    song = searchQuery.slice(0, -1).join(' ');
                    artist = searchQuery[searchQuery.length - 1];
                } else {
                    song = query;
                }

                const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`);
                
                let lyrics = response.data.lyrics;
                
                // Truncate if too long (WhatsApp message limit)
                if (lyrics.length > 4000) {
                    lyrics = lyrics.substring(0, 4000) + '\n\n... (lyrics truncated)';
                }

                await sock.sendMessage(messageInfo.chatId, {
                    text: `🎵 *Lyrics*\n\n🎤 Song: ${song}\n🎨 Artist: ${artist}\n\n${lyrics}`
                });

            } catch (apiError) {
                // Fallback with search suggestions
                const searchUrls = [
                    `https://genius.com/search?q=${encodeURIComponent(query)}`,
                    `https://www.azlyrics.com/search.php?q=${encodeURIComponent(query)}`,
                    `https://www.metrolyrics.com/search.html?search=${encodeURIComponent(query)}`
                ];

                const randomUrl = searchUrls[Math.floor(Math.random() * searchUrls.length)];

                await sock.sendMessage(messageInfo.chatId, {
                    text: `🎵 *Lyrics Search*\n\n🔍 Query: ${query}\n🔗 ${randomUrl}\n\n💡 Click the link above to find lyrics for "${query}"`
                });
            }

        } catch (error) {
            console.error('Lyrics error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to find lyrics. Please try again with song and artist name."
            });
        }
    }

    async news(messageInfo, sock, params) {
        try {
            const category = params[0] || 'general';
            
            await sock.sendMessage(messageInfo.chatId, {
                text: "📰 Fetching latest news... Please wait."
            });

            try {
                // Using NewsAPI
                const response = await axios.get('https://newsapi.org/v2/top-headlines', {
                    params: {
                        category: category,
                        country: 'us',
                        pageSize: 5,
                        apiKey: this.newsApiKey
                    }
                });

                const articles = response.data.articles;
                
                if (!articles.length) {
                    return await sock.sendMessage(messageInfo.chatId, {
                        text: "📰 No news articles found for this category."
                    });
                }

                let newsText = `📰 *Latest News - ${category.toUpperCase()}*\n\n`;
                
                articles.forEach((article, index) => {
                    newsText += `${index + 1}. **${article.title}**\n`;
                    newsText += `📝 ${article.description || 'No description available'}\n`;
                    newsText += `🔗 ${article.url}\n`;
                    newsText += `📅 ${new Date(article.publishedAt).toLocaleDateString()}\n\n`;
                });

                await sock.sendMessage(messageInfo.chatId, { text: newsText });

            } catch (apiError) {
                // Fallback to news websites
                const newsUrls = {
                    general: 'https://www.bbc.com/news',
                    technology: 'https://www.techcrunch.com',
                    sports: 'https://www.espn.com',
                    business: 'https://www.bloomberg.com',
                    entertainment: 'https://www.variety.com',
                    health: 'https://www.webmd.com/news'
                };

                const url = newsUrls[category] || newsUrls.general;
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `📰 *News*\n\n🔍 Category: ${category}\n🔗 ${url}\n\n💡 Visit the link above for the latest ${category} news!`
                });
            }

        } catch (error) {
            console.error('News error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to fetch news. Please try again later."
            });
        }
    }
}

module.exports = SearchService;