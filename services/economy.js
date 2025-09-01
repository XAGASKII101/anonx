const fs = require('fs-extra');
const path = require('path');

class EconomyService {
    constructor() {
        this.dataFile = './data/users.json';
        this.users = this.loadUsers();
        this.dailyCooldowns = new Map();
    }

    async balance(messageInfo, sock, params) {
        try {
            let targetUser = messageInfo.sender;
            
            if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            }

            const userData = this.getUser(targetUser);
            const userNumber = targetUser.split('@')[0];
            
            await sock.sendMessage(messageInfo.chatId, {
                text: `💰 *Balance Information*\n\n👤 User: @${userNumber}\n💵 Balance: $${userData.balance}\n🏦 Bank: $${userData.bank}\n💎 Total Worth: $${userData.balance + userData.bank}`,
                mentions: [targetUser]
            });

        } catch (error) {
            console.error('Balance error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to get balance information."
            });
        }
    }

    async daily(messageInfo, sock, params) {
        try {
            const userId = messageInfo.sender;
            const today = new Date().toDateString();
            const cooldownKey = `${userId}_${today}`;

            if (this.dailyCooldowns.has(cooldownKey)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "⏰ You've already claimed your daily reward today! Come back tomorrow."
                });
            }

            const userData = this.getUser(userId);
            const dailyAmount = Math.floor(Math.random() * 500) + 100; // 100-600
            const bonusStreak = userData.dailyStreak * 10;
            const totalReward = dailyAmount + bonusStreak;

            userData.balance += totalReward;
            userData.dailyStreak += 1;
            userData.totalEarned += totalReward;
            userData.lastDaily = Date.now();

            this.saveUser(userId, userData);
            this.dailyCooldowns.set(cooldownKey, true);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🎁 *Daily Reward Claimed!*\n\n💰 Base Reward: $${dailyAmount}\n🔥 Streak Bonus: $${bonusStreak}\n✨ Total Earned: $${totalReward}\n\n📊 Current Balance: $${userData.balance}\n🔄 Daily Streak: ${userData.dailyStreak} days`
            });

        } catch (error) {
            console.error('Daily error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to claim daily reward."
            });
        }
    }

    async profile(messageInfo, sock, params) {
        try {
            let targetUser = messageInfo.sender;
            
            if (params.length > 0 && params[0].includes('@')) {
                targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            }

            const userData = this.getUser(targetUser);
            const userNumber = targetUser.split('@')[0];
            
            const profileText = `👤 *User Profile*\n\n` +
                               `📱 User: @${userNumber}\n` +
                               `💰 Balance: $${userData.balance}\n` +
                               `🏦 Bank: $${userData.bank}\n` +
                               `💎 Net Worth: $${userData.balance + userData.bank}\n` +
                               `🔄 Daily Streak: ${userData.dailyStreak} days\n` +
                               `📈 Total Earned: $${userData.totalEarned}\n` +
                               `🎰 Games Played: ${userData.gamesPlayed}\n` +
                               `🏆 Level: ${this.calculateLevel(userData.totalEarned)}\n` +
                               `⭐ Rank: ${await this.getUserRank(targetUser)}`;

            await sock.sendMessage(messageInfo.chatId, {
                text: profileText,
                mentions: [targetUser]
            });

        } catch (error) {
            console.error('Profile error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to load profile."
            });
        }
    }

    async gamble(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎰 Usage: .gamble [amount]\nExample: .gamble 100\nOr .gamble all"
                });
            }

            const userId = messageInfo.sender;
            const userData = this.getUser(userId);
            
            let betAmount;
            if (params[0].toLowerCase() === 'all') {
                betAmount = userData.balance;
            } else {
                betAmount = parseInt(params[0]);
            }

            if (isNaN(betAmount) || betAmount <= 0) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Please enter a valid amount to gamble."
                });
            }

            if (betAmount > userData.balance) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `❌ Insufficient balance! You have $${userData.balance}.`
                });
            }

            userData.gamesPlayed += 1;
            const winChance = 0.45; // 45% win chance
            const isWin = Math.random() < winChance;

            if (isWin) {
                const multiplier = Math.random() * 1.5 + 0.5; // 0.5x to 2x
                const winAmount = Math.floor(betAmount * multiplier);
                userData.balance += winAmount;
                userData.totalEarned += winAmount;

                await sock.sendMessage(messageInfo.chatId, {
                    text: `🎉 *You Won!*\n\n💰 Bet: $${betAmount}\n🎰 Multiplier: ${multiplier.toFixed(2)}x\n✨ Won: $${winAmount}\n💵 New Balance: $${userData.balance}`
                });
            } else {
                userData.balance -= betAmount;
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `💸 *You Lost!*\n\n💰 Bet: $${betAmount}\n😢 Lost: $${betAmount}\n💵 New Balance: $${userData.balance}\n\n🍀 Better luck next time!`
                });
            }

            this.saveUser(userId, userData);

        } catch (error) {
            console.error('Gamble error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Gambling error occurred."
            });
        }
    }

    async shop(messageInfo, sock, params) {
        try {
            const shopItems = [
                { id: 1, name: "Lucky Charm", price: 500, description: "Increases win chance by 5%" },
                { id: 2, name: "Daily Booster", price: 1000, description: "Double daily rewards for 7 days" },
                { id: 3, name: "XP Multiplier", price: 2000, description: "2x experience for 24 hours" },
                { id: 4, name: "Custom Title", price: 5000, description: "Set a custom title for your profile" },
                { id: 5, name: "VIP Status", price: 10000, description: "VIP privileges for 30 days" }
            ];

            let shopText = "🛒 *Economy Shop*\n\n";
            
            shopItems.forEach(item => {
                shopText += `${item.id}. **${item.name}** - $${item.price}\n`;
                shopText += `   ${item.description}\n\n`;
            });

            shopText += "💡 Use .buy [item_id] to purchase\nExample: .buy 1";

            await sock.sendMessage(messageInfo.chatId, { text: shopText });

        } catch (error) {
            console.error('Shop error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Shop is temporarily closed."
            });
        }
    }

    async leaderboard(messageInfo, sock, params) {
        try {
            const allUsers = Object.entries(this.users)
                .map(([userId, userData]) => ({
                    userId,
                    balance: userData.balance,
                    bank: userData.bank,
                    netWorth: userData.balance + userData.bank,
                    totalEarned: userData.totalEarned
                }))
                .sort((a, b) => b.netWorth - a.netWorth)
                .slice(0, 10);

            let leaderboardText = "🏆 *Economy Leaderboard*\n\n";
            
            allUsers.forEach((user, index) => {
                const userNumber = user.userId.split('@')[0];
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                leaderboardText += `${medal} @${userNumber} - $${user.netWorth}\n`;
            });

            const currentUserRank = await this.getUserRank(messageInfo.sender);
            leaderboardText += `\n📊 Your Rank: #${currentUserRank}`;

            await sock.sendMessage(messageInfo.chatId, { 
                text: leaderboardText,
                mentions: allUsers.map(u => u.userId)
            });

        } catch (error) {
            console.error('Leaderboard error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to load leaderboard."
            });
        }
    }

    getUser(userId) {
        if (!this.users[userId]) {
            this.users[userId] = {
                balance: 1000, // Starting balance
                bank: 0,
                dailyStreak: 0,
                totalEarned: 1000,
                gamesPlayed: 0,
                lastDaily: 0,
                items: [],
                level: 1,
                xp: 0
            };
        }
        return this.users[userId];
    }

    saveUser(userId, userData) {
        this.users[userId] = userData;
        this.saveUsers();
    }

    loadUsers() {
        try {
            if (fs.existsSync(this.dataFile)) {
                return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
        return {};
    }

    saveUsers() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.users, null, 2));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    calculateLevel(totalEarned) {
        return Math.floor(totalEarned / 1000) + 1;
    }

    async getUserRank(userId) {
        const userData = this.getUser(userId);
        const userNetWorth = userData.balance + userData.bank;
        
        const higherUsers = Object.values(this.users).filter(user => 
            (user.balance + user.bank) > userNetWorth
        ).length;
        
        return higherUsers + 1;
    }

    async withdraw(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🏦 Usage: .withdraw [amount]\nExample: .withdraw 500\nOr .withdraw all"
                });
            }

            const userId = messageInfo.sender;
            const userData = this.getUser(userId);
            
            let amount;
            if (params[0].toLowerCase() === 'all') {
                amount = userData.bank;
            } else {
                amount = parseInt(params[0]);
            }

            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Please enter a valid amount to withdraw."
                });
            }

            if (amount > userData.bank) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `❌ Insufficient bank balance! You have $${userData.bank} in bank.`
                });
            }

            userData.bank -= amount;
            userData.balance += amount;
            this.saveUser(userId, userData);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🏦 *Withdrawal Successful*\n\n💸 Withdrew: $${amount}\n💰 New Balance: $${userData.balance}\n🏦 Bank Balance: $${userData.bank}`
            });

        } catch (error) {
            console.error('Withdraw error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Withdrawal failed."
            });
        }
    }

    async deposit(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🏦 Usage: .deposit [amount]\nExample: .deposit 500\nOr .deposit all"
                });
            }

            const userId = messageInfo.sender;
            const userData = this.getUser(userId);
            
            let amount;
            if (params[0].toLowerCase() === 'all') {
                amount = userData.balance;
            } else {
                amount = parseInt(params[0]);
            }

            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Please enter a valid amount to deposit."
                });
            }

            if (amount > userData.balance) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `❌ Insufficient balance! You have $${userData.balance}.`
                });
            }

            userData.balance -= amount;
            userData.bank += amount;
            this.saveUser(userId, userData);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🏦 *Deposit Successful*\n\n💰 Deposited: $${amount}\n💵 New Balance: $${userData.balance}\n🏦 Bank Balance: $${userData.bank}`
            });

        } catch (error) {
            console.error('Deposit error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Deposit failed."
            });
        }
    }

    async donate(messageInfo, sock, params) {
        try {
            if (params.length < 2) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "💝 Usage: .donate [@user] [amount]\nExample: .donate @user123 500"
                });
            }

            const userId = messageInfo.sender;
            const targetUser = params[0].replace('@', '') + '@s.whatsapp.net';
            const amount = parseInt(params[1]);

            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Please enter a valid amount to donate."
                });
            }

            const userData = this.getUser(userId);
            const targetData = this.getUser(targetUser);

            if (amount > userData.balance) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `❌ Insufficient balance! You have $${userData.balance}.`
                });
            }

            if (userId === targetUser) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ You cannot donate to yourself!"
                });
            }

            userData.balance -= amount;
            targetData.balance += amount;
            targetData.totalEarned += amount;

            this.saveUser(userId, userData);
            this.saveUser(targetUser, targetData);

            await sock.sendMessage(messageInfo.chatId, {
                text: `💝 *Donation Successful*\n\n👤 From: @${userId.split('@')[0]}\n👤 To: @${targetUser.split('@')[0]}\n💰 Amount: $${amount}\n\n💵 Your Balance: $${userData.balance}`,
                mentions: [userId, targetUser]
            });

        } catch (error) {
            console.error('Donate error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Donation failed."
            });
        }
    }

    async lottery(messageInfo, sock, params) {
        try {
            const ticketPrice = 100;
            const userId = messageInfo.sender;
            const userData = this.getUser(userId);

            if (userData.balance < ticketPrice) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `🎫 *Lottery Ticket*\n\n❌ Insufficient balance! Ticket costs $${ticketPrice}.\nYou have $${userData.balance}.`
                });
            }

            userData.balance -= ticketPrice;
            
            // Lottery chances
            const rand = Math.random();
            let prize = 0;
            let prizeText = '';

            if (rand < 0.01) { // 1% chance
                prize = 10000;
                prizeText = '🎊 MEGA JACKPOT! 🎊';
            } else if (rand < 0.05) { // 4% chance
                prize = 5000;
                prizeText = '🎉 Big Win! 🎉';
            } else if (rand < 0.15) { // 10% chance
                prize = 1000;
                prizeText = '🎯 Good Win! 🎯';
            } else if (rand < 0.30) { // 15% chance
                prize = 500;
                prizeText = '✨ Small Win! ✨';
            } else if (rand < 0.50) { // 20% chance
                prize = 200;
                prizeText = '🍀 Lucky! 🍀';
            } else {
                prizeText = '😢 Better luck next time! 😢';
            }

            userData.balance += prize;
            userData.totalEarned += prize;
            this.saveUser(userId, userData);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🎫 *Lottery Results*\n\n${prizeText}\n\n🎰 Ticket Cost: $${ticketPrice}\n💰 Prize Won: $${prize}\n💵 New Balance: $${userData.balance}`
            });

        } catch (error) {
            console.error('Lottery error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Lottery system error."
            });
        }
    }

    async rich(messageInfo, sock, params) {
        // Alias to leaderboard
        return this.leaderboard(messageInfo, sock, params);
    }

    async editProfile(messageInfo, sock, params) {
        try {
            if (params.length < 2) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "✏️ Usage: .edit [field] [value]\nFields: bio, age, status\nExample: .edit bio I love this bot!"
                });
            }

            const userId = messageInfo.sender;
            const userData = this.getUser(userId);
            const field = params[0].toLowerCase();
            const value = params.slice(1).join(' ');

            if (!userData.profile) {
                userData.profile = {};
            }

            const validFields = ['bio', 'age', 'status'];
            if (!validFields.includes(field)) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `❌ Invalid field. Valid fields: ${validFields.join(', ')}`
                });
            }

            if (field === 'age') {
                const age = parseInt(value);
                if (isNaN(age) || age < 13 || age > 100) {
                    return await sock.sendMessage(messageInfo.chatId, {
                        text: "❌ Age must be a number between 13 and 100."
                    });
                }
                userData.profile[field] = age;
            } else {
                if (value.length > 100) {
                    return await sock.sendMessage(messageInfo.chatId, {
                        text: "❌ Text too long. Maximum 100 characters."
                    });
                }
                userData.profile[field] = value;
            }

            this.saveUser(userId, userData);

            await sock.sendMessage(messageInfo.chatId, {
                text: `✏️ *Profile Updated*\n\n📝 Field: ${field}\n💬 Value: ${userData.profile[field]}\n\n✅ Profile saved successfully!`
            });

        } catch (error) {
            console.error('Edit profile error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to update profile."
            });
        }
    }

    async bio(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "📝 Usage: .bio [your bio text]\nExample: .bio I'm a friendly WhatsApp bot user!"
                });
            }

            const userId = messageInfo.sender;
            const userData = this.getUser(userId);
            const bioText = params.join(' ');

            if (bioText.length > 150) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Bio too long. Maximum 150 characters allowed."
                });
            }

            if (!userData.profile) {
                userData.profile = {};
            }

            userData.profile.bio = bioText;
            this.saveUser(userId, userData);

            await sock.sendMessage(messageInfo.chatId, {
                text: `📝 *Bio Updated*\n\n"${bioText}"\n\n✅ Your bio has been saved!`
            });

        } catch (error) {
            console.error('Bio error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to update bio."
            });
        }
    }

    async setAge(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎂 Usage: .setage [age]\nExample: .setage 25"
                });
            }

            const age = parseInt(params[0]);
            if (isNaN(age) || age < 13 || age > 100) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "❌ Please enter a valid age between 13 and 100."
                });
            }

            const userId = messageInfo.sender;
            const userData = this.getUser(userId);

            if (!userData.profile) {
                userData.profile = {};
            }

            userData.profile.age = age;
            this.saveUser(userId, userData);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🎂 *Age Updated*\n\n👤 Age: ${age} years old\n✅ Age has been saved to your profile!`
            });

        } catch (error) {
            console.error('Set age error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to update age."
            });
        }
    }

    async inventory(messageInfo, sock, params) {
        try {
            const userId = messageInfo.sender;
            const userData = this.getUser(userId);

            if (!userData.items || userData.items.length === 0) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎒 *Your Inventory*\n\n❌ Your inventory is empty!\n\n💡 Buy items from .shop or earn them through activities."
                });
            }

            let inventoryText = "🎒 *Your Inventory*\n\n";
            
            userData.items.forEach((item, index) => {
                inventoryText += `${index + 1}. ${item.name} x${item.quantity || 1}\n`;
                inventoryText += `   📝 ${item.description}\n\n`;
            });

            inventoryText += `📊 Total Items: ${userData.items.length}`;

            await sock.sendMessage(messageInfo.chatId, { text: inventoryText });

        } catch (error) {
            console.error('Inventory error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to load inventory."
            });
        }
    }

    async dig(messageInfo, sock, params) {
        try {
            const userId = messageInfo.sender;
            const userData = this.getUser(userId);
            
            // Check cooldown (1 hour)
            const now = Date.now();
            const cooldown = 60 * 60 * 1000; // 1 hour
            if (userData.lastDig && (now - userData.lastDig) < cooldown) {
                const remaining = Math.ceil((cooldown - (now - userData.lastDig)) / (60 * 1000));
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `⛏️ You're tired from digging! Rest for ${remaining} more minutes.`
                });
            }

            userData.lastDig = now;
            
            // Random dig results
            const rand = Math.random();
            let result = '';
            let reward = 0;
            
            if (rand < 0.05) { // 5% chance
                reward = 1000;
                result = '💎 You found a rare diamond!';
            } else if (rand < 0.15) { // 10% chance
                reward = 500;
                result = '🪙 You discovered gold coins!';
            } else if (rand < 0.30) { // 15% chance
                reward = 200;
                result = '⚡ You found some valuable ore!';
            } else if (rand < 0.50) { // 20% chance
                reward = 100;
                result = '🔩 You dug up some scrap metal!';
            } else if (rand < 0.70) { // 20% chance
                reward = 50;
                result = '🪨 You found some stones!';
            } else {
                result = '🕳️ You only found dirt and rocks...';
            }

            userData.balance += reward;
            userData.totalEarned += reward;
            this.saveUser(userId, userData);

            await sock.sendMessage(messageInfo.chatId, {
                text: `⛏️ *Digging Results*\n\n${result}\n\n💰 Earned: $${reward}\n💵 New Balance: $${userData.balance}\n\n⏰ Come back in 1 hour to dig again!`
            });

        } catch (error) {
            console.error('Dig error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Digging failed. Try again later."
            });
        }
    }

    async fish(messageInfo, sock, params) {
        try {
            const userId = messageInfo.sender;
            const userData = this.getUser(userId);
            
            // Check cooldown (45 minutes)
            const now = Date.now();
            const cooldown = 45 * 60 * 1000; // 45 minutes
            if (userData.lastFish && (now - userData.lastFish) < cooldown) {
                const remaining = Math.ceil((cooldown - (now - userData.lastFish)) / (60 * 1000));
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `🎣 The fish are hiding! Wait ${remaining} more minutes.`
                });
            }

            userData.lastFish = now;
            
            // Random fishing results
            const fishes = [
                { name: '🐟 Common Fish', value: 50, chance: 0.4 },
                { name: '🐠 Tropical Fish', value: 100, chance: 0.3 },
                { name: '🦈 Shark', value: 500, chance: 0.1 },
                { name: '🐙 Octopus', value: 300, chance: 0.15 },
                { name: '🦑 Squid', value: 200, chance: 0.2 },
                { name: '🐡 Rare Fish', value: 800, chance: 0.05 }
            ];

            const rand = Math.random();
            let cumulativeChance = 0;
            let caught = null;

            for (const fish of fishes) {
                cumulativeChance += fish.chance;
                if (rand <= cumulativeChance) {
                    caught = fish;
                    break;
                }
            }

            if (!caught) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `🎣 *Fishing Results*\n\n🌊 The fish got away! Better luck next time.\n\n⏰ Try again in 45 minutes!`
                });
            }

            userData.balance += caught.value;
            userData.totalEarned += caught.value;
            this.saveUser(userId, userData);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🎣 *Fishing Results*\n\n🎉 You caught a ${caught.name}!\n\n💰 Earned: $${caught.value}\n💵 New Balance: $${userData.balance}\n\n⏰ Come back in 45 minutes!`
            });

        } catch (error) {
            console.error('Fish error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Fishing failed. Try again later."
            });
        }
    }

    async beg(messageInfo, sock, params) {
        try {
            const userId = messageInfo.sender;
            const userData = this.getUser(userId);
            
            // Check cooldown (30 minutes)
            const now = Date.now();
            const cooldown = 30 * 60 * 1000; // 30 minutes
            if (userData.lastBeg && (now - userData.lastBeg) < cooldown) {
                const remaining = Math.ceil((cooldown - (now - userData.lastBeg)) / (60 * 1000));
                return await sock.sendMessage(messageInfo.chatId, {
                    text: `🙏 People are tired of you begging! Wait ${remaining} more minutes.`
                });
            }

            userData.lastBeg = now;
            
            const begResponses = [
                { message: "A kind stranger gave you some coins!", amount: 50 },
                { message: "Someone felt sorry for you!", amount: 30 },
                { message: "A generous person helped you out!", amount: 80 },
                { message: "You found some dropped money!", amount: 40 },
                { message: "Someone threw coins at you!", amount: 60 },
                { message: "People ignored you completely...", amount: 0 }
            ];

            const randomResponse = begResponses[Math.floor(Math.random() * begResponses.length)];
            
            userData.balance += randomResponse.amount;
            if (randomResponse.amount > 0) {
                userData.totalEarned += randomResponse.amount;
            }
            this.saveUser(userId, userData);

            await sock.sendMessage(messageInfo.chatId, {
                text: `🙏 *Begging Results*\n\n${randomResponse.message}\n\n💰 Earned: $${randomResponse.amount}\n💵 New Balance: $${userData.balance}\n\n⏰ Try again in 30 minutes!`
            });

        } catch (error) {
            console.error('Beg error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Begging failed. Try again later."
            });
        }
    }
}

module.exports = EconomyService;
