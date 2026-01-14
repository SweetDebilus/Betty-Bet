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
const discord_js_2 = require("discord.js");
const pointsManager_2 = require("../services/pointsManager");
const placeyourbets_1 = require("./placeyourbets");
const debilus = process.env.DEBILUS;
const pointsEmoji = process.env.POINTS;
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('win')
        .setDescription('Declare the winner and redistribute points. (BetManager only)')
        .addIntegerOption(option => option.setName('winner')
        .setDescription('The winning player (1 or 2)')
        .setRequired(true)),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                const winner = (_a = interaction.options.get('winner')) === null || _a === void 0 ? void 0 : _a.value;
                if (winner === 1 || winner === 2) {
                    yield handleWin(interaction, winner === 1 ? 'bet_player1' : 'bet_player2');
                }
                else {
                    yield interaction.reply('The winner must be 1 or 2.');
                }
            }
            else {
                yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_1.MessageFlags.Ephemeral });
            }
        });
    }
};
const handleWin = (interaction, winningPlayer) => __awaiter(void 0, void 0, void 0, function* () {
    let totalBetAmount = 0;
    let winnerBetAmount = 0;
    let loserBetAmount = 0;
    const winningPlayerName = winningPlayer === 'bet_player1' ? placeyourbets_1.player1Name : placeyourbets_1.player2Name;
    let loserTotalPoints = 0;
    for (const bet of Object.values(placeyourbets_1.currentBets)) {
        if (bet.betOn !== winningPlayer) {
            loserTotalPoints += bet.amount;
        }
    }
    for (const bet of Object.values(placeyourbets_1.currentBets)) {
        totalBetAmount += bet.amount;
        if (bet.betOn === winningPlayer) {
            winnerBetAmount += bet.amount;
        }
        else {
            loserBetAmount += bet.amount;
        }
    }
    if (winnerBetAmount === 0 && loserBetAmount === 0) {
        const message = `No bets, no money ! ${debilus}`;
        yield interaction.reply({ content: message, flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (winnerBetAmount === 0) {
        (0, pointsManager_1.addToDebilusCloset)(totalBetAmount);
        yield (0, pointsManager_2.savePoints)();
        const file = new discord_js_2.AttachmentBuilder('./images/crashboursier.png');
        const message2 = `Thanks for money, Debilus !\n\nAll GearPoints have been added to the **debilus closet** ! \nTotal GearPoints in debilus closet: **${pointsManager_2.debilusCloset}** ${pointsEmoji}`;
        yield interaction.reply({ content: `The winner is **${winningPlayerName}** ! No bets were placed on the winner. ${message2}`, files: [file] });
        for (const [userId, bet] of Object.entries(placeyourbets_1.currentBets)) {
            pointsManager_1.usersPoints[userId].losses += 1;
            const betHistory = pointsManager_1.usersPoints[userId].betHistory;
            betHistory[betHistory.length - 1].result = 'loss';
            pointsManager_1.usersPoints[userId].isDebilus = pointsManager_1.usersPoints[userId].points <= 0;
        }
        (0, placeyourbets_1.setCurrentBets)({});
        (0, placeyourbets_1.setBettingOpen)(false);
        yield (0, pointsManager_2.savePoints)();
        return;
    }
    for (const [userId, bet] of Object.entries(placeyourbets_1.currentBets)) {
        if (bet.betOn === winningPlayer) {
            const gainFromLosers = Math.floor(bet.amount / winnerBetAmount * loserTotalPoints);
            pointsManager_1.usersPoints[userId].points += bet.amount + gainFromLosers;
            pointsManager_1.usersPoints[userId].wins += 1;
            const betHistory = pointsManager_1.usersPoints[userId].betHistory;
            betHistory[betHistory.length - 1].result = 'win';
            pointsManager_1.usersPoints[userId].isDebilus = pointsManager_1.usersPoints[userId].points <= 0;
        }
        else {
            pointsManager_1.usersPoints[userId].losses += 1;
            const betHistory = pointsManager_1.usersPoints[userId].betHistory;
            betHistory[betHistory.length - 1].result = 'loss';
            pointsManager_1.usersPoints[userId].isDebilus = pointsManager_1.usersPoints[userId].points <= 0;
        }
    }
    yield (0, pointsManager_2.savePoints)();
    (0, placeyourbets_1.setCurrentBets)({});
    (0, placeyourbets_1.setBettingOpen)(false);
    const message = `The winner is **${winningPlayerName}** ! Congratulations to all those who bet on this player, the GearPoints have been redistributed !`;
    const message2 = `The winner is **${winningPlayerName}** ! It's the stock market crash, you had to believe a little more in this player !`;
    const file = new discord_js_2.AttachmentBuilder('./images/petitcrashboursier.png');
    if (winnerBetAmount < loserBetAmount) {
        yield interaction.reply({ content: message2, files: [file] });
    }
    else {
        const winFile = new discord_js_2.AttachmentBuilder('./images/victoire.png');
        yield interaction.reply({ content: message, files: [winFile] });
    }
    (0, placeyourbets_1.setPlayerNames)('Player 1', 'Player 2');
});
