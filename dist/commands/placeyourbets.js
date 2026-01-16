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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBetModal = exports.handleBetSelection = exports.command = exports.bettingOpen = exports.currentBets = exports.player2Name = exports.player1Name = void 0;
exports.setPlayerNames = setPlayerNames;
exports.setCurrentBets = setCurrentBets;
exports.setBettingOpen = setBettingOpen;
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_2 = require("discord.js");
const log_1 = require("../utils/log");
const pointsManager_1 = require("../services/pointsManager");
const interactionCreate_1 = require("../events/interactionCreate");
const betyEmoji = process.env.BETTY;
const pointsEmoji = process.env.POINTS;
exports.player1Name = 'Player 1';
exports.player2Name = 'Player 2';
exports.currentBets = {};
exports.bettingOpen = false;
function setPlayerNames(name1, name2) {
    exports.player1Name = name1;
    exports.player2Name = name2;
}
function setCurrentBets(bets) {
    exports.currentBets = bets;
}
function setBettingOpen(isOpen) {
    exports.bettingOpen = isOpen;
}
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('placeyourbets')
        .setDescription('Place your bets! (BetManager only)')
        .addStringOption(option => option.setName('player1name')
        .setDescription('Name of the first player')
        .setRequired(true))
        .addStringOption(option => option.setName('player2name')
        .setDescription('Name of the second player')
        .setRequired(true)),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, interactionCreate_1.hasRole)(process.env.ROLE, interaction.member.roles)) {
                yield interaction.reply({
                    content: `Only users with the role *${process.env.ROLE}* are allowed to use Betty Bet`,
                    flags: discord_js_2.MessageFlags.Ephemeral
                });
                (0, log_1.log)(`WARNING: PlaceYourBets command executed without proper permissions.`);
                return;
            }
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                yield handlePlaceYourBets(interaction);
            }
            else {
                yield interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: discord_js_2.MessageFlags.Ephemeral
                });
                (0, log_1.log)(`WARNING: PlaceYourBets command executed without proper permissions.`);
            }
        });
    }
};
const handlePlaceYourBets = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    exports.bettingOpen = true;
    exports.currentBets = {};
    if (!interaction.isChatInputCommand()) {
        return interaction.reply('An error has occurred. Please try again.');
    }
    const player1Option = interaction.options.get('player1name');
    const player2Option = interaction.options.get('player2name');
    exports.player1Name = player1Option ? player1Option.value : 'Player 1';
    exports.player2Name = player2Option ? player2Option.value : 'Player 2';
    (0, log_1.log)(`Bets are open for ${exports.player1Name} and ${exports.player2Name}`);
    const actionRow = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('bet_player1')
        .setLabel('Bet on ' + exports.player1Name)
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId('bet_player2')
        .setLabel('Bet on ' + exports.player2Name)
        .setStyle(discord_js_1.ButtonStyle.Danger));
    yield interaction.reply({
        content: `## The bets are open!!!\n\nYou have **60 seconds** to choose between **${exports.player1Name}** and **${exports.player2Name}**.\n\n`,
        components: [actionRow]
    });
    (0, log_1.log)(`INFO: Bets are now open for ${exports.player1Name} vs ${exports.player2Name}`);
    const replyMessage = yield interaction.fetchReply();
    const channel = interaction.channel;
    if (channel) {
        channel.send(`${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}`);
    }
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            exports.bettingOpen = false;
            const disabledRow = new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('bet_player1')
                .setLabel('Bet on ' + exports.player1Name)
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setDisabled(true), new discord_js_1.ButtonBuilder()
                .setCustomId('bet_player2')
                .setLabel('Bet on ' + exports.player2Name)
                .setStyle(discord_js_1.ButtonStyle.Danger)
                .setDisabled(true));
            yield replyMessage.edit({
                content: `## Bets are now closed!`,
                components: [disabledRow],
            });
            if (channel) {
                channel.send('*Thanks for the money!*');
            }
            (0, log_1.log)('INFO: Bets are now closed.');
        }
        catch (error) {
            (0, log_1.log)(`ERROR: Error closing bets: ${error}`);
        }
    }), 60000);
});
const handleBetSelection = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (!['bet_player1', 'bet_player2'].includes(interaction.customId))
        return;
    if (!exports.bettingOpen) {
        yield interaction.reply({
            content: 'Bets are now closed.',
            flags: discord_js_2.MessageFlags.Ephemeral,
        });
        return;
    }
    const userId = interaction.user.id;
    const customId = interaction.customId;
    if (!pointsManager_1.usersPoints[userId]) {
        yield interaction.reply({
            content: 'You are not registered yet. Use */register* to register.',
            flags: discord_js_2.MessageFlags.Ephemeral,
        });
        return;
    }
    if (exports.currentBets[userId] && exports.currentBets[userId].betOn !== customId) {
        yield interaction.reply({
            content: 'You have already placed a bet on the other player.',
            flags: discord_js_2.MessageFlags.Ephemeral,
        });
        return;
    }
    if (exports.currentBets[userId]) {
        yield interaction.reply({
            content: 'You have already placed a bet on this player.',
            flags: discord_js_2.MessageFlags.Ephemeral,
        });
        return;
    }
    const playerName = customId === 'bet_player1' ? exports.player1Name : exports.player2Name;
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId(`bet_modal_${customId}`)
        .setTitle(`Bet on ${playerName}`);
    const betAmountInput = new discord_js_1.TextInputBuilder()
        .setCustomId('bet_amount')
        .setLabel(`You have ${pointsManager_1.usersPoints[userId].points} ! Enter your bet amount`)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setPlaceholder('e.g. 100')
        .setRequired(true);
    const row = new discord_js_1.ActionRowBuilder().addComponents(betAmountInput);
    modal.addComponents(row);
    yield interaction.showModal(modal);
    (0, log_1.log)(`INFO: User ${interaction.user.displayName} is placing a bet on ${playerName}`);
});
exports.handleBetSelection = handleBetSelection;
const handleBetModal = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = interaction.user.id;
        const betAmountStr = interaction.fields.getTextInputValue('bet_amount');
        if (!/^\d+$/.test(betAmountStr)) {
            yield interaction.reply({
                content: 'Invalid input. Please enter only numbers.',
                flags: discord_js_2.MessageFlags.Ephemeral,
            });
            return;
        }
        const betAmount = parseInt(betAmountStr);
        if (betAmount <= 0) {
            yield interaction.reply({
                content: 'Invalid bet amount. Please enter a positive number.',
                flags: discord_js_2.MessageFlags.Ephemeral,
            });
            return;
        }
        const customId = interaction.customId.replace('bet_modal_', '');
        const chosenPlayerName = customId === 'bet_player1' ? exports.player1Name : exports.player2Name;
        if (!pointsManager_1.usersPoints[userId]) {
            yield interaction.reply({
                content: 'You are not registered yet. Use */register* to register.',
                flags: discord_js_2.MessageFlags.Ephemeral,
            });
            return;
        }
        if (pointsManager_1.usersPoints[userId].points < betAmount) {
            yield interaction.reply({
                content: `${pointsEmoji} Not enough points. Try a lower amount.`,
                flags: discord_js_2.MessageFlags.Ephemeral,
            });
            return;
        }
        pointsManager_1.usersPoints[userId].points -= betAmount;
        exports.currentBets[userId] = { amount: betAmount, betOn: customId };
        pointsManager_1.usersPoints[userId].betHistory.push({
            betOn: chosenPlayerName,
            amount: betAmount,
            result: 'pending',
            date: new Date(),
        });
        yield (0, pointsManager_1.savePoints)();
        yield interaction.reply({
            content: `You successfully placed a bet of **${betAmount}** ${pointsEmoji} on **${chosenPlayerName}**!`,
            flags: discord_js_2.MessageFlags.Ephemeral,
        });
        (0, log_1.log)(`INFO: User ${interaction.user.displayName} placed a bet of ${betAmount} on ${chosenPlayerName}`);
        (0, log_1.log)(`INFO: Current Bets: ${JSON.stringify(exports.currentBets)}`);
    }
    catch (error) {
        console.error('Error in handleBetModal:', error);
        yield interaction.reply({
            content: 'An error occurred while processing your bet. Please try again.',
            flags: discord_js_2.MessageFlags.Ephemeral,
        });
        (0, log_1.log)(`ERROR: Error in handleBetModal: ${error}`);
    }
});
exports.handleBetModal = handleBetModal;
