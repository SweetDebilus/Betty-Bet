"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.handleClaimYesNo = exports.formatDate = exports.sendNotification = void 0;
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv_1.default.config();
const log_1 = require("../utils/log");
const pointsManager_1 = require("./pointsManager");
const index_1 = require("../index");
const notificationsFile = 'notifications.json';
const pointsEmoji = process.env.POINTS;
const loadNotificationData = () => {
    if (!fs.existsSync(notificationsFile))
        return {};
    return JSON.parse(fs.readFileSync(notificationsFile, 'utf-8'));
};
const saveNotificationData = (data) => {
    fs.writeFileSync(notificationsFile, JSON.stringify(data, null, 2));
};
const hasBeenNotifiedRecently = (userId) => {
    const data = loadNotificationData();
    const lastNotification = data[userId] || 0;
    return Date.now() - lastNotification < 12 * 60 * 60 * 1000; // 12 heures
};
const removeNotificationEntry = (userId) => {
    const data = loadNotificationData();
    if (data[userId]) {
        delete data[userId];
        saveNotificationData(data);
        (0, log_1.log)(`INFO: User ${userId} removed from notification tracking.`);
    }
};
const sendNotification = (userId, points) => __awaiter(void 0, void 0, void 0, function* () {
    if (hasBeenNotifiedRecently(userId)) {
        (0, log_1.log)(`INFO: Skipping notification for user ${userId}, already notified recently.`);
        return;
    }
    const user = yield index_1.client.users.fetch(userId);
    if (user && pointsManager_1.usersPoints[userId].notificationsEnabled) {
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('claim_yes')
            .setLabel('Yes')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId('claim_no')
            .setLabel('No')
            .setStyle(discord_js_1.ButtonStyle.Danger));
        try {
            yield user.send({
                content: `You have ${points} out of 15 points. Do you want to claim them?`,
                components: [row]
            });
            (0, log_1.log)(`INFO: Notification sent successfully to user ${userId} for ${points} points.`);
            const data = loadNotificationData();
            data[userId] = Date.now();
            saveNotificationData(data);
        }
        catch (error) {
            (0, log_1.log)(`ERROR: sending notification to user ${userId}: ${error}`);
        }
    }
});
exports.sendNotification = sendNotification;
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`;
};
exports.formatDate = formatDate;
const handleClaimYesNo = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (!interaction.isButton())
        return;
    if (!['claim_yes', 'claim_no'].includes(interaction.customId))
        return;
    const userId = interaction.user.id;
    if (!pointsManager_1.usersPoints[userId]) {
        if (!interaction.replied) {
            yield interaction.reply({
                content: 'You are not registered yet. Use `/register` to sign up.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
        }
        return;
    }
    if (interaction.customId === 'claim_yes') {
        const pointsToClaim = pointsManager_1.usersPoints[userId].inventory;
        pointsManager_1.usersPoints[userId].points += pointsToClaim;
        pointsManager_1.usersPoints[userId].inventory = 0;
        yield (0, pointsManager_1.savePoints)();
        removeNotificationEntry(userId);
        if (!interaction.replied) {
            yield interaction.update({
                content: `You have claimed **${pointsToClaim}** ${pointsEmoji}.\n\nYou now have **${pointsManager_1.usersPoints[userId].points}** ${pointsEmoji}`,
                components: []
            });
        }
    }
    else if (interaction.customId === 'claim_no') {
        if (!interaction.replied) {
            yield interaction.update({
                content: 'You have chosen not to claim your points at this time.',
                components: []
            });
        }
    }
    else {
        if (!interaction.replied) {
            yield interaction.update({
                content: 'Invalid selection.',
                components: []
            });
        }
    }
});
exports.handleClaimYesNo = handleClaimYesNo;
