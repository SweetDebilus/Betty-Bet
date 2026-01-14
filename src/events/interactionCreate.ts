import { GuildMember, Interaction, GuildMemberRoleManager, MessageFlags } from 'discord.js';
import { commands } from '../index'; // ou depuis ton module de commandes
import { handleClaimYesNo } from '../services/notification';
import { handleBetSelection, handleBetModal } from '../commands/placeyourbets';
import { handleBlackjackInteraction } from '../commands/blackjack';

let maintenanceMode: boolean = false;
export const hasRole = (roleName: string, roles: GuildMemberRoleManager) => roles.cache.some(role => role.name === roleName);

export default {
    name: 'interactionCreate',
    async execute(interaction: Interaction) {

        // --- SLASH COMMANDS ---
        if (interaction.isChatInputCommand()) {

            const member = interaction.member as GuildMember;
            if (!member) {
                await interaction.reply('An error has occurred. Unable to verify user roles.');
                return;
            }

            const command = commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: 'There was an error executing this command.',
                    ephemeral: true
                });
            }

            const roles = member.roles as GuildMemberRoleManager;
            const hasRole = (roleName: string) =>
                roles.cache.some(role => role.name === roleName);

            if (!hasRole(process.env.ROLE!)) {
                await interaction.reply({
                    content: `Only users with the role *${process.env.ROLE}* are allowed to use Betty Bet`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            if (maintenanceMode && !hasRole('BetManager')) {
                await interaction.reply({
                    content: 'Betty Bet is currently in maintenance mode. Please try again later.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            return;
        }

        // --- BUTTONS ---
        if (interaction.isButton()) {
            const id = interaction.customId;

            switch (true) {
                case id.startsWith('claim_'):
                    return handleClaimYesNo(interaction);

                case id.startsWith('bet_'):
                    return handleBetSelection(interaction);

                case id.startsWith('blackjack_'):
                    return handleBlackjackInteraction(interaction);

                default:
                    return;
            }
        }

        // --- MODALS ---
        if (interaction.isModalSubmit()) {
            await handleBetModal(interaction);
            return;
        }
    }
};