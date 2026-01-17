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
exports.hasRole = void 0;
const discord_js_1 = require("discord.js");
const index_1 = require("../index"); // ou depuis ton module de commandes
const notification_1 = require("../services/notification");
const placeyourbets_1 = require("../commands/placeyourbets");
const blackjack_1 = require("../commands/blackjack");
const higherlower_1 = require("../commands/higherlower");
const win_1 = require("../commands/win");
const log_1 = require("../utils/log");
let maintenanceMode = false;
const hasRole = (roleName, roles) => roles.cache.some(role => role.name === roleName);
exports.hasRole = hasRole;
exports.default = {
    name: 'interactionCreate',
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            // --- SLASH COMMANDS ---
            if (interaction.isChatInputCommand()) {
                const member = interaction.member;
                if (!member) {
                    yield interaction.reply('An error has occurred. Unable to verify user roles.');
                    (0, log_1.log)(`ERROR: interactionCreate event - member not found in interaction.`);
                    return;
                }
                const command = index_1.commands.get(interaction.commandName);
                (0, log_1.log)(`DEBUG: Slash command interaction received: ${interaction.commandName}`);
                if (!command)
                    return;
                try {
                    yield command.execute(interaction);
                }
                catch (error) {
                    console.error(error);
                    yield interaction.reply({
                        content: 'There was an error executing this command.',
                        ephemeral: true
                    });
                    (0, log_1.log)(`ERROR: Error executing command ${interaction.commandName}: ${error}`);
                }
                const roles = member.roles;
                const hasRole = (roleName) => roles.cache.some(role => role.name === roleName);
                if (!hasRole(process.env.ROLE)) {
                    yield interaction.reply({
                        content: `Only users with the role *${process.env.ROLE}* are allowed to use Betty Bet`,
                        flags: discord_js_1.MessageFlags.Ephemeral
                    });
                    (0, log_1.log)('INFO: Command attempt by user without required role.');
                    return;
                }
                if (maintenanceMode && !hasRole('BetManager')) {
                    yield interaction.reply({
                        content: 'Betty Bet is currently in maintenance mode. Please try again later.',
                        flags: discord_js_1.MessageFlags.Ephemeral
                    });
                    (0, log_1.log)('INFO: Command attempt during maintenance mode by non-BetManager.');
                    return;
                }
                return;
            }
            // --- BUTTONS ---
            if (interaction.isButton()) {
                const id = interaction.customId;
                (0, log_1.log)(`DEBUG: Button interaction received with customId: ${id}`);
                switch (true) {
                    case id.startsWith('claim_'):
                        return (0, notification_1.handleClaimYesNo)(interaction);
                    case id.startsWith('bet_'):
                        return (0, placeyourbets_1.handleBetSelection)(interaction);
                    case id.startsWith('blackjack_'):
                        return (0, blackjack_1.handleBlackjackInteraction)(interaction);
                    case id.startsWith('highlow_'):
                        return (0, higherlower_1.handleHighLowButton)(interaction);
                    default:
                        return;
                }
            }
            // --- MODALS ---
            if (interaction.isModalSubmit()) {
                yield (0, placeyourbets_1.handleBetModal)(interaction);
                (0, log_1.log)(`DEBUG: Modal interaction received with customId: ${interaction.customId}`);
                return;
            }
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'win_select') {
                    const winnerValue = interaction.values[0]; // '1' ou '2'
                    const winningKey = winnerValue === '1' ? 'bet_player1' : 'bet_player2';
                    yield (0, win_1.handleWin)(interaction, winningKey);
                }
            }
        });
    }
};
