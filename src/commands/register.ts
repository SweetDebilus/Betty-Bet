import { GuildMember, SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { usersPoints, savePoints } from '../services/pointsManager';
import { log } from '../utils/log';

const pointsEmoji = process.env.POINTS!;
const debilus = process.env.DEBILUS!;

export const command = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register to get initial points'),

    async execute(interaction: ChatInputCommandInteraction) {
        const userId = interaction.user.id;
        const member = interaction.member as GuildMember;
        const userName = member.nickname || interaction.user.displayName;

        if (usersPoints[userId]) {
            await interaction.reply({
                content:`You are already registered.\n\n\n*Debilus* ${debilus}`, 
                flags: MessageFlags.Ephemeral
            });
            log(`INFO: User ${userId} attempted to register but is already registered.`);
            return;
        }

        usersPoints[userId] = { 
            points: 100, 
            name: userName, 
            wins:0, 
            losses:0, 
            isDebilus:false, 
            inventory:0, 
            notificationsEnabled: false, 
            betHistory: [], 
            inventoryShop: [], 
            winMatch:0, 
            loseMatch:0 
        };

        await savePoints();
        await interaction.reply({
            content:`Registration successful!\n\nYou have received **100 ${pointsEmoji}** !!!\n\n **Optional**: This bot integrates a notification system, you can activate it by doing the command \`/togglenotification\` and Betty Bet will send you a DM when you reach 10 points in your inventory.`, 
            flags: MessageFlags.Ephemeral
        });
        log(`INFO: User ${userId} registered successfully.`);
    }
};
