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
        .setName('deleteuser')
        .setDescription('Delete a registered user. (BetManager only)')
        .addStringOption(option => option.setName('userid')
        .setDescription('The ID of the user to delete')
        .setRequired(true)),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                yield handleDeleteUser(interaction);
            }
            else {
                yield interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                (0, log_1.log)(`WARNING: DeleteUser command executed without proper permissions.`);
            }
        });
    }
};
const handleDeleteUser = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!interaction.isChatInputCommand()) {
        return interaction.reply('An error has occurred. Please try again.');
    }
    const userIdToDelete = (_a = interaction.options.get('userid')) === null || _a === void 0 ? void 0 : _a.value;
    if (userIdToDelete && pointsManager_1.usersPoints[userIdToDelete]) {
        const userNameToDelete = pointsManager_1.usersPoints[userIdToDelete].name;
        delete pointsManager_1.usersPoints[userIdToDelete];
        yield (0, pointsManager_1.savePoints)();
        yield interaction.reply({
            content: `The user **${userNameToDelete}** (${userIdToDelete}) has been deleted.`,
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        (0, log_1.log)(`INFO: User ${userNameToDelete} (${userIdToDelete}) has been deleted by a BetManager.`);
    }
    else {
        yield interaction.reply({
            content: 'User no found',
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        (0, log_1.log)(`WARN: Attempt to delete non-existent user ID: ${userIdToDelete}`);
    }
});
