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
        .setName('pointvault')
        .setDescription('Check the total points in the vault'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const pointsEmoji = process.env.POINTS;
            const userId = interaction.user.id;
            if (!pointsManager_1.usersPoints[userId]) {
                yield interaction.reply({
                    content: `You are not registered yet. Use */register* to register.`,
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                (0, log_1.log)(`WARN: Unregistered user ${userId} attempted to access Point Vault.`);
                return;
            }
            const inventoryPoints = pointsManager_1.usersPoints[userId].inventory;
            yield interaction.reply({
                content: `You have **${inventoryPoints}** ${pointsEmoji} in your Point Vault.`,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            (0, log_1.log)(`INFO: User ${userId} checked their Point Vault balance of ${inventoryPoints} points.`);
        });
    }
};
