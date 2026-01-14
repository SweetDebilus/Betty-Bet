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
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show leaderboard of top betters. (BetManager only)'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                yield handleLeaderboard(interaction);
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
const handleLeaderboard = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const sortedUsers = Object.entries(pointsManager_1.usersPoints).sort((a, b) => b[1].points - a[1].points);
    const top20 = sortedUsers.slice(0, 20);
    const rankWidth = 6;
    const nameWidth = 32;
    const pointsWidth = 10;
    const winsWidth = 8;
    const lossesWidth = 8;
    const leaderboard = top20.map(([userId, userInfo], index) => {
        const userName = userInfo.name.padEnd(nameWidth, ' ');
        const userPoints = userInfo.points.toString().padStart(pointsWidth, ' ');
        const userWins = userInfo.wins.toString().padStart(winsWidth, ' ');
        const userLosses = userInfo.losses.toString().padStart(lossesWidth, ' ');
        return `${(index + 1).toString().padStart(rankWidth, ' ')} ${userName} ${userPoints} ${userWins} ${userLosses}`;
    }).join('\n');
    yield interaction.reply(`**Ranking of the best bettors:**\n\n\`\`\`Rank   Name                                  Points     Wins      Losses\n${leaderboard}\`\`\``);
});
