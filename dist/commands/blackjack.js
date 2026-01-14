"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBlackjackInteraction = exports.command = void 0;
const discord_js_1 = require("discord.js");
const pointsManager_1 = require("../services/pointsManager");
const log_1 = require("../utils/log");
const pointsEmoji = process.env.POINTS;
const blackjackGames = {};
const cardValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 10, 'Q': 10, 'K': 10, 'A': 11
};
const suits = ['♠️', '♥️', '♦️', '♣️'];
const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play a game of blackjack'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = interaction.user.id;
            if (!pointsManager_1.usersPoints[userId]) {
                yield interaction.reply({
                    content: 'You are not registered yet. Use `/register` to sign up.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            if (blackjackGames[userId]) {
                yield interaction.reply({
                    content: 'You already have an ongoing blackjack game.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            if (pointsManager_1.usersPoints[userId].points < 40) {
                yield interaction.reply({
                    content: 'You need at least 40 points to play blackjack.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const { playerHand, dealerHand } = startBlackjackGame(userId, 40);
            const playerValue = calculateHandValue(playerHand);
            pointsManager_1.usersPoints[userId].points -= 40;
            yield (0, pointsManager_1.savePoints)();
            yield interaction.reply({
                content: `\n# *Betty Bet's visible card*: 
## **|${dealerHand[0]}| |??|**

# *Your hand*: 
## **|${playerHand.join('| |')}|**
## = **${playerValue}**`,
                components: [createBlackjackActionRow()],
                flags: discord_js_1.MessageFlags.Ephemeral
            });
        });
    }
};
// ----------------------
// HANDLERS
// ----------------------
const handleBlackjackInteraction = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (!['blackjack_hit', 'blackjack_stand'].includes(interaction.customId))
        return;
    const userId = interaction.user.id;
    const game = blackjackGames[userId];
    if (!game) {
        yield interaction.reply({
            content: 'No active blackjack game found. Start a new game with /blackjack',
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    if (interaction.customId === 'blackjack_hit') {
        game.playerHand.push(drawCard());
        const playerValue = calculateHandValue(game.playerHand);
        if (playerValue > 21) {
            delete blackjackGames[userId];
            (0, pointsManager_1.addToDebilusCloset)(40);
            yield (0, pointsManager_1.savePoints)();
            yield interaction.update({
                content: `\n# *Your hand*: 
## **|${game.playerHand.join('| |')}|**
## = **${playerValue}**

## **You bust!** *Betty Bet wins.*`,
                components: []
            });
            return;
        }
        yield interaction.update({
            content: `\n# *Betty Bet's visible card*: 
## **|${game.dealerHand[0]}| |??|**

# *Your hand*: 
## **|${game.playerHand.join('| |')}|**
## = **${playerValue}**`,
            components: [createBlackjackActionRow()]
        });
    }
    else if (interaction.customId === 'blackjack_stand') {
        let dealerValue = calculateHandValue(game.dealerHand);
        while (dealerValue < 17) {
            game.dealerHand.push(drawCard());
            dealerValue = calculateHandValue(game.dealerHand);
        }
        const playerValue = calculateHandValue(game.playerHand);
        let resultMessage = `\n# *Betty Bet's hand*: 
## **|${game.dealerHand.join('| |')}|**
### = **${dealerValue}**

# *Your hand*: 
## **|${game.playerHand.join('| |')}|**
## = **${playerValue}**\n\n`;
        if (dealerValue > 21 || playerValue > dealerValue) {
            pointsManager_1.usersPoints[userId].points += game.bet * 2;
            resultMessage += '## **You win!**';
        }
        else if (playerValue < dealerValue) {
            (0, pointsManager_1.addToDebilusCloset)(40);
            resultMessage += '## **Betty Bet wins!**';
        }
        else {
            pointsManager_1.usersPoints[userId].points += game.bet;
            resultMessage += '## **It\'s a tie!**';
        }
        delete blackjackGames[userId];
        yield (0, pointsManager_1.savePoints)();
        yield interaction.update({
            content: resultMessage + `\n## You now have **${pointsManager_1.usersPoints[userId].points}** ${pointsEmoji}`,
            components: []
        });
    }
});
exports.handleBlackjackInteraction = handleBlackjackInteraction;
// ----------------------
// UTILITAIRES
// ----------------------
const createBlackjackActionRow = () => {
    return new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('blackjack_hit')
        .setLabel('Hit')
        .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
        .setCustomId('blackjack_stand')
        .setLabel('Stand')
        .setStyle(discord_js_1.ButtonStyle.Success));
};
const startBlackjackGame = (userId, bet) => {
    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];
    blackjackGames[userId] = { playerHand, dealerHand, bet };
    return { playerHand, dealerHand };
};
const drawCard = () => {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const card = cards[Math.floor(Math.random() * cards.length)];
    return `${card}${suit}`;
};
const calculateHandValue = (hand) => {
    let value = 0;
    let aces = 0;
    hand.forEach(card => {
        const match = card.match(/[0-9]+|[JQKA]/);
        const cardValue = match ? match[0] : null;
        if (cardValue) {
            value += cardValues[cardValue];
            if (cardValue === 'A')
                aces++;
        }
        else {
            (0, log_1.log)(`Invalid card value: ${card}`);
        }
    });
    while (value > 21 && aces) {
        value -= 10;
        aces--;
    }
    return value;
};
