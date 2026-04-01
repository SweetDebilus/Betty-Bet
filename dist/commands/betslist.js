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
const placeyourbets_1 = require("./placeyourbets");
const log_1 = require("../utils/log");
const pointsEmoji = process.env.POINTS;
const debilus = process.env.DEBILUS;
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('betslist')
        .setDescription('View the list of players who bet on player 1 and player 2. (BetManager only)'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                yield handleBetsList(interaction);
            }
            else {
                yield interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                (0, log_1.log)(`WARNING: BetsList command executed without proper permissions.`);
            }
        });
    }
};
const handleBetsList = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    let totalPlayer1Bets = 0;
    let totalPlayer2Bets = 0;
    if (placeyourbets_1.player1Name === undefined && placeyourbets_1.player2Name === undefined) {
        yield interaction.reply({
            content: `no bets, no game ${debilus}`,
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    const player1Bets = Object.entries(placeyourbets_1.currentBets)
        .filter(([, bet]) => bet.betOn === 'bet_player1')
        .map(([userId, bet]) => {
        totalPlayer1Bets += bet.amount;
        return `${pointsManager_1.usersPoints[userId].name.padEnd(32)}\t${bet.amount}`;
    });
    const player2Bets = Object.entries(placeyourbets_1.currentBets)
        .filter(([, bet]) => bet.betOn === 'bet_player2')
        .map(([userId, bet]) => {
        totalPlayer2Bets += bet.amount;
        return `${pointsManager_1.usersPoints[userId].name.padEnd(32)}\t${bet.amount}`;
    });
    const totalBets = totalPlayer1Bets + totalPlayer2Bets;
    const player1HasHigherBet = totalPlayer1Bets >= totalPlayer2Bets;
    const ratio = totalPlayer1Bets === 0 || totalPlayer2Bets === 0
        ? 'N/A'
        : player1HasHigherBet
            ? `${(totalPlayer1Bets / totalPlayer2Bets).toFixed(2)}:1`
            : `${(totalPlayer2Bets / totalPlayer1Bets).toFixed(2)}:1`;
    const formattedNames = player1HasHigherBet
        ? `(${placeyourbets_1.player1Name} / ${placeyourbets_1.player2Name})`
        : `(${placeyourbets_1.player2Name} / ${placeyourbets_1.player1Name})`;
    yield interaction.reply(`## Bets List:\n\n\`\`\`Player\t\tName\t\t                       Amount\n${placeyourbets_1.player1Name}:\n              ${player1Bets.join('\n') || 'No bets'}\n\n${placeyourbets_1.player2Name}:\n              ${player2Bets.join('\n') || 'No bets'}\`\`\`\n\n` +
        `Total bet on **${placeyourbets_1.player1Name}**: **${totalPlayer1Bets}** ${pointsEmoji}\n` +
        `Total bet on **${placeyourbets_1.player2Name}**: **${totalPlayer2Bets}** ${pointsEmoji}\n` +
        `Total bet overall: **${totalBets}** ${pointsEmoji}\n\n` +
        `Betting Ratio ${formattedNames}: **${ratio}**`);
    (0, log_1.log)(`INFO: Bets list generated`);
});
