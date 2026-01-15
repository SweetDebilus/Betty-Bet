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
const console_1 = require("console");
const pointsEmoji = process.env.POINTS;
const bettyBettId = process.env.BETTYID;
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('addpoints')
        .setDescription('Add points to a user. (BetManager only)')
        .addUserOption(option => option.setName('user')
        .setDescription('User to add points to')
        .setRequired(true))
        .addIntegerOption(option => option.setName('points')
        .setDescription('Number of points to add')
        .setRequired(true)),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                yield handleAddPoints(interaction);
            }
            else {
                yield interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                (0, console_1.log)(`ERROR: AddPoints command executed without proper permissions.`);
            }
        });
    }
};
const handleAddPoints = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (!interaction.isChatInputCommand()) {
        (0, console_1.log)(`ERROR: AddPoints command executed but interaction is not a chat input command.`);
        return interaction.reply('An error has occurred. Please try again.');
    }
    const userOption = interaction.options.get('user');
    const pointsOption = interaction.options.get('points');
    const userId = userOption === null || userOption === void 0 ? void 0 : userOption.value;
    const pointsToAdd = pointsOption === null || pointsOption === void 0 ? void 0 : pointsOption.value;
    if (userId == bettyBettId) {
        (0, pointsManager_1.addToDebilusCloset)(pointsToAdd);
        yield interaction.reply({
            content: `**${pointsToAdd}** points have been added to DebilusCloset.`,
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        (0, console_1.log)(`INFO: Points added to DebilusCloset.`);
        yield (0, pointsManager_1.savePoints)();
        return;
    }
    if (!pointsManager_1.usersPoints[userId]) {
        yield interaction.reply({
            content: `User with id ${userId} is not registered`,
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        (0, console_1.log)(`WARN: Attempt to add points to non-registered user ID: ${userId}`);
        return;
    }
    pointsManager_1.usersPoints[userId].points += pointsToAdd;
    pointsManager_1.usersPoints[userId].isDebilus = pointsManager_1.usersPoints[userId].points <= 0;
    yield (0, pointsManager_1.savePoints)();
    yield interaction.reply({
        content: `**${pointsToAdd}** ${pointsEmoji} Points have been added to **${pointsManager_1.usersPoints[userId].name}**.`,
        flags: discord_js_1.MessageFlags.Ephemeral
    });
    (0, console_1.log)(`INFO: ${pointsToAdd} points added to user ID: ${userId}`);
});
