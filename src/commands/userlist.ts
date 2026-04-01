import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, GuildMemberRoleManager, GuildMember } from 'discord.js';
import { usersPoints } from '../services/pointsManager';
import { log } from '../utils/log';
import { hasRole } from '../events/interactionCreate';

export const command = {
    data: new SlashCommandBuilder() 
        .setName('userlist') 
        .setDescription('List all registered users and their points (BetManager only).'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await handleUserList(interaction);
        } else {
            await interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                flags: MessageFlags.Ephemeral 
            });
            log(`WARNING: Userlist command executed without proper permissions.`);
        }
    }
};

const handleUserList = async (interaction: ChatInputCommandInteraction) => {
    const userList = Object.entries(usersPoints).map(([userId, userInfo]) => {
        return `- ${userInfo.name}`;
    }).join('\n');
    const userNumber = Object.keys(usersPoints).length;
    await interaction.reply(
        `**${userNumber} Users registered:**\n\n${userList}`
    );
    log(`INFO: Userlist command executed successfully.`);
};