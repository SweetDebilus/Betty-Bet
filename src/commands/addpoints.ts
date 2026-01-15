import { GuildMember, SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, GuildMemberRoleManager, CommandInteraction } from 'discord.js';
import { usersPoints, savePoints, addToDebilusCloset } from '../services/pointsManager';
import { hasRole } from '../events/interactionCreate';
import { log } from 'console';

const pointsEmoji = process.env.POINTS!;
const bettyBettId = process.env.BETTYID!;

export const command = {
    data: new SlashCommandBuilder() 
        .setName('addpoints')
        .setDescription('Add points to a user. (BetManager only)') 
        .addUserOption(option => 
            option.setName('user') 
                .setDescription('User to add points to') 
                .setRequired(true)) 
        .addIntegerOption(option => 
            option.setName('points') 
                .setDescription('Number of points to add') 
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        if (hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await handleAddPoints(interaction);
        } else {
            await interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                flags: MessageFlags.Ephemeral 
            });
            log(`ERROR: AddPoints command executed without proper permissions.`);
        }
    }
};

const handleAddPoints = async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) {
        log(`ERROR: AddPoints command executed but interaction is not a chat input command.`);
        return interaction.reply('An error has occurred. Please try again.');
    }
    const userOption = interaction.options.get('user');
    const pointsOption = interaction.options.get('points');

    const userId = userOption?.value as string;
    const pointsToAdd = pointsOption?.value as number;

    if (userId == bettyBettId) {
        addToDebilusCloset(pointsToAdd);
        await interaction.reply({ 
            content: `**${pointsToAdd}** points have been added to DebilusCloset.`, 
            flags: MessageFlags.Ephemeral 
        });
        log(`INFO: Points added to DebilusCloset.`);
        await savePoints();
        return;
    }

    if (!usersPoints[userId]) {
        await interaction.reply({ 
            content: `User with id ${userId} is not registered`, 
            flags: MessageFlags.Ephemeral 
        });
        log(`WARN: Attempt to add points to non-registered user ID: ${userId}`);
        return;
    }

    usersPoints[userId].points += pointsToAdd;
    usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
    await savePoints();
    await interaction.reply({ 
        content: `**${pointsToAdd}** ${pointsEmoji} Points have been added to **${usersPoints[userId].name}**.`, 
        flags: MessageFlags.Ephemeral 
    });
    log(`INFO: ${pointsToAdd} points added to user ID: ${userId}`);
};