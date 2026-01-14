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
exports.command = void 0;
const discord_js_1 = require("discord.js");
const pointsManager_1 = require("../services/pointsManager");
const interactionCreate_1 = require("../events/interactionCreate");
const pointsEmoji = process.env.POINTS;
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('topbettor')
        .setDescription('Show the top bettors (BetManager only)'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                yield handleTopBettor(interaction);
            }
            else {
                yield interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
            }
        });
    }
};
const handleTopBettor = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const rankBettor = {}; // reset à chaque appel
    for (const userId in pointsManager_1.usersPoints) {
        for (const bet of pointsManager_1.usersPoints[userId].betHistory) {
            if (bet.result === 'win') {
                rankBettor[userId] = (rankBettor[userId] || 0) + bet.amount;
            }
            else {
                rankBettor[userId] = (rankBettor[userId] || 0) - bet.amount;
            }
        }
    }
    const sortedBettors = Object.entries(rankBettor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    if (sortedBettors.length === 0) {
        return interaction.reply({
            content: "Nobody has won any bets yet.",
            flags: discord_js_1.MessageFlags.Ephemeral
        });
    }
    let replyMessage = '🏆 **Top Bettors:**\n\n';
    sortedBettors.forEach(([userId, totalBet], index) => {
        var _a;
        const userName = ((_a = pointsManager_1.usersPoints[userId]) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown User';
        replyMessage += `**${index + 1}. ${userName}** – Net Profit: ${totalBet} ${pointsEmoji} \n`;
    });
    yield interaction.reply({
        content: replyMessage,
        flags: discord_js_1.MessageFlags.Ephemeral
    });
});
