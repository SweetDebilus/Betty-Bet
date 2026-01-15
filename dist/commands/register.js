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
const pointsEmoji = process.env.POINTS;
const debilus = process.env.DEBILUS;
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('register')
        .setDescription('Register to get initial points'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = interaction.user.id;
            const member = interaction.member;
            const userName = member.nickname || interaction.user.displayName;
            if (pointsManager_1.usersPoints[userId]) {
                yield interaction.reply({
                    content: `You are already registered.\n\n\n*Debilus* ${debilus}`,
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                (0, log_1.log)(`INFO: User ${userId} attempted to register but is already registered.`);
                return;
            }
            pointsManager_1.usersPoints[userId] = {
                points: 100,
                name: userName,
                wins: 0,
                losses: 0,
                isDebilus: false,
                inventory: 0,
                notificationsEnabled: false,
                betHistory: [],
                inventoryShop: [],
                winMatch: 0,
                loseMatch: 0
            };
            yield (0, pointsManager_1.savePoints)();
            yield interaction.reply({
                content: `Registration successful!\n\nYou have received **100 ${pointsEmoji}** !!!\n\n **Optional**: This bot integrates a notification system, you can activate it by doing the command \`/togglenotification\` and Betty Bet will send you a DM when you reach 10 points in your inventory.`,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            (0, log_1.log)(`INFO: User ${userId} registered successfully.`);
        });
    }
};
