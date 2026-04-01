import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, MessageFlags } from 'discord.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();
import { log } from '../utils/log';
import { usersPoints, savePoints } from './pointsManager';
import { client } from '../index';

const notificationsFile = 'notifications.json';
const pointsEmoji = process.env.POINTS!;

interface NotificationsData {
    [userId: string]: number;
}

const loadNotificationData = (): NotificationsData => {
    if (!fs.existsSync(notificationsFile)) return {};
    return JSON.parse(fs.readFileSync(notificationsFile, 'utf-8'));
};

const saveNotificationData = (data: NotificationsData) => {
    fs.writeFileSync(notificationsFile, JSON.stringify(data, null, 2));
};

const hasBeenNotifiedRecently = (userId: string): boolean => {
    const data = loadNotificationData();
    const lastNotification = data[userId] || 0;
  return Date.now() - lastNotification < 12 * 60 * 60 * 1000; // 12 heures
};

const removeNotificationEntry = (userId: string) => {
    const data = loadNotificationData();

    if (data[userId]) {
        delete data[userId]; 
        saveNotificationData(data);
        log(`INFO: User ${userId} removed from notification tracking.`);
    }
};

export const sendNotification = async (userId: string, points: number) => {
    if (hasBeenNotifiedRecently(userId)) {
        log(`INFO: Skipping notification for user ${userId}, already notified recently.`);
        return;
    }

    const user = await client.users.fetch(userId);
    
    if (user && usersPoints[userId].notificationsEnabled) {
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                .setCustomId('claim_yes')
                .setLabel('Yes')
                .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                .setCustomId('claim_no')
                .setLabel('No')
                .setStyle(ButtonStyle.Danger)
            );

        try {
            await user.send({
                content: `You have ${points} out of 15 points. Do you want to claim them?`,
                components: [row]
            });

            log(`INFO: Notification sent successfully to user ${userId} for ${points} points.`);

            const data = loadNotificationData();
            data[userId] = Date.now();
            saveNotificationData(data);
        } catch (error) {
            log(`ERROR: sending notification to user ${userId}: ${error}`);
        }
    }
};

export const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`;
};

export const handleClaimYesNo = async (interaction: ButtonInteraction) => {
    if (!interaction.isButton()) return; 
    if (!['claim_yes', 'claim_no'].includes(interaction.customId)) return;
    const userId = interaction.user.id;
    
    if (!usersPoints[userId]) {
        if (!interaction.replied) {
            await interaction.reply({ 
                content: 'You are not registered yet. Use `/register` to sign up.', 
                flags: MessageFlags.Ephemeral 
            });
        }
        return;
    }

    if (interaction.customId === 'claim_yes') {
        const pointsToClaim = usersPoints[userId].inventory;
        usersPoints[userId].points += pointsToClaim;
        usersPoints[userId].inventory = 0;
        await savePoints();

        removeNotificationEntry(userId);

        if (!interaction.replied) {
            await interaction.update({ 
                content: `You have claimed **${pointsToClaim}** ${pointsEmoji}.\n\nYou now have **${usersPoints[userId].points}** ${pointsEmoji}`, 
                components: [] 
            });
        }
    } else if (interaction.customId === 'claim_no') {
        if (!interaction.replied) {
            await interaction.update({ 
                content: 'You have chosen not to claim your points at this time.', 
                components: [] 
            });
        }
    } else {
        if (!interaction.replied) {
            await interaction.update({ 
                content: 'Invalid selection.', 
                components: [] 
            });
        }
    }
};