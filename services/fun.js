const axios = require('axios');

class FunService {
    constructor() {
        this.jokes = this.loadJokes();
        this.facts = this.loadFacts();
        this.quotes = this.loadQuotes();
    }

    async joke(messageInfo, sock, params) {
        try {
            // Try to get joke from API first, fallback to local jokes
            try {
                const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
                const joke = response.data;
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `😂 *Random Joke*\n\n${joke.setup}\n\n${joke.punchline}`
                });
            } catch (apiError) {
                // Fallback to local jokes
                const randomJoke = this.jokes[Math.floor(Math.random() * this.jokes.length)];
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `😂 *Random Joke*\n\n${randomJoke}`
                });
            }

        } catch (error) {
            console.error('Joke error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "😅 I'm out of jokes right now! Try again later."
            });
        }
    }

    async meme(messageInfo, sock, params) {
        try {
            // Try to get meme from Reddit API
            try {
                const subreddits = ['memes', 'dankmemes', 'wholesomememes', 'programmerhumor'];
                const randomSubreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
                
                const response = await axios.get(`https://www.reddit.com/r/${randomSubreddit}/random.json`);
                const memeData = response.data[0].data.children[0].data;
                
                if (memeData.url.match(/\.(jpeg|jpg|gif|png)$/)) {
                    const imageResponse = await axios.get(memeData.url, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(imageResponse.data);
                    
                    await sock.sendMessage(messageInfo.chatId, {
                        image: buffer,
                        caption: `😂 *${memeData.title}*\n\n👍 ${memeData.ups} upvotes\n📱 From r/${randomSubreddit}`
                    });
                } else {
                    await sock.sendMessage(messageInfo.chatId, {
                        text: `😂 *Meme*\n\n📝 ${memeData.title}\n🔗 ${memeData.url}\n👍 ${memeData.ups} upvotes`
                    });
                }
            } catch (apiError) {
                // Fallback message
                await sock.sendMessage(messageInfo.chatId, {
                    text: "😅 Meme service is temporarily unavailable. Here's a classic:\n\n'Why do programmers prefer dark mode? Because light attracts bugs!' 🐛"
                });
            }

        } catch (error) {
            console.error('Meme error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "😅 Failed to fetch meme. Try again later!"
            });
        }
    }

    async quote(messageInfo, sock, params) {
        try {
            // Try to get quote from API first
            try {
                const response = await axios.get('https://api.quotable.io/random');
                const quote = response.data;
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `💭 *Inspirational Quote*\n\n"${quote.content}"\n\n— ${quote.author}`
                });
            } catch (apiError) {
                // Fallback to local quotes
                const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `💭 *Inspirational Quote*\n\n${randomQuote}`
                });
            }

        } catch (error) {
            console.error('Quote error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "💭 Wisdom is temporarily unavailable. Try again later!"
            });
        }
    }

    async fact(messageInfo, sock, params) {
        try {
            // Try to get fact from API
            try {
                const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
                const fact = response.data;
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `🧠 *Random Fact*\n\n${fact.text}`
                });
            } catch (apiError) {
                // Fallback to local facts
                const randomFact = this.facts[Math.floor(Math.random() * this.facts.length)];
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `🧠 *Random Fact*\n\n${randomFact}`
                });
            }

        } catch (error) {
            console.error('Fact error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "🧠 Fact database is temporarily unavailable!"
            });
        }
    }

    async compliment(messageInfo, sock, params) {
        try {
            let targetUser = null;
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            } else if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            }

            const compliments = [
                "You're amazing! ✨",
                "You light up every room you enter! 🌟",
                "Your smile is contagious! 😊",
                "You're one of a kind! 🦄",
                "You have a great sense of humor! 😄",
                "You're incredibly thoughtful! 💭",
                "You inspire others! 🌈",
                "You're a ray of sunshine! ☀️",
                "You have excellent taste! 👌",
                "You're absolutely wonderful! 🌺"
            ];

            const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];

            if (targetUser) {
                await sock.sendMessage(messageInfo.chatId, {
                    text: `💝 *Compliment*\n\n@${targetUser.split('@')[0]} ${randomCompliment}`,
                    mentions: [targetUser]
                });
            } else {
                await sock.sendMessage(messageInfo.chatId, {
                    text: `💝 *Compliment for you*\n\n${randomCompliment}`
                });
            }

        } catch (error) {
            console.error('Compliment error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "💝 You're amazing just the way you are!"
            });
        }
    }

    async ship(messageInfo, sock, params) {
        try {
            let user1 = null;
            let user2 = null;

            if (messageInfo.quotedMsg && params.length > 0 && params[0].includes('@')) {
                user1 = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
                user2 = params[0].replace('@', '') + '@s.whatsapp.net';
            } else if (params.length >= 2) {
                user1 = params[0].replace('@', '') + '@s.whatsapp.net';
                user2 = params[1].replace('@', '') + '@s.whatsapp.net';
            }

            if (!user1 || !user2) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "💕 Usage: .ship [@user1] [@user2]\nOr reply to someone and mention another user!"
                });
            }

            const compatibility = Math.floor(Math.random() * 101);
            const shipName = this.generateShipName(user1, user2);

            let status = '';
            if (compatibility >= 80) status = 'Perfect Match! 💍';
            else if (compatibility >= 60) status = 'Great Chemistry! 💕';
            else if (compatibility >= 40) status = 'Good Friends! 👫';
            else if (compatibility >= 20) status = 'Maybe... 🤔';
            else status = 'Not Meant to Be 💔';

            await sock.sendMessage(messageInfo.chatId, {
                text: `💕 *Ship Results*\n\n👤 User 1: @${user1.split('@')[0]}\n👤 User 2: @${user2.split('@')[0]}\n\n💫 Ship Name: ${shipName}\n❤️ Compatibility: ${compatibility}%\n📊 Status: ${status}`,
                mentions: [user1, user2]
            });

        } catch (error) {
            console.error('Ship error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "💕 Cupid's arrows are missing their target!"
            });
        }
    }

    generateShipName(user1, user2) {
        const name1 = user1.split('@')[0].substring(0, 4);
        const name2 = user2.split('@')[0].substring(0, 4);
        return name1 + name2;
    }

    loadJokes() {
        return [
            "Why don't scientists trust atoms? Because they make up everything!",
            "Why did the scarecrow win an award? He was outstanding in his field!",
            "Why don't eggs tell jokes? They'd crack each other up!",
            "What do you call a fake noodle? An impasta!",
            "Why did the coffee file a police report? It got mugged!",
            "What's the best thing about Switzerland? I don't know, but the flag is a big plus!",
            "Why don't skeletons fight each other? They don't have the guts!",
            "What do you call a bear with no teeth? A gummy bear!",
            "Why did the bicycle fall over? Because it was two-tired!",
            "What do you call a sleeping bull? A bulldozer!"
        ];
    }

    loadFacts() {
        return [
            "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.",
            "A group of flamingos is called a 'flamboyance'.",
            "Bananas are berries, but strawberries aren't.",
            "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.",
            "A single cloud can weigh more than a million pounds.",
            "The human brain uses approximately 20% of the body's total energy despite being only 2% of body weight.",
            "Octopuses have three hearts and blue blood.",
            "The Great Wall of China isn't visible from space with the naked eye.",
            "A day on Venus is longer than its year.",
            "Dolphins have names for each other - they use unique whistle signatures."
        ];
    }

    loadQuotes() {
        return [
            '"The only way to do great work is to love what you do." — Steve Jobs',
            '"Innovation distinguishes between a leader and a follower." — Steve Jobs',
            '"Life is what happens to you while you\'re busy making other plans." — John Lennon',
            '"The future belongs to those who believe in the beauty of their dreams." — Eleanor Roosevelt',
            '"It is during our darkest moments that we must focus to see the light." — Aristotle',
            '"The only impossible journey is the one you never begin." — Tony Robbins',
            '"Success is not final, failure is not fatal: it is the courage to continue that counts." — Winston Churchill',
            '"The way to get started is to quit talking and begin doing." — Walt Disney',
            '"Don\'t let yesterday take up too much of today." — Will Rogers',
            '"You learn more from failure than from success. Don\'t let it stop you. Failure builds character." — Unknown'
        ];
    }

    async insult(messageInfo, sock, params) {
        try {
            let targetUser = null;
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            } else if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            }

            const insults = [
                "You're as useful as a chocolate teapot! ☕",
                "I'd call you a tool, but tools are actually useful! 🔧",
                "You have the personality of a wet paper bag! 📄",
                "Your fashion sense is questionable... very questionable! 👗",
                "You're like a broken pencil... pointless! ✏️",
                "I've seen smarter cookies in a jar! 🍪",
                "You're proof that evolution can go in reverse! 🐒",
                "You bring everyone so much joy... when you leave! 🚪",
                "You're like Monday mornings - nobody likes you! 📅",
                "You have all the charm of a paper cut! 📝"
            ];

            const randomInsult = insults[Math.floor(Math.random() * insults.length)];

            if (targetUser) {
                await sock.sendMessage(messageInfo.chatId, {
                    text: `😈 *Playful Roast*\n\n@${targetUser.split('@')[0]} ${randomInsult}\n\n😜 Just kidding! We love you really!`,
                    mentions: [targetUser]
                });
            } else {
                await sock.sendMessage(messageInfo.chatId, {
                    text: `😈 *Random Roast*\n\n${randomInsult}\n\n😜 Don't take it personally!`
                });
            }

        } catch (error) {
            console.error('Insult error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "😈 I'm being too nice today to roast anyone!"
            });
        }
    }

    async simp(messageInfo, sock, params) {
        try {
            let targetUser = null;
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            } else if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            }

            const simpMessages = [
                "is absolutely breathtaking! 😍",
                "makes my heart skip a beat! 💓",
                "is the most amazing person ever! ✨",
                "deserves all the love in the world! 💖",
                "is perfection in human form! 👑",
                "makes everything better just by existing! 🌟",
                "is the definition of flawless! 💯",
                "has stolen my heart completely! 💘",
                "is too good for this world! 😇",
                "is my daily dose of sunshine! ☀️"
            ];

            const randomMessage = simpMessages[Math.floor(Math.random() * simpMessages.length)];

            if (targetUser) {
                await sock.sendMessage(messageInfo.chatId, {
                    text: `😍 *SIMP MODE ACTIVATED*\n\n@${targetUser.split('@')[0]} ${randomMessage}\n\n💝 Ultimate simping complete!`,
                    mentions: [targetUser]
                });
            } else {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "😍 Usage: .simp [@user]\nReply to someone or mention them to activate simp mode!"
                });
            }

        } catch (error) {
            console.error('Simp error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "😍 My simp mode is temporarily broken!"
            });
        }
    }

    async stupid(messageInfo, sock, params) {
        try {
            let targetUser = null;
            
            if (messageInfo.quotedMsg) {
                targetUser = messageInfo.quotedMsg.participant || messageInfo.quotedMsg.key.participant;
            } else if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            }

            const stupidMessages = [
                "has the IQ of a potato! 🥔",
                "makes rocks look smart! 🪨",
                "couldn't pour water out of a boot with instructions! 👢",
                "is living proof that you can survive without a brain! 🧠",
                "makes goldfish look like Einstein! 🐟",
                "couldn't find water in an ocean! 🌊",
                "is as sharp as a bowling ball! 🎳",
                "makes a brick wall look intellectual! 🧱",
                "couldn't solve a puzzle with one piece! 🧩",
                "is the reason shampoo has instructions! 🧴"
            ];

            const randomMessage = stupidMessages[Math.floor(Math.random() * stupidMessages.length)];

            if (targetUser) {
                await sock.sendMessage(messageInfo.chatId, {
                    text: `🤪 *Silly Roast*\n\n@${targetUser.split('@')[0]} ${randomMessage}\n\n😂 Just for fun! Don't take it seriously!`,
                    mentions: [targetUser]
                });
            } else {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🤪 Usage: .stupid [@user]\nReply to someone or mention them for a silly roast!"
                });
            }

        } catch (error) {
            console.error('Stupid error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "🤪 I'm too smart to call anyone stupid today!"
            });
        }
    }

    async flirt(messageInfo, sock, params) {
        try {
            const flirtLines = [
                "Are you a magician? Because whenever I look at you, everyone else disappears! ✨",
                "Do you have a map? I keep getting lost in your eyes! 🗺️",
                "Are you WiFi? Because I'm really feeling a connection! 📶",
                "If you were a vegetable, you'd be a cute-cumber! 🥒",
                "Are you a parking ticket? Because you've got FINE written all over you! 🎫",
                "Do you believe in love at first sight, or should I walk by again? 👀",
                "Are you a camera? Because every time I look at you, I smile! 📸",
                "Is your name Google? Because you have everything I've been searching for! 🔍",
                "Are you a time traveler? Because I see you in my future! ⏰",
                "If looks could kill, you'd be a weapon of mass destruction! 💣"
            ];

            const randomFlirt = flirtLines[Math.floor(Math.random() * flirtLines.length)];

            await sock.sendMessage(messageInfo.chatId, {
                text: `😏 *Smooth Operator*\n\n${randomFlirt}\n\n😘 *winks*`
            });

        } catch (error) {
            console.error('Flirt error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "😏 I'm too shy to flirt today!"
            });
        }
    }

    async goodnight(messageInfo, sock, params) {
        try {
            const goodnightMessages = [
                "Sweet dreams and peaceful sleep! 🌙✨",
                "May your dreams be filled with happiness! 💤😊",
                "Sleep tight, don't let the bed bugs bite! 🛏️🐛",
                "Wishing you a restful night! 🌟😴",
                "Time to recharge for another amazing day! ⚡🌙",
                "May angels guard your dreams tonight! 👼🌛",
                "Rest well, tomorrow brings new adventures! 🌄💤",
                "Close your eyes and drift to dreamland! 👁️‍🗨️🌈",
                "Sending you peaceful vibes for the night! ☮️🌙",
                "Good night, sleep well, dream sweetly! 🌟💤"
            ];

            const randomMessage = goodnightMessages[Math.floor(Math.random() * goodnightMessages.length)];

            await sock.sendMessage(messageInfo.chatId, {
                text: `🌙 *Good Night Wishes*\n\n${randomMessage}\n\n😴 Sweet dreams everyone!`
            });

        } catch (error) {
            console.error('Goodnight error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "🌙 Good night everyone! Sweet dreams!"
            });
        }
    }

    async shayari(messageInfo, sock, params) {
        try {
            const shayaris = [
                "दिल की बात कहने का\nअंदाज़ कुछ और होता है\nमोहब्बत का इज़हार\nअल्फाज़ कुछ और होता है ❤️",
                "चाँद से पूछा कि तू इतना खूबसूरत क्यों है\nकहा तेरे प्यार की रोशनी से\nमैं इतना खूबसूरत हूँ 🌙",
                "खुदा से माँगी थी एक दुआ\nकि मिल जाए कोई अपना सा\nदुआ क्या कबूल हुई\nतुम मिल गए 💫",
                "इश्क़ में जो मज़ा है वो कहीं और नहीं\nदर्द भी लगता है मीठा जब कोई प्यार करे 💖",
                "तेरी मुस्कान से रोशन है ये जहाँ\nतेरे बिना अधूरी है मेरी हर शाम 😊"
            ];

            const romanShayaris = [
                "Your smile is like sunshine,\nBrightening up my day,\nIn your love I find peace,\nIn every single way 🌞",
                "Stars may fade away,\nBut your love will stay,\nIn my heart forever,\nUntil my dying day ⭐",
                "Like a rose in the garden,\nYou bloom in my heart,\nWithout you beside me,\nMy world falls apart 🌹"
            ];

            const allShayaris = [...shayaris, ...romanShayaris];
            const randomShayari = allShayaris[Math.floor(Math.random() * allShayaris.length)];

            await sock.sendMessage(messageInfo.chatId, {
                text: `🌹 *Beautiful Shayari*\n\n${randomShayari}\n\n💝 From the heart`
            });

        } catch (error) {
            console.error('Shayari error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "🌹 Poetry is the language of the heart! 💖"
            });
        }
    }

    async roseday(messageInfo, sock, params) {
        try {
            const roseDayMessages = [
                "🌹 A rose for you on this special day! May love bloom in your life! 💖",
                "🌹 Red roses for love, white roses for peace, pink roses for happiness! Choose your blessing! 🤍💖",
                "🌹 Like a rose among thorns, you stand out beautifully! Happy Rose Day! ✨",
                "🌹 May your life be as beautiful and fragrant as a garden full of roses! 🌺",
                "🌹 Here's a virtual bouquet for the most special person! Happy Rose Day! 💐",
                "🌹 Roses are red, violets are blue, this Rose Day wish is specially for you! 💙",
                "🌹 Every rose has its thorn, but your beauty makes all troubles disappear! 🌟",
                "🌹 Sending you love, care, and beautiful roses on this Rose Day! 💕"
            ];

            const randomMessage = roseDayMessages[Math.floor(Math.random() * roseDayMessages.length)];

            await sock.sendMessage(messageInfo.chatId, {
                text: `🌹 *Happy Rose Day!* 🌹\n\n${randomMessage}\n\n🌺 May your day be filled with love and happiness! 💖`
            });

        } catch (error) {
            console.error('Rose day error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "🌹 Happy Rose Day! May love bloom in your life! 💖"
            });
        }
    }
}

module.exports = FunService;
