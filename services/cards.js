const fs = require('fs-extra');
const path = require('path');

class CardsService {
    constructor() {
        this.cardsDataFile = './data/cards.json';
        this.cardsData = this.loadCardsData();
        this.cardSeries = this.initializeCardSeries();
        this.activeAuctions = new Map();
    }

    async toggleCards(messageInfo, sock, params) {
        try {
            const setting = params[0]?.toLowerCase();
            
            if (!['on', 'off'].includes(setting)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🃏 Usage: .cards [on/off]\nExample: .cards on"
                });
            }

            const userData = this.getCardUser(messageInfo.sender);
            userData.cardsEnabled = setting === 'on';
            this.saveCardUser(messageInfo.sender, userData);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🃏 *Cards Feature ${setting === 'on' ? 'Enabled' : 'Disabled'}*\n\n${setting === 'on' ? '✅ You can now collect and trade cards!' : '❌ Cards feature disabled for you.'}`
            });

        } catch (error) {
            console.error('Toggle cards error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to toggle cards feature."
            });
        }
    }

    async getCard(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🃏 Usage: .card [index]\nExample: .card 1"
                });
            }

            const userData = this.getCardUser(messageInfo.sender);
            const cardIndex = parseInt(params[0]) - 1;

            if (cardIndex < 0 || cardIndex >= userData.cards.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Invalid card index. Use .deck to see your cards."
                });
            }

            const card = userData.cards[cardIndex];
            const cardInfo = this.getCardInfo(card.name, card.tier);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🃏 *Card Information*\n\n📛 Name: ${card.name}\n⭐ Tier: ${card.tier}\n💎 Rarity: ${cardInfo.rarity}\n⚡ Power: ${cardInfo.power}\n🏷️ Series: ${cardInfo.series}\n💰 Value: $${cardInfo.value}\n📅 Obtained: ${new Date(card.obtained).toLocaleDateString()}`
            });

        } catch (error) {
            console.error('Get card error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get card information."
            });
        }
    }

    async cardInfo(messageInfo, sock, params) {
        try {
            if (params.length < 2) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🃏 Usage: .cardinfo [name] [tier]\nExample: .cardinfo Dragon SSR"
                });
            }

            const name = params[0];
            const tier = params[1];
            const cardInfo = this.getCardInfo(name, tier);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🃏 *Card Database*\n\n📛 Name: ${name}\n⭐ Tier: ${tier}\n💎 Rarity: ${cardInfo.rarity}\n⚡ Power: ${cardInfo.power}\n🏷️ Series: ${cardInfo.series}\n💰 Base Value: $${cardInfo.value}\n📊 Drop Rate: ${cardInfo.dropRate}%`
            });

        } catch (error) {
            console.error('Card info error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get card information."
            });
        }
    }

    async seriesInfo(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🏷️ Usage: .si [series name]\nExample: .si Dragons\n\nAvailable series: " + Object.keys(this.cardSeries).join(', ')
                });
            }

            const seriesName = params.join(' ');
            const series = this.cardSeries[seriesName];

            if (!series) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Series not found. Available series: " + Object.keys(this.cardSeries).join(', ')
                });
            }

            let seriesText = `🏷️ *${seriesName} Series*\n\n📝 Description: ${series.description}\n🃏 Total Cards: ${series.cards.length}\n\n📋 Cards:\n`;
            
            series.cards.forEach((card, index) => {
                seriesText += `${index + 1}. ${card.name} (${card.tier}) - ${card.rarity}\n`;
            });

            await sock.sendMessage(messageInfo.chatId, { text: seriesText });

        } catch (error) {
            console.error('Series info error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get series information."
            });
        }
    }

    async deck(messageInfo, sock, params) {
        try {
            const userData = this.getCardUser(messageInfo.sender);
            
            if (!userData.cards.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🃏 Your deck is empty! Use .claim to get your first cards."
                });
            }

            let deckText = `🃏 *Your Deck*\n\n👤 Player: @${messageInfo.senderNumber}\n🎴 Total Cards: ${userData.cards.length}\n💰 Deck Value: $${this.calculateDeckValue(userData.cards)}\n\n📋 Cards:\n`;
            
            userData.cards.forEach((card, index) => {
                const cardInfo = this.getCardInfo(card.name, card.tier);
                deckText += `${index + 1}. ${card.name} (${card.tier}) - $${cardInfo.value}\n`;
            });

            await sock.sendMessage(messageInfo.chatId, { 
                text: deckText,
                mentions: [messageInfo.sender] 
            });

        } catch (error) {
            console.error('Deck error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to show deck."
            });
        }
    }

    async claimCard(messageInfo, sock, params) {
        try {
            const userData = this.getCardUser(messageInfo.sender);
            const now = Date.now();
            const lastClaim = userData.lastClaim || 0;
            const cooldown = 3 * 60 * 60 * 1000; // 3 hours

            if (now - lastClaim < cooldown) {
                const remainingTime = Math.ceil((cooldown - (now - lastClaim)) / (60 * 1000));
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `⏰ You can claim another card in ${remainingTime} minutes.`
                });
            }

            const newCard = this.generateRandomCard();
            userData.cards.push({
                ...newCard,
                obtained: now
            });
            userData.lastClaim = now;
            
            this.saveCardUser(messageInfo.sender, userData);

            const cardInfo = this.getCardInfo(newCard.name, newCard.tier);
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `🎉 *Card Claimed!*\n\n🃏 ${newCard.name}\n⭐ Tier: ${newCard.tier}\n💎 Rarity: ${cardInfo.rarity}\n💰 Value: $${cardInfo.value}\n\n🎴 Total Cards: ${userData.cards.length}`
            });

        } catch (error) {
            console.error('Claim card error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to claim card."
            });
        }
    }

    async cardShop(messageInfo, sock, params) {
        try {
            const shopItems = [
                { name: "Common Pack", price: 100, description: "3 Common cards guaranteed" },
                { name: "Rare Pack", price: 500, description: "1 Rare + 2 Common cards" },
                { name: "Epic Pack", price: 1000, description: "1 Epic + 1 Rare + 1 Common" },
                { name: "Legendary Pack", price: 5000, description: "1 Legendary card guaranteed" },
                { name: "Card Slot", price: 2000, description: "Increase deck capacity by 5" }
            ];

            let shopText = "🛒 *Card Shop*\n\n";
            
            shopItems.forEach((item, index) => {
                shopText += `${index + 1}. **${item.name}** - $${item.price}\n`;
                shopText += `   ${item.description}\n\n`;
            });

            shopText += "💡 Use .buy [item_number] to purchase";

            await sock.sendMessage(messageInfo.chatId, { text: shopText });

        } catch (error) {
            console.error('Card shop error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Card shop is currently closed."
            });
        }
    }

    async cardLeaderboard(messageInfo, sock, params) {
        try {
            const allUsers = Object.entries(this.cardsData)
                .map(([userId, userData]) => ({
                    userId,
                    cardCount: userData.cards?.length || 0,
                    deckValue: this.calculateDeckValue(userData.cards || [])
                }))
                .filter(user => user.cardCount > 0)
                .sort((a, b) => b.deckValue - a.deckValue)
                .slice(0, 10);

            let leaderboardText = "🏆 *Card Collection Leaderboard*\n\n";
            
            if (!allUsers.length) {
                leaderboardText += "No card collectors yet! Use .claim to start collecting.";
            } else {
                allUsers.forEach((user, index) => {
                    const userNumber = user.userId.split('@')[0];
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    leaderboardText += `${medal} @${userNumber}\n`;
                    leaderboardText += `   🃏 ${user.cardCount} cards | 💰 $${user.deckValue}\n\n`;
                });
            }

            await sock.sendMessage(messageInfo.chatId, { 
                text: leaderboardText,
                mentions: allUsers.map(u => u.userId)
            });

        } catch (error) {
            console.error('Card leaderboard error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to load card leaderboard."
            });
        }
    }

    // Helper methods
    getCardUser(userId) {
        if (!this.cardsData[userId]) {
            this.cardsData[userId] = {
                cards: [],
                cardsEnabled: true,
                lastClaim: 0,
                totalValue: 0
            };
        }
        return this.cardsData[userId];
    }

    saveCardUser(userId, userData) {
        this.cardsData[userId] = userData;
        this.saveCardsData();
    }

    loadCardsData() {
        try {
            if (fs.existsSync(this.cardsDataFile)) {
                return JSON.parse(fs.readFileSync(this.cardsDataFile, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading cards data:', error);
        }
        return {};
    }

    saveCardsData() {
        try {
            fs.writeFileSync(this.cardsDataFile, JSON.stringify(this.cardsData, null, 2));
        } catch (error) {
            console.error('Error saving cards data:', error);
        }
    }

    initializeCardSeries() {
        return {
            "Dragons": {
                description: "Mythical dragon creatures",
                cards: [
                    { name: "Fire Dragon", tier: "SSR", rarity: "Legendary", power: 95, value: 1000 },
                    { name: "Ice Dragon", tier: "SR", rarity: "Epic", power: 80, value: 500 },
                    { name: "Earth Dragon", tier: "R", rarity: "Rare", power: 65, value: 200 }
                ]
            },
            "Warriors": {
                description: "Brave fighter heroes",
                cards: [
                    { name: "Sword Master", tier: "SSR", rarity: "Legendary", power: 90, value: 900 },
                    { name: "Shield Guardian", tier: "SR", rarity: "Epic", power: 75, value: 450 },
                    { name: "Battle Monk", tier: "R", rarity: "Rare", power: 60, value: 180 }
                ]
            },
            "Mages": {
                description: "Powerful magic users",
                cards: [
                    { name: "Archmage", tier: "SSR", rarity: "Legendary", power: 100, value: 1200 },
                    { name: "Lightning Mage", tier: "SR", rarity: "Epic", power: 78, value: 480 },
                    { name: "Frost Mage", tier: "R", rarity: "Rare", power: 62, value: 190 }
                ]
            }
        };
    }

    getCardInfo(name, tier) {
        // Find card in series
        for (const series of Object.values(this.cardSeries)) {
            const card = series.cards.find(c => c.name === name && c.tier === tier);
            if (card) {
                return {
                    ...card,
                    series: Object.keys(this.cardSeries).find(key => this.cardSeries[key].cards.includes(card)),
                    dropRate: tier === 'SSR' ? 1 : tier === 'SR' ? 5 : tier === 'R' ? 15 : 30
                };
            }
        }
        
        // Default card info if not found
        return {
            rarity: "Common",
            power: 30,
            value: 50,
            series: "Unknown",
            dropRate: 30
        };
    }

    generateRandomCard() {
        const allCards = [];
        
        for (const series of Object.values(this.cardSeries)) {
            allCards.push(...series.cards);
        }

        // Weight by rarity
        const weights = { SSR: 1, SR: 5, R: 15, C: 30 };
        const weightedCards = [];
        
        allCards.forEach(card => {
            const weight = weights[card.tier] || 30;
            for (let i = 0; i < weight; i++) {
                weightedCards.push(card);
            }
        });

        const randomCard = weightedCards[Math.floor(Math.random() * weightedCards.length)];
        return { ...randomCard };
    }

    calculateDeckValue(cards) {
        return cards.reduce((total, card) => {
            const cardInfo = this.getCardInfo(card.name, card.tier);
            return total + cardInfo.value;
        }, 0);
    }
}

module.exports = CardsService;