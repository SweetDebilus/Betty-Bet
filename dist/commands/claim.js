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
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('claim')
        .setDescription('Claim points from your Point Vault'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const pointsEmoji = process.env.POINTS;
            const userId = interaction.user.id;
            if (!pointsManager_1.usersPoints[userId]) {
                yield interaction.reply({
                    content: 'You are not registered yet. Use `/register` to register.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const pointsToClaim = pointsManager_1.usersPoints[userId].inventory;
            if (pointsToClaim > 0) {
                pointsManager_1.usersPoints[userId].points += pointsToClaim;
                pointsManager_1.usersPoints[userId].inventory = 0;
                pointsManager_1.usersPoints[userId].isDebilus = false;
                yield (0, pointsManager_1.savePoints)();
                yield interaction.reply({
                    content: `You have claimed **${pointsToClaim}** ${pointsEmoji}.\n\nYou now have **${pointsManager_1.usersPoints[userId].points}** ${pointsEmoji}`,
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
            }
            else {
                yield interaction.reply({
                    content: 'You have no points to claim. try again later !',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
            }
        });
    }
};
