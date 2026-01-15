import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, CommandInteraction, GuildMember, GuildMemberRoleManager } from 'discord.js';
import { usersPoints } from '../services/pointsManager';
import { hasRole } from '../events/interactionCreate';
import { log } from '../utils/log';

export const command = {
    data: new SlashCommandBuilder()
        .setName('leaderboard') 
        .setDescription('Show leaderboard of top betters. (BetManager only)'),
    async execute(interaction: ChatInputCommandInteraction) {
        if (hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await handleLeaderboard(interaction);
        } else {
            await interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                flags: MessageFlags.Ephemeral 
            });
            log(`ERROR: Leaderboard command executed without proper permissions.`);
        }   
    }
};

const handleLeaderboard = async (interaction: CommandInteraction) => {

    const sortedUsers = Object.entries(usersPoints).sort((a, b) => b[1].points - a[1].points);
    const top20 = sortedUsers.slice(0, 20);

    const rankWidth = 6; 
    const nameWidth = 32; 
    const pointsWidth = 10; 
    const winsWidth = 8; 
    const lossesWidth = 8; 

    const leaderboard = top20.map(([userId, userInfo], index) => {
        const userName = userInfo.name.padEnd(nameWidth, ' ');
        const userPoints = userInfo.points.toString().padStart(pointsWidth, ' ');
        const userWins = userInfo.wins.toString().padStart(winsWidth, ' ');
        const userLosses = userInfo.losses.toString().padStart(lossesWidth, ' ');

        return `${(index + 1).toString().padStart(rankWidth, ' ')} ${userName} ${userPoints} ${userWins} ${userLosses}`;
    }).join('\n');

    await interaction.reply(
        `**Ranking of the best bettors:**\n\n\`\`\`Rank   Name                                  Points     Wins      Losses\n${leaderboard}\`\`\``
    );
    log(`INFO: Leaderboard command executed successfully.`);
};