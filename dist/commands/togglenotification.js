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
        .setName('togglenotifications')
        .setDescription('Toggle notifications for Point Vault GearPoints'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = interaction.user.id;
            if (!pointsManager_1.usersPoints[userId]) {
                yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', flags: discord_js_1.MessageFlags.Ephemeral });
                return;
            }
            pointsManager_1.usersPoints[userId].notificationsEnabled = !pointsManager_1.usersPoints[userId].notificationsEnabled;
            yield (0, pointsManager_1.savePoints)();
            yield interaction.reply({
                content: `Notifications have been ${pointsManager_1.usersPoints[userId].notificationsEnabled ? 'enabled' : 'disabled'}.`,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            (0, log_1.log)(`INFO: User ${userId} toggled notifications.`);
        });
    }
};
