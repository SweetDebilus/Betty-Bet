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
const interactionCreate_1 = require("../events/interactionCreate");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('userlist')
        .setDescription('List all registered users and their points (BetManager only).'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                yield handleUserList(interaction);
            }
            else {
                yield interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                (0, log_1.log)(`WARNING: Userlist command executed without proper permissions.`);
            }
        });
    }
};
const handleUserList = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userList = Object.entries(pointsManager_1.usersPoints).map(([userId, userInfo]) => {
        return `- ${userInfo.name}`;
    }).join('\n');
    const userNumber = Object.keys(pointsManager_1.usersPoints).length;
    yield interaction.reply(`**${userNumber} Users registered:**\n\n${userList}`);
    (0, log_1.log)(`INFO: Userlist command executed successfully.`);
});
