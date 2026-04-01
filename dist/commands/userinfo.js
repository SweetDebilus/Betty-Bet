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
        .setName('userinfo')
        .setDescription('Check information about a user'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const userId = interaction.user.id;
            const pointsEmoji = (_a = process.env.POINTS) !== null && _a !== void 0 ? _a : '';
            const debilus = (_b = process.env.DEBILUS) !== null && _b !== void 0 ? _b : '';
            const userInfo = pointsManager_1.usersPoints[userId];
            if (!userInfo) {
                yield interaction.reply({
                    content: 'You are not registered yet. Use */register* to register.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const status = userInfo.isDebilus
                ? `you are a **Debilus** ${debilus}`
                : 'bettor';
            const notificationsEnabled = userInfo.notificationsEnabled ? 'enabled' : 'disabled';
            const betHistory = ((_c = userInfo.betHistory) === null || _c === void 0 ? void 0 : _c.length)
                ? userInfo.betHistory.join(', ')
                : 'No bets placed yet.';
            yield interaction.reply({
                content: `**User Information for ${userInfo.name}**

- **Points:** ${userInfo.points} ${pointsEmoji}
- **Wins:** ${userInfo.wins}
- **Losses:** ${userInfo.losses}
- **Status:** ${status}
- **Inventory:** ${userInfo.inventory}
- **Notifications:** ${notificationsEnabled}
- **Bet History:** ${betHistory}`,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            (0, log_1.log)(`INFO: User ${userId} checked their user information.`);
        });
    }
};
