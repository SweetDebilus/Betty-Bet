import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, MessageFlags, CommandInteraction } from 'discord.js';
import { savePoints, usersPoints } from '../services/pointsManager';
import { hasRole } from '../events/interactionCreate';
import { log } from '../utils/log';

export const command = {
    data: new SlashCommandBuilder() 
        .setName('deleteuser') 
        .setDescription('Delete a registered user. (BetManager only)'),
    async execute(interaction: ChatInputCommandInteraction) {
        if (hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await handleDeleteUser(interaction);
        } else {
            await interaction.reply({ 
                content: 'You do not have permission to use this command.',
                flags: MessageFlags.Ephemeral 
            });
            log(`ERROR: DeleteUser command executed without proper permissions.`);
        }
    }
};

const handleDeleteUser = async (interaction: CommandInteraction) => {

    if (!interaction.isChatInputCommand()) {
        return interaction.reply('An error has occurred. Please try again.');
    }
    const userIdToDelete = interaction.options.get('userid')?.value as string;
    
    if (userIdToDelete && usersPoints[userIdToDelete]) {
        const userNameToDelete = usersPoints[userIdToDelete].name;
        delete usersPoints[userIdToDelete];
        await savePoints();
        await interaction.reply({ 
            content: `The user **${userNameToDelete}** (${userIdToDelete}) has been deleted.`,
            flags: MessageFlags.Ephemeral 
        });
        log(`INFO: User ${userNameToDelete} (${userIdToDelete}) has been deleted by a BetManager.`);
    } else {
        await interaction.reply({ 
            content: 'User no found', 
            flags: MessageFlags.Ephemeral
        });
        log(`WARN: Attempt to delete non-existent user ID: ${userIdToDelete}`);
    }
};