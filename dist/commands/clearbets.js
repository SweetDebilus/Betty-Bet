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
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('clearbets')
        .setDescription('Clear all bets in case of issues. (BetManager only)'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                yield handleClearBets(interaction);
            }
            else {
                yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_1.MessageFlags.Ephemeral });
                (0, log_1.log)(`ERROR: ClearBets command executed without proper permissions.`);
            }
        });
    }
};
const handleClearBets = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    for (const [userId, bet] of Object.entries(placeyourbets_1.currentBets)) {
        if (pointsManager_1.usersPoints[userId]) {
            pointsManager_1.usersPoints[userId].points += bet.amount;
        }
    }
    yield (0, pointsManager_1.savePoints)();
    (0, placeyourbets_1.setCurrentBets)({});
    (0, placeyourbets_1.setBettingOpen)(false);
    yield interaction.reply('All bets were void and Gearpoints were refunded.');
    (0, log_1.log)(`INFO: All bets have been cleared and points refunded by a BetManager.`);
});
