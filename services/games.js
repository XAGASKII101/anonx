const fs = require('fs-extra');
const path = require('path');

class GamesService {
    constructor() {
        this.activeGames = new Map();
        this.triviaQuestions = this.loadTriviaQuestions();
    }

    async tictactoe(messageInfo, sock, params) {
        try {
            const gameId = messageInfo.chatId;
            
            if (this.activeGames.has(gameId) && this.activeGames.get(gameId).type === 'tictactoe') {
                const game = this.activeGames.get(gameId);
                
                if (params.length === 1 && !isNaN(params[0])) {
                    const position = parseInt(params[0]) - 1;
                    
                    if (position < 0 || position > 8) {
                        return await sock.sendMessage(messageInfo.chatId, {
                            text: "❌ Invalid position. Use numbers 1-9."
                        });
                    }

                    if (game.board[position] !== ' ') {
                        return await sock.sendMessage(messageInfo.chatId, {
                            text: "❌ Position already taken. Choose another."
                        });
                    }

                    // Make player move
                    game.board[position] = 'X';
                    
                    // Check for win or draw
                    if (this.checkWin(game.board, 'X')) {
                        this.activeGames.delete(gameId);
                        return await sock.sendMessage(messageInfo.chatId, {
                            text: `🎉 Congratulations! You won!\n\n${this.formatBoard(game.board)}`
                        });
                    }

                    if (this.isBoardFull(game.board)) {
                        this.activeGames.delete(gameId);
                        return await sock.sendMessage(messageInfo.chatId, {
                            text: `🤝 It's a draw!\n\n${this.formatBoard(game.board)}`
                        });
                    }

                    // Bot move
                    const botMove = this.getBestMove(game.board);
                    game.board[botMove] = 'O';

                    if (this.checkWin(game.board, 'O')) {
                        this.activeGames.delete(gameId);
                        return await sock.sendMessage(messageInfo.chatId, {
                            text: `🤖 Bot wins! Better luck next time.\n\n${this.formatBoard(game.board)}`
                        });
                    }

                    if (this.isBoardFull(game.board)) {
                        this.activeGames.delete(gameId);
                        return await sock.sendMessage(messageInfo.chatId, {
                            text: `🤝 It's a draw!\n\n${this.formatBoard(game.board)}`
                        });
                    }

                    await sock.sendMessage(messageInfo.chatId, {
                        text: `🎮 Your turn! Choose a position (1-9):\n\n${this.formatBoard(game.board)}`
                    });
                }
            } else {
                // Start new game
                const newGame = {
                    type: 'tictactoe',
                    board: Array(9).fill(' '),
                    player: messageInfo.sender
                };
                
                this.activeGames.set(gameId, newGame);
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `🎮 *Tic Tac Toe Started!*\n\nYou are X, bot is O.\nChoose a position (1-9):\n\n${this.formatBoard(newGame.board)}\n\nUsage: .tictactoe [position]`
                });
            }

        } catch (error) {
            console.error('Tic Tac Toe error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Game error occurred. Please try again."
            });
        }
    }

    async hangman(messageInfo, sock, params) {
        try {
            const gameId = messageInfo.chatId;
            
            if (this.activeGames.has(gameId) && this.activeGames.get(gameId).type === 'hangman') {
                const game = this.activeGames.get(gameId);
                
                if (params.length === 1) {
                    const guess = params[0].toLowerCase();
                    
                    if (guess.length === 1) {
                        // Letter guess
                        if (game.guessedLetters.includes(guess)) {
                            return await sock.sendMessage(messageInfo.chatId, {
                                text: "❌ You already guessed that letter!"
                            });
                        }

                        game.guessedLetters.push(guess);

                        if (game.word.includes(guess)) {
                            // Correct guess
                            const wordDisplay = this.getWordDisplay(game.word, game.guessedLetters);
                            
                            if (!wordDisplay.includes('_')) {
                                // Won!
                                this.activeGames.delete(gameId);
                                return await sock.sendMessage(messageInfo.chatId, {
                                    text: `🎉 Congratulations! You guessed the word: *${game.word.toUpperCase()}*`
                                });
                            }

                            await sock.sendMessage(messageInfo.chatId, {
                                text: `✅ Good guess!\n\n${this.formatHangman(game)}`
                            });
                        } else {
                            // Wrong guess
                            game.wrongGuesses++;
                            
                            if (game.wrongGuesses >= 6) {
                                // Lost!
                                this.activeGames.delete(gameId);
                                return await sock.sendMessage(messageInfo.chatId, {
                                    text: `💀 Game Over! The word was: *${game.word.toUpperCase()}*\n\n${this.getHangmanDrawing(6)}`
                                });
                            }

                            await sock.sendMessage(messageInfo.chatId, {
                                text: `❌ Wrong guess!\n\n${this.formatHangman(game)}`
                            });
                        }
                    } else if (guess === game.word) {
                        // Full word guess - correct
                        this.activeGames.delete(gameId);
                        return await sock.sendMessage(messageInfo.chatId, {
                            text: `🎉 Excellent! You guessed the word: *${game.word.toUpperCase()}*`
                        });
                    } else {
                        // Full word guess - wrong
                        game.wrongGuesses++;
                        
                        if (game.wrongGuesses >= 6) {
                            this.activeGames.delete(gameId);
                            return await sock.sendMessage(messageInfo.chatId, {
                                text: `💀 Game Over! The word was: *${game.word.toUpperCase()}*\n\n${this.getHangmanDrawing(6)}`
                            });
                        }

                        await sock.sendMessage(messageInfo.chatId, {
                            text: `❌ Wrong word!\n\n${this.formatHangman(game)}`
                        });
                    }
                }
            } else {
                // Start new game
                const words = ['javascript', 'whatsapp', 'anonymous', 'baileys', 'programming', 'computer', 'internet', 'technology'];
                const randomWord = words[Math.floor(Math.random() * words.length)];
                
                const newGame = {
                    type: 'hangman',
                    word: randomWord,
                    guessedLetters: [],
                    wrongGuesses: 0,
                    player: messageInfo.sender
                };
                
                this.activeGames.set(gameId, newGame);
                
                await sock.sendMessage(messageInfo.chatId, {
                    text: `🎪 *Hangman Started!*\n\n${this.formatHangman(newGame)}\n\nGuess a letter or the full word!\nUsage: .hangman [letter/word]`
                });
            }

        } catch (error) {
            console.error('Hangman error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Game error occurred. Please try again."
            });
        }
    }

    async trivia(messageInfo, sock, params) {
        try {
            const question = this.getRandomTrivia();
            
            const triviaText = `🧠 *Trivia Question*\n\n` +
                              `❓ ${question.question}\n\n` +
                              `A) ${question.options.A}\n` +
                              `B) ${question.options.B}\n` +
                              `C) ${question.options.C}\n` +
                              `D) ${question.options.D}\n\n` +
                              `Reply with A, B, C, or D!`;

            const gameId = `trivia_${Date.now()}`;
            this.activeGames.set(gameId, {
                type: 'trivia',
                question: question,
                player: messageInfo.sender,
                chatId: messageInfo.chatId
            });

            await sock.sendMessage(messageInfo.chatId, { text: triviaText });

            // Auto-remove after 30 seconds
            setTimeout(() => {
                if (this.activeGames.has(gameId)) {
                    this.activeGames.delete(gameId);
                    sock.sendMessage(messageInfo.chatId, {
                        text: `⏰ Trivia timeout! The correct answer was: *${question.answer}*\n\n💡 ${question.explanation}`
                    });
                }
            }, 30000);

        } catch (error) {
            console.error('Trivia error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ Failed to load trivia question."
            });
        }
    }

    async eightball(messageInfo, sock, params) {
        try {
            if (!params.length) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎱 Usage: .8ball [your question]\nExample: .8ball Will it rain tomorrow?"
                });
            }

            const question = params.join(' ');
            const responses = [
                "It is certain", "It is decidedly so", "Without a doubt", "Yes definitely",
                "You may rely on it", "As I see it, yes", "Most likely", "Outlook good",
                "Yes", "Signs point to yes", "Reply hazy, try again", "Ask again later",
                "Better not tell you now", "Cannot predict now", "Concentrate and ask again",
                "Don't count on it", "My reply is no", "My sources say no",
                "Outlook not so good", "Very doubtful"
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            await sock.sendMessage(messageInfo.chatId, {
                text: `🎱 *Magic 8-Ball*\n\n❓ Question: ${question}\n🔮 Answer: *${randomResponse}*`
            });

        } catch (error) {
            console.error('8-ball error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "❌ The magic 8-ball is cloudy. Try again!"
            });
        }
    }

    // Helper methods for Tic Tac Toe
    formatBoard(board) {
        let formatted = "```\n";
        for (let i = 0; i < 9; i += 3) {
            formatted += ` ${board[i] === ' ' ? i + 1 : board[i]} | ${board[i + 1] === ' ' ? i + 2 : board[i + 1]} | ${board[i + 2] === ' ' ? i + 3 : board[i + 2]} \n`;
            if (i < 6) formatted += "---|---|---\n";
        }
        formatted += "```";
        return formatted;
    }

    checkWin(board, player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        return winPatterns.some(pattern => 
            pattern.every(index => board[index] === player)
        );
    }

    isBoardFull(board) {
        return !board.includes(' ');
    }

    getBestMove(board) {
        // Simple AI: find first available spot
        for (let i = 0; i < 9; i++) {
            if (board[i] === ' ') {
                return i;
            }
        }
        return 0;
    }

    // Helper methods for Hangman
    getWordDisplay(word, guessedLetters) {
        return word.split('').map(letter => 
            guessedLetters.includes(letter) ? letter : '_'
        ).join(' ');
    }

    getHangmanDrawing(wrongGuesses) {
        const drawings = [
            "```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```",
            "```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```",
            "```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```",
            "```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```",
            "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```",
            "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```",
            "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```"
        ];
        return drawings[wrongGuesses] || drawings[0];
    }

    formatHangman(game) {
        const wordDisplay = this.getWordDisplay(game.word, game.guessedLetters);
        const drawing = this.getHangmanDrawing(game.wrongGuesses);
        const guessed = game.guessedLetters.length > 0 ? game.guessedLetters.join(', ') : 'None';
        
        return `${drawing}\n\n📝 Word: ${wordDisplay}\n❌ Wrong guesses: ${game.wrongGuesses}/6\n🔤 Guessed: ${guessed}`;
    }

    // Trivia questions
    loadTriviaQuestions() {
        return [
            {
                question: "What does HTML stand for?",
                options: {
                    A: "Hyper Text Markup Language",
                    B: "High Tech Modern Language",
                    C: "Home Tool Markup Language",
                    D: "Hyperlink and Text Markup Language"
                },
                answer: "A",
                explanation: "HTML stands for Hyper Text Markup Language, the standard markup language for creating web pages."
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: {
                    A: "Venus",
                    B: "Mars",
                    C: "Jupiter",
                    D: "Saturn"
                },
                answer: "B",
                explanation: "Mars is known as the Red Planet due to its reddish appearance caused by iron oxide on its surface."
            },
            {
                question: "What is the largest mammal in the world?",
                options: {
                    A: "Elephant",
                    B: "Giraffe",
                    C: "Blue Whale",
                    D: "Hippopotamus"
                },
                answer: "C",
                explanation: "The Blue Whale is the largest mammal and the largest animal ever known to have lived on Earth."
            }
        ];
    }

    getRandomTrivia() {
        return this.triviaQuestions[Math.floor(Math.random() * this.triviaQuestions.length)];
    }

    async dare(messageInfo, sock, params) {
        try {
            const dares = [
                "Send a voice message singing your favorite song",
                "Change your profile picture to a funny meme for 1 hour",
                "Text your crush and tell them a joke",
                "Do 10 push-ups and send a video",
                "Eat something spicy and record your reaction",
                "Dance for 30 seconds and send a video",
                "Call a random contact and say 'I miss you'",
                "Post an embarrassing childhood photo",
                "Speak in an accent for the next 10 messages",
                "Send a message to your ex (if you have one)",
                "Record yourself doing a weird face",
                "Wear your clothes backwards for 1 hour"
            ];

            const randomDare = dares[Math.floor(Math.random() * dares.length)];

            await sock.sendMessage(messageInfo.chatId, {
                text: `💀 *DARE CHALLENGE*\n\n🎯 Your dare: ${randomDare}\n\n😈 Will you accept the challenge?`
            });

        } catch (error) {
            console.error('Dare error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "💀 The dare spirits are sleeping. Try again later!"
            });
        }
    }

    async truth(messageInfo, sock, params) {
        try {
            const truths = [
                "What's the most embarrassing thing you've ever done?",
                "Who was your first crush?",
                "What's your biggest fear?",
                "Have you ever lied to your best friend?",
                "What's the weirdest dream you've ever had?",
                "What's your most embarrassing moment?",
                "Have you ever cheated on a test?",
                "What's the most childish thing you still do?",
                "What's your biggest secret?",
                "Who do you have a crush on right now?",
                "What's the worst thing you've ever said to someone?",
                "Have you ever stolen anything?"
            ];

            const randomTruth = truths[Math.floor(Math.random() * truths.length)];

            await sock.sendMessage(messageInfo.chatId, {
                text: `🤔 *TRUTH QUESTION*\n\n❓ ${randomTruth}\n\n📢 Time to be honest!`
            });

        } catch (error) {
            console.error('Truth error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "🤔 The truth seekers are busy. Try again later!"
            });
        }
    }

    async slots(messageInfo, sock, params) {
        try {
            const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
            const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
            const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
            const slot3 = symbols[Math.floor(Math.random() * symbols.length)];

            let result = '';
            let win = false;

            if (slot1 === slot2 && slot2 === slot3) {
                win = true;
                if (slot1 === '💎') result = 'MEGA JACKPOT! 💎💎💎';
                else if (slot1 === '7️⃣') result = 'JACKPOT! Lucky 777!';
                else if (slot1 === '⭐') result = 'SUPER WIN! Star Power!';
                else result = 'YOU WIN! Three of a kind!';
            } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
                result = 'Small win! Two matching!';
            } else {
                result = 'Try again! No match.';
            }

            await sock.sendMessage(messageInfo.chatId, {
                text: `🎰 *SLOT MACHINE*\n\n[ ${slot1} | ${slot2} | ${slot3} ]\n\n${win ? '🎉' : '😔'} ${result}`
            });

        } catch (error) {
            console.error('Slots error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "🎰 Slot machine is broken! Try again later."
            });
        }
    }

    async coinFlip(messageInfo, sock, params) {
        try {
            const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
            const emoji = result === 'Heads' ? '👑' : '🔸';

            await sock.sendMessage(messageInfo.chatId, {
                text: `🪙 *COIN FLIP*\n\n*Flipping...*\n\n${emoji} **${result.toUpperCase()}** ${emoji}\n\n🎯 The coin has decided!`
            });

        } catch (error) {
            console.error('Coin flip error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "🪙 The coin got lost! Try again."
            });
        }
    }

    async dice(messageInfo, sock, params) {
        try {
            const diceCount = parseInt(params[0]) || 1;
            
            if (diceCount < 1 || diceCount > 6) {
                return await sock.sendMessage(messageInfo.chatId, {
                    text: "🎲 Usage: .dice [number of dice]\nExample: .dice 2 (rolls 2 dice)\nMax 6 dice allowed."
                });
            }

            const results = [];
            let total = 0;

            for (let i = 0; i < diceCount; i++) {
                const roll = Math.floor(Math.random() * 6) + 1;
                results.push(roll);
                total += roll;
            }

            const diceEmojis = results.map(r => ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][r - 1]).join(' ');

            await sock.sendMessage(messageInfo.chatId, {
                text: `🎲 *DICE ROLL*\n\n${diceEmojis}\n\n📊 Results: ${results.join(', ')}\n🔢 Total: ${total}`
            });

        } catch (error) {
            console.error('Dice error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "🎲 The dice rolled away! Try again."
            });
        }
    }

    async roulette(messageInfo, sock, params) {
        try {
            const numbers = Array.from({length: 37}, (_, i) => i); // 0-36
            
            const winningNumber = numbers[Math.floor(Math.random() * numbers.length)];
            let winningColor;
            
            if (winningNumber === 0) {
                winningColor = 'green';
            } else if ([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber)) {
                winningColor = 'red';
            } else {
                winningColor = 'black';
            }

            const colorEmoji = winningColor === 'red' ? '🔴' : winningColor === 'black' ? '⚫' : '🟢';

            await sock.sendMessage(messageInfo.chatId, {
                text: `🎡 *ROULETTE WHEEL*\n\n*Spinning...*\n\n🎯 **${winningNumber}** ${colorEmoji}\n\n🎊 The wheel has chosen ${winningNumber} ${winningColor}!`
            });

        } catch (error) {
            console.error('Roulette error:', error);
            await sock.sendMessage(messageInfo.chatId, {
                text: "🎡 The roulette wheel is stuck! Try again."
            });
        }
    }
}

module.exports = GamesService;
