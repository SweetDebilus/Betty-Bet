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
exports.handleHighLowButton = exports.command = void 0;
const discord_js_1 = require("discord.js");
const pointsManager_1 = require("../services/pointsManager");
const log_1 = require("../utils/log");
const pointsEmoji = process.env.POINTS;
const highlowGames = {};
const debilus = process.env.DEBILUS;
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('higherlower')
        .setDescription('Play a game of Higher or Lower'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = interaction.user.id;
            if (!pointsManager_1.usersPoints[userId]) {
                yield interaction.reply({
                    content: 'You are not registered yet. Use `/register` to sign up.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                (0, log_1.log)(`WARN: Unregistered user ${userId} attempted to start High-Low game.`);
                return;
            }
            if (pointsManager_1.usersPoints[userId].points < 40) {
                yield interaction.reply({
                    content: 'You do not have enough points to play this game.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                (0, log_1.log)(`WARN: User ${userId} attempted to start High-Low game with insufficient points.`);
                return;
            }
            yield handleHighLow(interaction);
        });
    }
};
const handleHighLow = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    let randomCardVisible = Math.floor(Math.random() * 9) + 1;
    let randomCardHidden = Math.floor(Math.random() * 9) + 1;
    while (randomCardVisible === randomCardHidden) {
        randomCardHidden = Math.floor(Math.random() * 9) + 1;
    }
    highlowGames[userId] = {
        visibleCard: randomCardVisible,
        hiddenCard: randomCardHidden,
    };
    const createHighLowActionRow = () => {
        return new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('highlow_higher')
            .setLabel('Higher')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId('highlow_lower')
            .setLabel('Lower')
            .setStyle(discord_js_1.ButtonStyle.Danger));
    };
    // Message initial du jeu
    yield interaction.reply({
        content: `# High-Low Game\n\n## |${randomCardVisible}| |?|\n\nDo you think the hidden card is higher or lower?`,
        components: [createHighLowActionRow()],
        flags: discord_js_1.MessageFlags.Ephemeral,
    });
    pointsManager_1.usersPoints[userId].points -= 40;
    pointsManager_1.usersPoints[userId].isDebilus = pointsManager_1.usersPoints[userId].points <= 0;
    yield (0, pointsManager_1.savePoints)();
    (0, log_1.log)(`INFO: User ${userId} started a High-Low game. 40 points deducted for playing.`);
});
const handleHighLowButton = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    const customId = interaction.customId;
    if (!highlowGames[userId]) {
        yield interaction.reply({ content: 'No active game found. Please start a new game using the High-Low command.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const { visibleCard, hiddenCard } = highlowGames[userId];
    let resultMessage;
    const calculateReward = (visibleCard) => {
        if (visibleCard <= 2 || visibleCard >= 8) {
            return 48;
        }
        else if (visibleCard >= 4 && visibleCard <= 6) {
            return 60;
        }
        else {
            return 50;
        }
    };
    const reward = calculateReward(visibleCard);
    if (customId === 'highlow_higher') {
        if (hiddenCard > visibleCard) {
            pointsManager_1.usersPoints[userId].points += reward;
            pointsManager_1.usersPoints[userId].isDebilus = pointsManager_1.usersPoints[userId].points <= 0;
            yield (0, pointsManager_1.savePoints)();
            resultMessage = `**Congratulations!** The hidden card **|${hiddenCard}|** is higher than **|${visibleCard}|**.\n\nYou have **${pointsManager_1.usersPoints[userId].points}${pointsEmoji}** !`;
        }
        else {
            resultMessage = `**Sorry**, the hidden card **|${hiddenCard}|** is not higher than **|${visibleCard}|**.\n\nYou have **${pointsManager_1.usersPoints[userId].points}${pointsEmoji}** !`;
        }
    }
    else if (customId === 'highlow_lower') {
        if (hiddenCard < visibleCard) {
            pointsManager_1.usersPoints[userId].points += reward;
            pointsManager_1.usersPoints[userId].isDebilus = pointsManager_1.usersPoints[userId].points <= 0;
            yield (0, pointsManager_1.savePoints)();
            resultMessage = `**Congratulations!** The hidden card **|${hiddenCard}|** is lower than **|${visibleCard}|**.\n\nYou have **${pointsManager_1.usersPoints[userId].points}${pointsEmoji}** !`;
        }
        else {
            resultMessage = `**Sorry**, the hidden card **|${hiddenCard}|** is not lower than **|${visibleCard}|**.\n\nYou have **${pointsManager_1.usersPoints[userId].points}${pointsEmoji}** !`;
        }
    }
    if (pointsManager_1.usersPoints[userId].isDebilus) {
        resultMessage += `\n\nYou have ${pointsManager_1.usersPoints[userId].points}${pointsEmoji} ! You're now a Debilus. Play wisely next time! ${debilus}`;
    }
    yield interaction.update({
        content: `# High-Low Game\n\n## |${visibleCard}| |${hiddenCard}|\n\n` + resultMessage,
        components: [],
    });
    delete highlowGames[userId];
    (0, log_1.log)(`INFO: User ${userId} has finished the game: high-low`);
});
exports.handleHighLowButton = handleHighLowButton;
