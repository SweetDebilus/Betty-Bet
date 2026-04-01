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
const log_1 = require("../utils/log");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('points')
        .setDescription('Check your points'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = interaction.user.id;
            const pointsEmoji = process.env.POINTS;
            const debilus = process.env.DEBILUS;
            if (!pointsManager_1.usersPoints[userId]) {
                yield interaction.reply({ content: 'You are not registered yet. Use */register* to register.', flags: discord_js_1.MessageFlags.Ephemeral });
                return;
            }
            const userInfo = pointsManager_1.usersPoints[userId];
            const status = userInfo.isDebilus ? `you are a **Debilus** ${debilus}` : 'bettor';
            yield interaction.reply({ content: `**${userInfo.name}**\n\nYou have **${userInfo.points}** ${pointsEmoji}\n\n| **${userInfo.wins} wins** | **${userInfo.losses} losses** |\n\n**Status:** ${status}`, flags: discord_js_1.MessageFlags.Ephemeral });
            (0, log_1.log)(`INFO: User ${userId} checked their points balance of ${userInfo.points} points.`);
        });
    }
};
