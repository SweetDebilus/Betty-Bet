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
const log_1 = require("../utils/log");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('clearbethistory')
        .setDescription('Clear the betting history of all users. (BetManager only)'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                yield handleClearBetHistory(interaction);
            }
            else {
                yield interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                (0, log_1.log)(`ERROR: ClearBetHistory command executed without proper permissions.`);
            }
        });
    }
};
const handleClearBetHistory = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    for (const userId in pointsManager_1.usersPoints) {
        pointsManager_1.usersPoints[userId].betHistory = [];
    }
    (0, pointsManager_1.savePoints)();
    yield interaction.reply({
        content: '✅ All user\'s betting history has been cleared.',
        flags: discord_js_1.MessageFlags.Ephemeral
    });
    (0, log_1.log)(`INFO: All users' betting history has been cleared by a BetManager.`);
});
