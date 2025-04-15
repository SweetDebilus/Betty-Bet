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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_schedule_1 = __importDefault(require("node-schedule"));
dotenv_1.default.config();
const crypto_1 = __importDefault(require("crypto"));
const discord_js_2 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const algorithm = process.env.ALGO;
const secretKey = Buffer.from(process.env.KEY, 'hex');
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers
    ]
});
const pointsEmoji = process.env.POINTS;
const betyEmoji = process.env.BETTY;
const debilus = process.env.DEBILUS;
const debcoins = process.env.DEBCOIN;
const bettyBettId = process.env.BETTYID;
const logFile = process.env.PATHLOG;
const restricted = false;
const filePath = 'usersPoints.json';
let maintenanceMode = false;
let debilusCloset = 0;
let player1Name;
let player2Name;
let usersPoints = {};
let currentBets = {};
let store = {};
let purchaseHistory = {};
let bettingOpen = false;
let tournamentParticipants = new Map();
let lastUpdateTime = new Date();
const blackjackGames = {};
const highlowGames = {};
const cardValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 10, 'Q': 10, 'K': 10, 'A': 11
};
const suits = ['♠️', '♥️', '♦️', '♣️'];
const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const drawCard = () => {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const card = cards[Math.floor(Math.random() * cards.length)];
    return `${card}${suit}`;
};
const calculateHandValue = (hand) => {
    let value = 0;
    let aces = 0;
    hand.forEach(card => {
        const match = card.match(/[0-9]+|[JQKA]/); // Extrait la valeur de la carte (2, 3, ..., A)
        const cardValue = match ? match[0] : null;
        if (cardValue) {
            value += cardValues[cardValue];
            if (cardValue === 'A')
                aces++;
        }
        else {
            console.error(`Invalid card value: ${card}`);
        }
    });
    while (value > 21 && aces) {
        value -= 10;
        aces--;
    }
    return value;
};
const startBlackjackGame = (userId, bet) => {
    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];
    blackjackGames[userId] = { playerHand, dealerHand, bet };
    return {
        playerHand,
        dealerHand
    };
};
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`;
};
// Fonction pour créer le dossier si nécessaire 
const ensureLogDirectoryExists = (filePath) => {
    const logDir = path.dirname(filePath);
    if (!fs_1.default.existsSync(logDir)) {
        fs_1.default.mkdirSync(logDir, { recursive: true });
    }
};
// Appeler la fonction pour s'assurer que le dossier existe 
ensureLogDirectoryExists(logFile);
const log = (message) => {
    fs_1.default.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
};
const encrypt = (text) => {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};
const decrypt = (hash) => {
    if (!hash || !hash.iv || !hash.content) {
        throw new Error('Invalid data to decrypt');
    }
    const iv = Buffer.from(hash.iv, 'hex');
    const decipher = crypto_1.default.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrypted.toString();
};
const createDataDebilusDir = () => {
    if (!fs.existsSync('DataDebilus')) {
        fs.mkdirSync('DataDebilus');
    }
};
const saveDecryptedBackup = () => {
    try {
        createDataDebilusDir();
        const data = {
            usersPoints,
            debilusCloset,
            store,
            purchaseHistory,
            lastUpdateTime: lastUpdateTime.toISOString()
        };
        fs.writeFileSync('DataDebilus/decrypted_backup.json', JSON.stringify(data, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité
    }
    catch (error) {
        log(`Error saving points: ${error}`);
    }
};
const saveTournamentParticipants = () => __awaiter(void 0, void 0, void 0, function* () {
    const participantsArray = Array.from(tournamentParticipants);
    fs.writeFileSync('DataDebilus/tournamentParticipants.json', JSON.stringify(participantsArray, null, 2));
    log("Tournament participants data saved.");
});
const loadTournamentParticipants = () => __awaiter(void 0, void 0, void 0, function* () {
    if (fs.existsSync('DataDebilus/tournamentParticipants.json')) {
        const participantsArray = JSON.parse(fs.readFileSync('DataDebilus/tournamentParticipants.json', 'utf-8'));
        tournamentParticipants = new Map(participantsArray);
        log("Tournament participants data loaded.");
    }
});
const loadPoints = () => __awaiter(void 0, void 0, void 0, function* () {
    if (fs.existsSync(filePath)) {
        try {
            const encryptedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const decryptedData = JSON.parse(decrypt(encryptedData));
            usersPoints = decryptedData.usersPoints || {};
            debilusCloset = decryptedData.debilusCloset || 0;
            store = decryptedData.store || {};
            purchaseHistory = decryptedData.purchaseHistory || {};
            lastUpdateTime = new Date(decryptedData.lastUpdateTime || Date.now());
        }
        catch (error) {
            log(`Failed to decrypt data: ${error}`);
        }
    }
});
const savePoints = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = {
        usersPoints,
        debilusCloset,
        store,
        purchaseHistory,
        lastUpdateTime: lastUpdateTime.toISOString()
    };
    const encryptedData = encrypt(JSON.stringify(data));
    fs.writeFileSync(filePath, JSON.stringify(encryptedData, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité
    // Créer un fichier de sauvegarde des données déchiffrées
    saveDecryptedBackup();
});
// Fonction pour ajouter des points à l'inventaire
const addPointsToInventory = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const timeDifference = now.getTime() - lastUpdateTime.getTime();
    const cyclesPassed = Math.floor(timeDifference / (1000 * 60 * 60 * 12)); // Nombre de cycles de 12 heures écoulés
    for (const userId in usersPoints) {
        if (usersPoints[userId].inventory < 15) {
            const potentialNewInventory = usersPoints[userId].inventory + cyclesPassed;
            if (potentialNewInventory > 15) {
                const excessPoints = potentialNewInventory - 15;
                usersPoints[userId].inventory = 15;
                debilusCloset += excessPoints; // Ajouter les points excédentaires au debilusCloset 
            }
            else {
                usersPoints[userId].inventory = potentialNewInventory;
            }
            if (usersPoints[userId].inventory === 10) {
                yield sendNotification(userId, 10); // Notification à 10 points
            }
            else if (usersPoints[userId].inventory === 15) {
                yield sendNotification(userId, 15); // Notification à 15 points
            }
            else {
                debilusCloset += cyclesPassed;
            }
        }
    }
    if (now.getHours() < 12) {
        lastUpdateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    }
    else {
        lastUpdateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    }
    yield savePoints();
});
const sendNotification = (userId, points) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield client.users.fetch(userId);
    if (user && usersPoints[userId].notificationsEnabled) {
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('claim_yes')
            .setLabel('Yes')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId('claim_no')
            .setLabel('No')
            .setStyle(discord_js_1.ButtonStyle.Danger));
        yield user.send({
            content: `You have ${points} out of 15 points. Do you want to claim them?`,
            components: [row]
        });
    }
});
// Planifier la tâche pour qu'elle s'exécute à des heures fixes (12:00 AM et 12:00 PM)
node_schedule_1.default.scheduleJob('0 0 * * *', addPointsToInventory); // Exécute tous les jours à minuit
node_schedule_1.default.scheduleJob('0 12 * * *', addPointsToInventory); // Exécute tous les jours à midi
client.on('rateLimit', (info) => {
    log(`WARNING: Rate limit hit: ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout : 'Unknown timeout '}`);
});
const commands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('register')
        .setDescription('Register to get initial points'),
    new discord_js_1.SlashCommandBuilder()
        .setName('placeyourbets')
        .setDescription('Start a betting period. (BetManager only)')
        .addStringOption(option => option.setName('player1name')
        .setDescription('Name of player 1')
        .setRequired(true))
        .addStringOption(option => option.setName('player2name')
        .setDescription('Name of player 2')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('addpoints')
        .setDescription('Add points to a user. (BetManager only)')
        .addUserOption(option => option.setName('user')
        .setDescription('User to add points to')
        .setRequired(true))
        .addIntegerOption(option => option.setName('points')
        .setDescription('Number of points to add')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('points')
        .setDescription('Check your points'),
    new discord_js_1.SlashCommandBuilder()
        .setName('pointvault')
        .setDescription('Check your Point Vault'),
    new discord_js_1.SlashCommandBuilder()
        .setName('claim')
        .setDescription('Claim your points from Point Vault'),
    new discord_js_1.SlashCommandBuilder()
        .setName('clearbets')
        .setDescription('Clear all bets in case of issues. (BetManager only)'),
    new discord_js_1.SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show leaderboard of top betters. (BetManager only)'),
    new discord_js_1.SlashCommandBuilder()
        .setName('win')
        .setDescription('Declare the winner and redistribute points. (BetManager only)')
        .addIntegerOption(option => option.setName('winner')
        .setDescription('The winning player (1 or 2)')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('betslist')
        .setDescription('View the list of players who bet on player 1 and player 2. (BetManager only)'),
    new discord_js_1.SlashCommandBuilder()
        .setName('deleteuser')
        .setDescription('Delete a registered user. (BetManager only)')
        .addStringOption(option => option.setName('userid')
        .setDescription('ID of the user to delete')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('backup')
        .setDescription('Encrypt and save data from decrypted backup. (BetManager only)'),
    new discord_js_1.SlashCommandBuilder()
        .setName('sendbackup')
        .setDescription('Send the decrypted backup file. (BetManager only)'),
    new discord_js_1.SlashCommandBuilder()
        .setName('addtournamentparticipant')
        .setDescription('Add a participant to the tournament. (BetManager only)')
        .addUserOption(option => option.setName('user')
        .setDescription('The user to add to the tournament')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('removetournamentparticipant')
        .setDescription('Remove a participant from the tournament. (BetManager only)')
        .addUserOption(option => option.setName('user')
        .setDescription('The user to remove from the tournament')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('listtournamentparticipants')
        .setDescription('List all participants in the tournament. (BetManager only)'),
    new discord_js_1.SlashCommandBuilder()
        .setName('cleartournamentparticipants')
        .setDescription('Clear the list of tournament participants. (BetManager only)'),
    new discord_js_1.SlashCommandBuilder()
        .setName('presentation')
        .setDescription('Present Betty Bet and its functions'),
    new discord_js_1.SlashCommandBuilder()
        .setName('togglenotifications')
        .setDescription('Toggle notifications for Point Vault GearPoints'),
    new discord_js_1.SlashCommandBuilder()
        .setName('clearmessages')
        .setDescription('Clear all private messages sent by the bot'),
    new discord_js_1.SlashCommandBuilder()
        .setName('bethistory')
        .setDescription('View your betting history'),
    new discord_js_1.SlashCommandBuilder()
        .setName('stats')
        .setDescription('View your detailed statistics'),
    new discord_js_1.SlashCommandBuilder()
        .setName('globalstats')
        .setDescription('View global betting statistics. (BetManager only)'),
    new discord_js_1.SlashCommandBuilder()
        .setName('transferdebilus')
        .setDescription('Transfer all GearPoints from the debilus closet to a specific user. (BetManager only)')
        .addUserOption(option => option.setName('user')
        .setDescription('User to transfer the GearPoints to')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('buyitem')
        .setDescription('Buy an item from the store')
        .addStringOption(option => option.setName('itemname')
        .setDescription('Name of the item')
        .setRequired(true))
        .addIntegerOption(option => option.setName('quantity')
        .setDescription('Quantity of the item')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('additem')
        .setDescription('Add an item to the store. (BetManager only)')
        .addStringOption(option => option.setName('itemname')
        .setDescription('Name of the item')
        .setRequired(true))
        .addIntegerOption(option => option.setName('quantity')
        .setDescription('Quantity of the item')
        .setRequired(true))
        .addIntegerOption(option => option.setName('unitprice')
        .setDescription('Unit price of the item')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('listitems')
        .setDescription('List all items available in the store'),
    new discord_js_1.SlashCommandBuilder()
        .setName('purchasehistory')
        .setDescription('view purchase history in the store. (BetManager only)'),
    new discord_js_1.SlashCommandBuilder()
        .setName('myitems')
        .setDescription('view the items you own'),
    new discord_js_1.SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play a game of blackjack'),
    new discord_js_1.SlashCommandBuilder()
        .setName('stopblackjack')
        .setDescription('Stop the current game of blackjack'),
    new discord_js_1.SlashCommandBuilder()
        .setName('addwinmatch')
        .setDescription('adds 1 winning point to a user. (BetManager only)')
        .addUserOption(option => option.setName('user')
        .setDescription('The user to add winning point')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('addlosematch')
        .setDescription('adds 1 lossing point to a user. (BetManager only)')
        .addUserOption(option => option.setName('user')
        .setDescription('The user to add lossing point')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('tournamentranking')
        .setDescription('view the ranking of the tournament participants. (BetManager only)'),
    new discord_js_1.SlashCommandBuilder()
        .setName('exchange')
        .setDescription('exchange GearPoints between users')
        .addUserOption(option => option.setName('user')
        .setDescription('The user to exchange points')
        .setRequired(true))
        .addIntegerOption(option => option.setName('points')
        .setDescription('Number of points to exchange')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('maintenance')
        .setDescription('Toggle maintenance mode. (BetManager only)'),
    new discord_js_1.SlashCommandBuilder()
        .setName('highlow')
        .setDescription('Play a game of High-Low'),
    new discord_js_1.SlashCommandBuilder()
        .setName('stophighlow')
        .setDescription('Stop the current game of High-Low and refund your 10 points')
];
const commandData = commands.map(command => command.toJSON());
client.once('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    log(`Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
    loadPoints();
    yield loadTournamentParticipants();
    yield addPointsToInventory();
    const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        log('Started refreshing application (/) commands.');
        yield rest.put(discord_js_1.Routes.applicationCommands(client.user.id), { body: commandData });
        log('Successfully reloaded application (/) commands.');
    }
    catch (error) {
        log(`${error}`);
    }
}));
const createBlackjackActionRow = () => {
    return new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('blackjack_hit')
        .setLabel('Hit')
        .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
        .setCustomId('blackjack_stand')
        .setLabel('Stand')
        .setStyle(discord_js_1.ButtonStyle.Success));
};
client.on('interactionCreate', (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (interaction.isCommand()) {
        const { commandName } = interaction;
        const member = interaction.member;
        if (!member) {
            yield interaction.reply('An error has occurred. Unable to verify user roles.');
            return;
        }
        const roles = member.roles;
        const hasRole = (roleName) => roles.cache.some(role => role.name === roleName);
        if (!hasRole(process.env.ROLE)) {
            yield interaction.reply({ content: `Only users with the role *${process.env.ROLE}* are allowed to use Betty Bet`, flags: discord_js_2.MessageFlags.Ephemeral });
            return;
        }
        if (maintenanceMode && !hasRole('BetManager')) {
            yield interaction.reply({ content: 'Betty Bet is currently in maintenance mode. Please try again later.', flags: discord_js_2.MessageFlags.Ephemeral });
            return;
        }
        try {
            switch (commandName) {
                case 'register':
                    yield handleRegister(interaction);
                    break;
                case 'addtournamentparticipant':
                    if (hasRole('BetManager')) {
                        yield handleAddTournamentParticipant(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'removetournamentparticipant':
                    if (hasRole('BetManager')) {
                        yield handleRemoveTournamentParticipant(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'listtournamentparticipants':
                    if (hasRole('BetManager')) {
                        yield handleListTournamentParticipants(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'cleartournamentparticipants':
                    if (hasRole('BetManager')) {
                        yield handleClearTournamentParticipants(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'placeyourbets':
                    if (hasRole('BetManager')) {
                        yield handlePlaceYourBets(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'points':
                    yield handlePoints(interaction);
                    break;
                case 'clearbets':
                    if (hasRole('BetManager')) {
                        yield handleClearBets(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'leaderboard':
                    if (hasRole('BetManager')) {
                        yield handleLeaderboard(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'win':
                    if (hasRole('BetManager')) {
                        const winnerOption = interaction.options.get('winner');
                        const winner = winnerOption ? winnerOption.value : null;
                        if (winner === 1 || winner === 2) {
                            yield handleWin(interaction, winner === 1 ? 'player1' : 'player2');
                        }
                        else {
                            yield interaction.reply('The winner must be 1 or 2.');
                        }
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'betslist':
                    if (hasRole('BetManager')) {
                        yield handleBetsList(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'deleteuser':
                    if (hasRole('BetManager')) {
                        yield handleDeleteUser(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'addpoints':
                    if (hasRole('BetManager')) {
                        yield handleAddPoints(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'claim':
                    yield handleClaim(interaction);
                    break;
                case 'pointvault':
                    yield handleInventory(interaction);
                    break;
                case 'backup':
                    if (hasRole('BetManager')) {
                        yield handleBackup(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'sendbackup':
                    if (hasRole('BetManager')) {
                        yield handleSendDecryptedBackup(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'togglenotifications':
                    yield handleToggleNotifications(interaction);
                    break;
                case 'presentation':
                    yield handlePresentation(interaction);
                    break;
                case 'clearmessages':
                    yield handleClearMessages(interaction);
                    break;
                case 'bethistory':
                    if (restricted) {
                        yield interaction.reply({ content: 'This command is currently unavailable, it will be available later.', flags: discord_js_2.MessageFlags.Ephemeral });
                        break;
                    }
                    yield handleBetHistory(interaction);
                    break;
                case 'stats':
                    if (restricted) {
                        yield interaction.reply({ content: 'This command is currently unavailable, it will be available later.', flags: discord_js_2.MessageFlags.Ephemeral });
                        break;
                    }
                    yield handleStats(interaction);
                    break;
                case 'globalstats':
                    if (hasRole('BetManager')) {
                        yield handleGlobalStats(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'transferdebilus':
                    if (hasRole('BetManager')) {
                        yield handleTransferDebilus(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'buyitem':
                    if (restricted) {
                        yield interaction.reply({ content: 'This command is currently unavailable, it will be available later.', flags: discord_js_2.MessageFlags.Ephemeral });
                        break;
                    }
                    try {
                        yield handleBuyItem(interaction);
                    }
                    catch (error) {
                        log(`Error handling buyitem command: ${error}`);
                        yield interaction.reply('There was an error processing your purchase.');
                    }
                    break;
                case 'additem':
                    if (hasRole('BetManager')) {
                        try {
                            yield handleAddItemToStore(interaction);
                        }
                        catch (error) {
                            log(`Error handling additem command: ${error}`);
                            yield interaction.reply('There was an error adding the item to the store.');
                        }
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'listitems':
                    if (restricted) {
                        yield interaction.reply({ content: 'This command is currently unavailable, it will be available later.', flags: discord_js_2.MessageFlags.Ephemeral });
                        break;
                    }
                    try {
                        yield handleListItems(interaction);
                    }
                    catch (error) {
                        log(`Error handling listitems command: ${error}`);
                        yield interaction.reply('There was an error retrieving the items list.');
                    }
                    break;
                case 'purchasehistory':
                    if (hasRole('BetManager')) {
                        yield handleViewPurchaseHistory(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'myitems':
                    if (restricted) {
                        yield interaction.reply({ content: 'This command is currently unavailable, it will be available later.', flags: discord_js_2.MessageFlags.Ephemeral });
                        break;
                    }
                    yield handleItemsInventory(interaction);
                    break;
                case 'blackjack':
                    const userId = interaction.user.id;
                    if (!usersPoints[userId]) {
                        yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', flags: discord_js_2.MessageFlags.Ephemeral });
                        return;
                    }
                    if (blackjackGames[userId]) {
                        yield interaction.reply({ content: 'You already have an active blackjack game. Please finish it before starting a new one or use `/stopstopblackjack` for delete this one', flags: discord_js_2.MessageFlags.Ephemeral });
                        return;
                    }
                    if (usersPoints[userId].points < 10) {
                        yield interaction.reply({ content: 'You need at least 10 points to play blackjack.', flags: discord_js_2.MessageFlags.Ephemeral });
                        return;
                    }
                    const { playerHand, dealerHand } = startBlackjackGame(userId, 10);
                    const playerValue = calculateHandValue(playerHand);
                    const dealerValue = calculateHandValue(dealerHand);
                    usersPoints[userId].points -= 10;
                    yield interaction.reply({ content: `\n# *Betty Bet's visible card*: \n## **|${dealerHand[0]}| |??|**\n\n# *Your hand*: \n## **|${playerHand.join('| |')}|**\n## = **${playerValue}**`, components: [createBlackjackActionRow()], flags: discord_js_2.MessageFlags.Ephemeral });
                    yield savePoints();
                    break;
                case 'addwinmatch':
                    if (hasRole('BetManager')) {
                        yield handleAddWinMatch(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'stopblackjack':
                    yield handleStopBlackjack(interaction);
                    break;
                case 'addlosematch':
                    if (hasRole('BetManager')) {
                        yield handleAddLoseMatch(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'tournamentranking':
                    if (hasRole('BetManager')) {
                        yield handleListTournamentParticipantsByRanking(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', flags: discord_js_2.MessageFlags.Ephemeral });
                    }
                    break;
                case 'exchange':
                    yield handleExchangePoints(interaction);
                    break;
                case 'maintenance':
                    yield handleToggleMaintenance(interaction);
                    break;
                case 'highlow':
                    yield handleHighLow(interaction);
                    break;
                case 'stophighlow':
                    yield handleStopHighLow(interaction);
                    break;
                default:
                    try {
                        yield interaction.reply('Unknown command');
                    }
                    catch (error) {
                        log(`Error handling default command: ${error}`);
                        yield interaction.reply('There was an error processing your request.');
                    }
                    break;
            }
        }
        catch (error) {
            log(`Error handling ${commandName} command: ${error}`);
            if (!interaction.replied && !interaction.deferred) {
                yield interaction.reply('There was an error processing your request.');
            }
        }
    }
    else if (interaction.isButton()) {
        const userId = interaction.user.id;
        if (!usersPoints[userId]) {
            yield interaction.reply({ content: 'Please register first using /register.', flags: discord_js_2.MessageFlags.Ephemeral });
            return;
        }
        if (interaction.customId.startsWith('claim_')) {
            yield handleClaimYesNo(interaction);
        }
        else if (interaction.customId === 'blackjack_hit' || interaction.customId === 'blackjack_stand') {
            const game = blackjackGames[userId];
            if (!game) {
                yield interaction.reply({ content: 'No active blackjack game found. Start a new game with /blackjack', flags: discord_js_2.MessageFlags.Ephemeral });
                return;
            }
            if (interaction.customId === 'blackjack_hit') {
                game.playerHand.push(drawCard());
                const playerValue = calculateHandValue(game.playerHand);
                const dealerValue = calculateHandValue(game.dealerHand);
                if (playerValue > 21) {
                    delete blackjackGames[userId];
                    yield interaction.update({ content: `\n# *Your hand*: \n## **|${game.playerHand.join('| |')}|**\n## = **${playerValue}**\n\n## **You bust!** *Betty Bet wins.*`, components: [] });
                    debilusCloset += 10;
                    yield savePoints();
                    return;
                }
                yield interaction.update({ content: `\n# *Betty Bet's visible card*: \n## **|${game.dealerHand[0]}| |??|**\n\n# *Your hand*: \n## **|${game.playerHand.join('| |')}|**\n## = **${playerValue}**`, components: [createBlackjackActionRow()] });
            }
            else if (interaction.customId === 'blackjack_stand') {
                let dealerValue = calculateHandValue(game.dealerHand);
                while (dealerValue < 17) {
                    game.dealerHand.push(drawCard());
                    dealerValue = calculateHandValue(game.dealerHand);
                }
                const playerValue = calculateHandValue(game.playerHand);
                let resultMessage = `\n# *Betty Bet's hand*: \n## **|${game.dealerHand.join('| |')}|**\n### = **${dealerValue}**\n\n# *Your hand*: \n## **|${game.playerHand.join('| |')}|**\n## = **${playerValue}**\n\n`;
                if (dealerValue > 21 || playerValue > dealerValue) {
                    usersPoints[userId].points += game.bet * 2;
                    resultMessage += '## **You win!**';
                    delete blackjackGames[userId];
                    yield savePoints();
                }
                else if (playerValue < dealerValue) {
                    resultMessage += '## **Betty Bet wins!**';
                    debilusCloset += 10;
                    delete blackjackGames[userId];
                    yield savePoints();
                }
                else {
                    usersPoints[userId].points += game.bet;
                    resultMessage += '## ** It\'s a tie!**';
                    delete blackjackGames[userId];
                    yield savePoints();
                }
                yield interaction.update({ content: resultMessage + `\n## you have **${usersPoints[userId].points}** ${pointsEmoji}`, components: [] });
            }
        }
        else if (interaction.customId === 'highlow_higher' || interaction.customId === 'highlow_lower') {
            yield handleHighLowButton(interaction);
        }
        else if (interaction.customId === 'player1' || interaction.customId === 'player2') {
            yield handleBetSelection(interaction);
        }
    }
}));
client.on('interactionCreate', (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (!interaction.isModalSubmit())
        return;
    if (interaction.customId === 'bet_modal') {
        // Récupérer les données saisies par l'utilisateur
        const betAmount = interaction.fields.getTextInputValue('bet_amount');
        const userId = interaction.user.id;
        // Vérifier si le montant est valide
        if (!/^\d+$/.test(betAmount) || parseInt(betAmount) <= 0) {
            yield interaction.reply({
                content: 'Invalid bet amount. Please enter a positive numeric value.',
                flags: discord_js_2.MessageFlags.Ephemeral
            });
            return;
        }
        const betAmountInt = parseInt(betAmount);
        // Vérifier les points de l'utilisateur
        if (usersPoints[userId].points < betAmountInt) {
            yield interaction.reply({
                content: `${pointsEmoji} Not enough points. Try a lower amount.`,
                flags: discord_js_2.MessageFlags.Ephemeral
            });
            return;
        }
        // Ajouter le pari
        usersPoints[userId].points -= betAmountInt;
        const playerBetOn = interaction.message.content.includes(player1Name) ? 'player1' : 'player2';
        currentBets[userId] = { amount: betAmountInt, betOn: playerBetOn };
        // Mettre à jour l'historique
        usersPoints[userId].betHistory.push({
            betOn: playerBetOn === 'player1' ? player1Name : player2Name,
            amount: betAmountInt,
            result: 'pending',
            date: new Date()
        });
        yield savePoints();
        // Confirmation
        yield interaction.reply({
            content: `You have successfully placed a bet of **${betAmountInt}** ${pointsEmoji} on **${playerBetOn === 'player1' ? player1Name : player2Name}**.`,
            flags: discord_js_2.MessageFlags.Ephemeral
        });
    }
}));
const handleRegister = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    const member = interaction.member;
    const userName = member.nickname || interaction.user.displayName;
    if (usersPoints[userId]) {
        yield interaction.reply({ content: `You are already registered.\n\n\n*Debilus* ${debilus}`, flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    usersPoints[userId] = { points: 100, name: userName, wins: 0, losses: 0, isDebilus: false, inventory: 0, notificationsEnabled: false, betHistory: [], inventoryShop: [], winMatch: 0, loseMatch: 0 };
    yield savePoints();
    yield interaction.reply({ content: `Registration successful!\n\nYou have received **100 ${pointsEmoji}** !!!\n\n **Optional**: This bot integrates a notification system, you can activate it by doing the command \`/togglenotification\` and Betty Bet will send you a DM when you reach 10 points in your inventory.`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleToggleNotifications = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    usersPoints[userId].notificationsEnabled = !usersPoints[userId].notificationsEnabled;
    yield savePoints();
    yield interaction.reply({ content: `Notifications have been ${usersPoints[userId].notificationsEnabled ? 'enabled' : 'disabled'}.`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handlePlaceYourBets = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    // Initialisation des variables
    bettingOpen = true;
    currentBets = {};
    // Récupération des noms des joueurs
    const player1Option = interaction.options.get('player1name');
    const player2Option = interaction.options.get('player2name');
    player1Name = player1Option ? player1Option.value : 'Player 1';
    player2Name = player2Option ? player2Option.value : 'Player 2';
    // Création des boutons pour les paris
    const actionRow = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('player1')
        .setLabel('Bet on ' + player1Name)
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId('player2')
        .setLabel('Bet on ' + player2Name)
        .setStyle(discord_js_1.ButtonStyle.Danger));
    // Envoi du message initial
    yield interaction.reply({
        content: `## The bets are open!!!\n\nYou have **60 seconds** to choose between **${player1Name}** and **${player2Name}**.\n\n`,
        components: [actionRow]
    });
    // Récupérer le message après l'envoi
    const replyMessage = yield interaction.fetchReply();
    // Affichage d'un effet visuel supplémentaire dans le canal
    const channel = interaction.channel;
    if (channel) {
        channel.send(`${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}`);
    }
    // Fermeture des paris après 60 secondes
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            bettingOpen = false;
            // Désactivation des boutons
            const disabledRow = new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('player1')
                .setLabel('Bet on ' + player1Name)
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setDisabled(true), // Désactiver le bouton
            new discord_js_1.ButtonBuilder()
                .setCustomId('player2')
                .setLabel('Bet on ' + player2Name)
                .setStyle(discord_js_1.ButtonStyle.Danger)
                .setDisabled(true) // Désactiver le bouton
            );
            // Mise à jour du message pour indiquer que les paris sont fermés
            yield replyMessage.edit({
                content: `## Bets are now closed!`,
                components: [disabledRow],
            });
            // Message de fin de session dans le canal
            if (channel) {
                channel.send('*Thanks for the money!*');
            }
        }
        catch (error) {
            console.error('Error closing bets:', error);
        }
    }), 60000); // Temps pour fermer les paris (60 secondes)
});
const handleBetSelection = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    const customId = interaction.customId;
    if (!usersPoints[userId]) {
        yield interaction.reply({
            content: 'You are not registered yet. Use */register* to register.',
            flags: discord_js_2.MessageFlags.Ephemeral,
        });
        return;
    }
    // Vérifier si l'utilisateur a parié sur l'autre joueur
    if (currentBets[userId] && currentBets[userId].betOn !== customId) {
        yield interaction.reply({
            content: 'You have already placed a bet on the other player.',
            flags: discord_js_2.MessageFlags.Ephemeral,
        });
        return;
    }
    // Vérifier si l'utilisateur a déjà parié
    if (currentBets[userId]) {
        yield interaction.reply({
            content: 'You have already placed a bet on this player.',
            flags: discord_js_2.MessageFlags.Ephemeral,
        });
        return;
    }
    const playerName = customId === 'player1' ? player1Name : player2Name;
    // Créer un modal pour demander le montant du pari
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId(`bet_modal_${customId}`)
        .setTitle(`Bet on ${playerName}`);
    const betAmountInput = new discord_js_1.TextInputBuilder()
        .setCustomId('bet_amount')
        .setLabel(`You have ${usersPoints[userId].points} ! Enter your bet amount`)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setPlaceholder('e.g. 100')
        .setRequired(true);
    const row = new discord_js_1.ActionRowBuilder().addComponents(betAmountInput);
    modal.addComponents(row);
    yield interaction.showModal(modal);
});
const handleBetModal = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = interaction.user.id;
        const betAmountStr = interaction.fields.getTextInputValue('bet_amount');
        // Vérification stricte : uniquement des nombres
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
        const customId = interaction.customId.replace('bet_modal_', ''); // Extract the player ID
        const chosenPlayerName = customId === 'player1' ? player1Name : player2Name;
        if (!usersPoints[userId]) {
            yield interaction.reply({
                content: 'You are not registered yet. Use */register* to register.',
                flags: discord_js_2.MessageFlags.Ephemeral,
            });
            return;
        }
        // Vérifier les points disponibles
        if (usersPoints[userId].points < betAmount) {
            yield interaction.reply({
                content: `${pointsEmoji} Not enough points. Try a lower amount.`,
                flags: discord_js_2.MessageFlags.Ephemeral,
            });
            return;
        }
        // Enregistrer le pari
        usersPoints[userId].points -= betAmount;
        currentBets[userId] = { amount: betAmount, betOn: customId };
        usersPoints[userId].betHistory.push({
            betOn: chosenPlayerName,
            amount: betAmount,
            result: 'pending',
            date: new Date(),
        });
        yield savePoints();
        // Confirmation
        yield interaction.reply({
            content: `You successfully placed a bet of **${betAmount}** ${pointsEmoji} on **${chosenPlayerName}**!`,
            flags: discord_js_2.MessageFlags.Ephemeral,
        });
    }
    catch (error) {
        console.error('Error in handleBetModal:', error);
        yield interaction.reply({
            content: 'An error occurred while processing your bet. Please try again.',
            flags: discord_js_2.MessageFlags.Ephemeral,
        });
    }
});
client.on('interactionCreate', (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (interaction.isModalSubmit() && interaction.customId.startsWith('bet_modal')) {
        console.log('Modal submit captured:', interaction.customId); // Debugging
        yield handleBetModal(interaction); // Appel de ta fonction spécifique
    }
}));
const handlePoints = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    loadPoints();
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use */register* to register.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const userInfo = usersPoints[userId];
    const status = userInfo.isDebilus ? `you are a **Debilus** ${debilus}` : 'bettor';
    yield interaction.reply({ content: `**${userInfo.name}**\n\nYou have **${userInfo.points}** ${pointsEmoji}\n\n| **${userInfo.wins} wins** | **${userInfo.losses} losses** |\n\n**Status:** ${status}`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleClearBets = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    for (const [userId, bet] of Object.entries(currentBets)) {
        if (usersPoints[userId]) {
            usersPoints[userId].points += bet.amount;
        }
    }
    yield savePoints();
    currentBets = {};
    bettingOpen = false;
    yield interaction.reply('All bets were void and Gearpoints were refunded.');
});
const handleLeaderboard = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    loadPoints();
    const sortedUsers = Object.entries(usersPoints).sort((a, b) => b[1].points - a[1].points);
    const top20 = sortedUsers.slice(0, 20);
    // Définir les largeurs de colonnes pour un alignement uniforme
    const rankWidth = 6; // Largeur de la colonne "Rank"
    const nameWidth = 32; // Largeur de la colonne "Name"
    const pointsWidth = 10; // Largeur de la colonne "Points"
    const winsWidth = 8; // Largeur de la colonne "Wins"
    const lossesWidth = 8; // Largeur de la colonne "Losses"
    const leaderboard = top20.map(([userId, userInfo], index) => {
        const userName = userInfo.name.padEnd(nameWidth, ' ');
        const userPoints = userInfo.points.toString().padStart(pointsWidth, ' ');
        const userWins = userInfo.wins.toString().padStart(winsWidth, ' ');
        const userLosses = userInfo.losses.toString().padStart(lossesWidth, ' ');
        return `${(index + 1).toString().padStart(rankWidth, ' ')} ${userName} ${userPoints} ${userWins} ${userLosses}`;
    }).join('\n');
    yield interaction.reply(`**Ranking of the best bettors:**\n\n\`\`\`Rank   Name                                  Points     Wins      Losses\n${leaderboard}\`\`\``);
});
const handleBetsList = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    let totalPlayer1Bets = 0;
    let totalPlayer2Bets = 0;
    if (player1Name === undefined && player2Name === undefined) {
        yield interaction.reply({ content: `no bets, no game ${debilus}`, flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const player1Bets = Object.entries(currentBets)
        .filter(([, bet]) => bet.betOn === 'player1')
        .map(([userId, bet]) => {
        totalPlayer1Bets += bet.amount;
        return `${usersPoints[userId].name.padEnd(32)}\t${bet.amount}`;
    });
    const player2Bets = Object.entries(currentBets)
        .filter(([, bet]) => bet.betOn === 'player2')
        .map(([userId, bet]) => {
        totalPlayer2Bets += bet.amount;
        return `${usersPoints[userId].name.padEnd(32)}\t${bet.amount}`;
    });
    const totalBets = totalPlayer1Bets + totalPlayer2Bets;
    const ratio = totalPlayer2Bets === 0 ? 'N/A' : (totalPlayer1Bets / totalPlayer2Bets).toFixed(2);
    yield interaction.reply(`**Bets List:**\n\n\`\`\`Player\t\tName\t\tAmount\n${player1Name}:\n${player1Bets.join('\n') || 'No bets'}\n\n${player2Name}:\n${player2Bets.join('\n') || 'No bets'}\`\`\`\n\n` +
        `Total bet on **${player1Name}**: **${totalPlayer1Bets}** ${pointsEmoji}\n` +
        `Total bet on **${player2Name}**: **${totalPlayer2Bets}** ${pointsEmoji}\n` +
        `Total bet overall: **${totalBets}** ${pointsEmoji}\n\n` +
        `Betting Ratio (${player1Name} / ${player2Name}): **${ratio}**`);
});
const handleWin = (interaction, winningPlayer) => __awaiter(void 0, void 0, void 0, function* () {
    let totalBetAmount = 0;
    let winnerBetAmount = 0;
    let loserBetAmount = 0;
    const winningPlayerName = winningPlayer === 'player1' ? player1Name : player2Name;
    let loserTotalPoints = 0;
    for (const bet of Object.values(currentBets)) {
        if (bet.betOn !== winningPlayer) {
            loserTotalPoints += bet.amount; // Somme totale des mises des perdants
        }
    }
    for (const bet of Object.values(currentBets)) {
        totalBetAmount += bet.amount;
        if (bet.betOn === winningPlayer) {
            winnerBetAmount += bet.amount;
        }
        else {
            loserBetAmount += bet.amount;
        }
    }
    if (winnerBetAmount === 0 && loserBetAmount === 0) {
        const message = `No bets, no money ! ${debilus}`;
        yield interaction.reply({ content: message, flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    if (winnerBetAmount === 0) {
        // Ajouter tous les points dans le placard à debilus
        debilusCloset += totalBetAmount;
        yield savePoints(); // Sauvegarder après avoir mis à jour debilusCloset
        const file = new discord_js_1.AttachmentBuilder('./images/crashboursier.png');
        const message2 = `Thanks for money, Debilus !\n\nAll GearPoints have been added to the **debilus closet** ! \nTotal GearPoints in debilus closet: **${debilusCloset}** ${pointsEmoji}`;
        yield interaction.reply({ content: `The winner is **${winningPlayerName}** ! No bets were placed on the winner. ${message2}`, files: [file] });
        // Marquer tous les paris comme des pertes
        for (const [userId, bet] of Object.entries(currentBets)) {
            usersPoints[userId].losses += 1; // Incrémenter le nombre de défaites
            // Mettre à jour le résultat du pari dans l'historique
            const betHistory = usersPoints[userId].betHistory;
            betHistory[betHistory.length - 1].result = 'loss';
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
        }
        // Effacer les paris même si le vainqueur n'a pas de paris
        currentBets = {};
        bettingOpen = false;
        yield savePoints();
        return;
    }
    for (const [userId, bet] of Object.entries(currentBets)) {
        if (bet.betOn === winningPlayer) {
            // Calculer la proportion pour chaque gagnant
            const gainFromLosers = Math.floor(bet.amount / winnerBetAmount * loserTotalPoints);
            usersPoints[userId].points += bet.amount + gainFromLosers; // Ajouter le pari initial + le gain
            usersPoints[userId].wins += 1;
            // Mettre à jour l'historique
            const betHistory = usersPoints[userId].betHistory;
            betHistory[betHistory.length - 1].result = 'win';
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
        }
        else {
            // Déduire les points pour les perdants
            usersPoints[userId].losses += 1;
            const betHistory = usersPoints[userId].betHistory;
            betHistory[betHistory.length - 1].result = 'loss';
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
        }
    }
    yield savePoints();
    currentBets = {};
    bettingOpen = false;
    const message = `The winner is **${winningPlayerName}** ! Congratulations to all those who bet on this player, the GearPoints have been redistributed !`;
    const message2 = `The winner is **${winningPlayerName}** ! It's the stock market crash, you had to believe a little more in this player !`;
    const file = new discord_js_1.AttachmentBuilder('./images/petitcrashboursier.png');
    if (winnerBetAmount < loserBetAmount) {
        yield interaction.reply({ content: message2, files: [file] });
    }
    else {
        const winFile = new discord_js_1.AttachmentBuilder('./images/victoire.png');
        yield interaction.reply({ content: message, files: [winFile] });
    }
    player1Name = 'player 1';
    player2Name = 'player 2';
});
const handleDeleteUser = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userIdToDelete = (_a = interaction.options.get('userid')) === null || _a === void 0 ? void 0 : _a.value;
    if (userIdToDelete && usersPoints[userIdToDelete]) {
        const userNameToDelete = usersPoints[userIdToDelete].name;
        delete usersPoints[userIdToDelete];
        yield savePoints();
        yield interaction.reply({ content: `The user **${userNameToDelete}** (${userIdToDelete}) has been deleted.`, flags: discord_js_2.MessageFlags.Ephemeral });
    }
    else {
        yield interaction.reply({ content: 'User no found', flags: discord_js_2.MessageFlags.Ephemeral });
    }
});
const handleAddPoints = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userOption = interaction.options.get('user');
    const pointsOption = interaction.options.get('points');
    const userId = userOption === null || userOption === void 0 ? void 0 : userOption.value;
    const pointsToAdd = pointsOption === null || pointsOption === void 0 ? void 0 : pointsOption.value;
    if (userId == bettyBettId) {
        debilusCloset += pointsToAdd;
        yield interaction.reply({ content: `**${pointsToAdd}** points have been added to DebilusCloset.`, flags: discord_js_2.MessageFlags.Ephemeral });
        yield savePoints();
        return;
    }
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: `User with id ${userId} is not registered`, flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    usersPoints[userId].points += pointsToAdd;
    usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
    yield savePoints();
    yield interaction.reply({ content: `**${pointsToAdd}** ${pointsEmoji} Points have been added to **${usersPoints[userId].name}**.`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleClaim = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    loadPoints();
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use `/register` to register.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const pointsToClaim = usersPoints[userId].inventory;
    if (pointsToClaim > 0) {
        usersPoints[userId].points += pointsToClaim;
        usersPoints[userId].inventory = 0;
        usersPoints[userId].isDebilus = false; // Mettre à jour le statut debilus
        yield savePoints();
        yield interaction.reply({ content: `You have claimed **${pointsToClaim}** ${pointsEmoji}.\n\nYou now have **${usersPoints[userId].points}** ${pointsEmoji}`, flags: discord_js_2.MessageFlags.Ephemeral });
    }
    else {
        yield interaction.reply({ content: 'You have no points to claim. try again later !', flags: discord_js_2.MessageFlags.Ephemeral });
    }
});
const handleInventory = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    loadPoints();
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: `You are not registered yet. Use */register* to register.`, flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const inventoryPoints = usersPoints[userId].inventory;
    yield interaction.reply({ content: `You have **${inventoryPoints}** ${pointsEmoji} in your Point Vault.`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleBackup = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    createDataDebilusDir();
    if (!fs.existsSync('DataDebilus/decrypted_backup.json')) {
        yield interaction.reply({ content: 'No decrypted backup found.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const decryptedData = JSON.parse(fs.readFileSync('DataDebilus/decrypted_backup.json', 'utf-8'));
    const encryptedData = encrypt(JSON.stringify(decryptedData));
    fs.writeFileSync(filePath, JSON.stringify(encryptedData, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité
    // Mettre à jour les variables locales après la sauvegarde
    usersPoints = decryptedData.usersPoints;
    debilusCloset = decryptedData.debilusCloset;
    store = decryptedData.store;
    purchaseHistory = decryptedData.purchaseHistory;
    lastUpdateTime = new Date(decryptedData.lastUpdateTime);
    yield interaction.reply({ content: 'Data from decrypted backup has been encrypted and **saved successfully** !', flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleSendDecryptedBackup = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    createDataDebilusDir();
    if (!fs.existsSync('DataDebilus/decrypted_backup.json')) {
        yield interaction.reply({ content: 'No decrypted backup found.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const file = new discord_js_1.AttachmentBuilder('DataDebilus/decrypted_backup.json');
    yield interaction.reply({ content: 'Here is the decrypted backup file.', files: [file], flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleAddTournamentParticipant = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userOption = interaction.options.get('user');
    const user = userOption === null || userOption === void 0 ? void 0 : userOption.user;
    if (user) {
        tournamentParticipants.set(user.id, user.displayName); // Ajouter l'ID et le pseudo à la Map
        yield saveTournamentParticipants(); // Appel de la fonction asynchrone de sauvegarde
        yield interaction.reply({ content: `${user.displayName} has been added to the tournament.`, flags: discord_js_2.MessageFlags.Ephemeral });
    }
    else {
        yield interaction.reply({ content: 'User not found.', flags: discord_js_2.MessageFlags.Ephemeral });
    }
});
const handleRemoveTournamentParticipant = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userOption = interaction.options.get('user');
    const user = userOption === null || userOption === void 0 ? void 0 : userOption.user;
    if (user) {
        tournamentParticipants.delete(user.id);
        usersPoints[user.id].winMatch = 0;
        usersPoints[user.id].loseMatch = 0;
        yield saveTournamentParticipants(); // Appel de la fonction asynchrone de sauvegarde
        yield savePoints();
        yield interaction.reply({ content: `${user.displayName} has been removed from the tournament.`, flags: discord_js_2.MessageFlags.Ephemeral });
    }
    else {
        yield interaction.reply({ content: 'User not found.', flags: discord_js_2.MessageFlags.Ephemeral });
    }
});
const handleListTournamentParticipants = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (tournamentParticipants.size === 0) {
        yield interaction.reply({ content: 'No participants in the tournament.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const participantsList = Array.from(tournamentParticipants.entries()).map(([_, username]) => {
        return `Pseudo: ${username}`;
    }).join('\n');
    yield interaction.reply({ content: `Tournament Participants:\n${participantsList}`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleClearTournamentParticipants = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    tournamentParticipants.forEach((_, userId) => {
        if (usersPoints[userId]) {
            usersPoints[userId].winMatch = 0;
            usersPoints[userId].loseMatch = 0;
        }
    });
    tournamentParticipants.clear(); // Effacer tous les participants
    yield saveTournamentParticipants(); // Appel de la fonction asynchrone de sauvegarde
    yield savePoints();
    yield interaction.reply({ content: 'All tournament participants have been cleared.', flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleClaimYesNo = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        if (!interaction.replied) {
            yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', flags: discord_js_2.MessageFlags.Ephemeral });
        }
        return;
    }
    if (interaction.customId === 'claim_yes') {
        const pointsToClaim = usersPoints[userId].inventory;
        usersPoints[userId].points += pointsToClaim;
        usersPoints[userId].inventory = 0;
        yield savePoints();
        if (!interaction.replied) {
            yield interaction.update({ content: `You have claimed **${pointsToClaim}** ${pointsEmoji}.\n\nYou now have **${usersPoints[userId].points}** ${pointsEmoji}`, components: [] });
        }
    }
    else if (interaction.customId === 'claim_no') {
        if (!interaction.replied) {
            yield interaction.update({ content: 'You have chosen not to claim your points at this time.', components: [] });
        }
    }
    else {
        if (!interaction.replied) {
            yield interaction.update({ content: 'Invalid selection.', components: [] });
        }
    }
});
const handlePresentation = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const part1 = `
Hello ! I'm **Betty Bet**, your betting bot ! You will find all my features and my source code via this link:

https://github.com/SweetDebilus/Betty-Bet?tab=readme-ov-file#betty-bet`;
    yield interaction.reply({ content: part1, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleClearMessages = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    const user = yield client.users.fetch(userId);
    if (!user) {
        yield interaction.reply({ content: 'User not found.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    try {
        const dmChannel = yield user.createDM();
        const messages = yield dmChannel.messages.fetch({ limit: 100 });
        const botMessages = messages.filter(msg => { var _a; return msg.author.id === ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id); });
        for (const message of botMessages.values()) {
            yield message.delete();
            setInterval(() => { }, 500); // Ajout d'un délai entre les suppressions
        }
        yield interaction.reply({ content: 'All private messages sent by the bot have been cleared.', flags: discord_js_2.MessageFlags.Ephemeral });
    }
    catch (error) {
        log(`Failed to clear messages for user ${userId}: ${error}`);
        yield interaction.reply({ content: 'Failed to clear messages.', flags: discord_js_2.MessageFlags.Ephemeral });
    }
});
const handleBetHistory = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const betHistory = usersPoints[userId].betHistory;
    if (betHistory.length === 0) {
        yield interaction.reply({ content: 'You have no betting history.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    let historyMessage = 'Your Betting History:\n';
    betHistory.forEach((bet, index) => __awaiter(void 0, void 0, void 0, function* () {
        const betInfo = `\n**Bet ${index + 1}:**\nDate: ${bet.date.toLocaleString()}\nBet On: ${bet.betOn}\nAmount: ${bet.amount}${pointsEmoji}\nResult: ${bet.result}\n`;
        if ((historyMessage + betInfo).length > 2000) {
            yield interaction.reply({ content: historyMessage, flags: discord_js_2.MessageFlags.Ephemeral });
            historyMessage = 'Your Betting History (continued):\n';
        }
        historyMessage += betInfo;
    }));
    yield interaction.reply({ content: historyMessage, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleStats = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const userStats = usersPoints[userId];
    const totalPoints = userStats.points;
    const totalWins = userStats.wins;
    const totalLosses = userStats.losses;
    const totalBets = totalWins + totalLosses;
    const winPercentage = totalBets === 0 ? 0 : ((totalWins / totalBets) * 100).toFixed(2);
    const lossPercentage = totalBets === 0 ? 0 : ((totalLosses / totalBets) * 100).toFixed(2);
    const statsMessage = `
**Your Betting Statistics**:

- ${debcoins} **Total GearPoints**: **${totalPoints}** ${pointsEmoji}
- 💪 **Total Wins**: **${totalWins}**
- 😢 **Total Losses**: **${totalLosses}**
- 🎲 **Total Bets**: **${totalBets}**
- 📈 **Win Percentage**: **${winPercentage}%**
- 📉 **Loss Percentage**: **${lossPercentage}%**
  `;
    yield interaction.reply({ content: statsMessage, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleGlobalStats = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    let totalPoints = 0;
    let totalWins = 0;
    let totalLosses = 0;
    for (const userId in usersPoints) {
        totalPoints += usersPoints[userId].points;
        totalWins += usersPoints[userId].wins;
        totalLosses += usersPoints[userId].losses;
    }
    const totalBets = totalWins + totalLosses;
    const winPercentage = totalBets === 0 ? 0 : ((totalWins / totalBets) * 100).toFixed(2);
    const lossPercentage = totalBets === 0 ? 0 : ((totalLosses / totalBets) * 100).toFixed(2);
    const globalStatsMessage = `
**Global Betting Statistics**:

- ${debcoins} **Total Points**: **${totalPoints}** ${pointsEmoji}
- 🏆 **Total Wins**: **${totalWins}**
- 😢 **Total Losses**: **${totalLosses}**
- 🎲 **Total Bets**: **${totalBets}**
- 📈 **Global Win Percentage**: **${winPercentage}%**
- 📉 **Global Loss Percentage**: **${lossPercentage}%**
  `;
    yield interaction.reply({ content: globalStatsMessage });
});
const handleTransferDebilus = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userOption = interaction.options.get('user');
    const user = userOption === null || userOption === void 0 ? void 0 : userOption.user;
    if (!user) {
        yield interaction.reply({ content: 'User not found.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const userId = user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'The specified user is not registered.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    if (debilusCloset === 0) {
        yield interaction.reply({ content: 'The debilus closet is already empty.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    // Transfer the points from the debilus closet to the user
    usersPoints[userId].points += debilusCloset;
    const transferredPoints = debilusCloset;
    debilusCloset = 0;
    yield savePoints();
    yield interaction.reply({ content: `Transferred ${transferredPoints} GearPoints from the debilus closet to ${user.username}. The debilus closet is now empty.`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleBuyItem = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield loadPoints(); // Charger les points depuis le fichier
    const userId = interaction.user.id;
    const itemName = (_a = interaction.options.get('itemname', true)) === null || _a === void 0 ? void 0 : _a.value;
    const quantity = (_b = interaction.options.get('quantity', true)) === null || _b === void 0 ? void 0 : _b.value;
    // Vérifier si l'utilisateur existe
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'User not found', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    // Vérifier si l'article existe dans la boutique
    if (!store[itemName]) {
        yield interaction.reply({ content: 'Item not found', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const item = store[itemName];
    const totalPrice = item.unitPrice * quantity;
    // Vérifier si l'utilisateur a suffisamment de points
    if (usersPoints[userId].points < totalPrice) {
        yield interaction.reply({ content: 'Not enough points', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    // Vérifier si la boutique a suffisamment d'articles en stock
    if (item.quantity < quantity) {
        yield interaction.reply({ content: 'Not enough items in stock', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    // Déduire les points de l'utilisateur et mettre à jour l'inventaire
    usersPoints[userId].points -= totalPrice;
    const userInventory = usersPoints[userId].inventoryShop.find(i => i.name === itemName);
    // Mettre à jour la quantité de l'article dans l'inventaire de l'utilisateur
    if (userInventory) {
        userInventory.quantity += quantity;
        debilusCloset += totalPrice;
    }
    else {
        usersPoints[userId].inventoryShop.push({ name: itemName, quantity: quantity });
        debilusCloset += totalPrice;
    }
    // Déduire les items du stock
    item.quantity -= quantity;
    // Enregistrer l'achat dans l'historique
    const transactionId = `txn_${Date.now()}`;
    purchaseHistory[transactionId] = {
        userId: userId,
        userName: usersPoints[userId].name,
        itemName: itemName,
        quantity: quantity,
        totalPrice: totalPrice,
        timestamp: new Date()
    };
    yield savePoints(); // Sauvegarder les points dans le fichier
    // Répondre à l'interaction pour confirmer l'achat
    yield interaction.reply({ content: `Successfully purchased ${quantity} ${item.name}(s)`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleAddItemToStore = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    yield loadPoints();
    const itemName = (_a = interaction.options.get('itemname', true)) === null || _a === void 0 ? void 0 : _a.value;
    const quantity = (_b = interaction.options.get('quantity', true)) === null || _b === void 0 ? void 0 : _b.value;
    const unitPrice = (_c = interaction.options.get('unitprice', true)) === null || _c === void 0 ? void 0 : _c.value;
    if (store[itemName]) {
        store[itemName].quantity += quantity;
    }
    else {
        store[itemName] = {
            name: itemName,
            quantity: quantity,
            unitPrice: unitPrice
        };
    }
    yield savePoints();
    yield interaction.reply({ content: `Added ${quantity} ${itemName}(s) to the store`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleListItems = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    let storeItems = 'Available items in the store:\n\n';
    for (const itemName in store) {
        const item = store[itemName];
        storeItems += `${item.name} - *Quantity*: **${item.quantity}** | *Unit Price*: **${item.unitPrice}** ${pointsEmoji}\n`;
    }
    yield interaction.reply({ content: storeItems, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleViewPurchaseHistory = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const allPurchaseRecords = Object.values(purchaseHistory);
    if (allPurchaseRecords.length === 0) {
        yield interaction.reply({ content: 'No purchase history found.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    // Trier les enregistrements d'achat par nom d'utilisateur
    allPurchaseRecords.sort((a, b) => a.userName.localeCompare(b.userName));
    const historyMessage = allPurchaseRecords.map(record => {
        const date = new Date(record.timestamp);
        const formattedDate = formatDate(date);
        return `*User*: **${record.userName}**\n- *Item*: **${record.itemName}**\n- *Quantity*: **${record.quantity}**\n- *Total Price*: **${record.totalPrice}** ${pointsEmoji}\n- *Date*: **${formattedDate}**\n`;
    }).join('\n');
    yield interaction.reply({ content: `Global purchase history:\n\n${historyMessage}`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleItemsInventory = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    let inventoryItemsMessage = `**Item Inventory**:\n`;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const items = usersPoints[userId].inventoryShop;
    if (items.length === 0) {
        yield interaction.reply({ content: 'you have no items in your inventory', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    items.forEach((item, index) => __awaiter(void 0, void 0, void 0, function* () {
        const itemInfo = `\n**Item ${index + 1}**:\n- *Name*: **${item.name}**\n- *Quantity*: **${item.quantity}**\n`;
        inventoryItemsMessage += itemInfo;
    }));
    yield interaction.reply({ content: inventoryItemsMessage, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleAddWinMatch = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userOption = interaction.options.get('user');
    const userId = userOption === null || userOption === void 0 ? void 0 : userOption.value;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: `User with id ${userId} is not registered`, flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    if (!tournamentParticipants.has(userId)) {
        yield interaction.reply({ content: `User ${usersPoints[userId].name} is not participating in the tournament`, flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    usersPoints[userId].winMatch += 1;
    yield savePoints();
    yield interaction.reply({ content: `${usersPoints[userId].name} win !`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleAddLoseMatch = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userOption = interaction.options.get('user');
    const userId = userOption === null || userOption === void 0 ? void 0 : userOption.value;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: `User with id ${userId} is not registered`, flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    if (!tournamentParticipants.has(userId)) {
        yield interaction.reply({ content: `User ${usersPoints[userId].name} is not participating in the tournament`, flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    usersPoints[userId].loseMatch += 1;
    if (usersPoints[userId].loseMatch === 2) {
        yield interaction.reply({ content: `${usersPoints[userId].name} loses and is eliminated !` });
        yield savePoints();
        return;
    }
    yield savePoints();
    yield interaction.reply({ content: `${usersPoints[userId].name} loses !`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleListTournamentParticipantsByRanking = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (tournamentParticipants.size === 0) {
        yield interaction.reply({ content: 'No participants in the tournament.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    // Récupérer les données des participants
    const participants = Array.from(tournamentParticipants.keys()).map(userId => {
        var _a, _b;
        return {
            id: userId,
            name: tournamentParticipants.get(userId),
            wins: ((_a = usersPoints[userId]) === null || _a === void 0 ? void 0 : _a.winMatch) || 0,
            losses: ((_b = usersPoints[userId]) === null || _b === void 0 ? void 0 : _b.loseMatch) || 0
        };
    });
    // Classer les participants
    participants.sort((a, b) => {
        if (a.wins === b.wins) {
            return a.losses - b.losses; // Si les victoires sont égales, trier par nombre de défaites (moins de défaites est mieux)
        }
        return b.wins - a.wins; // Trier par nombre de victoires (plus de victoires est mieux)
    });
    // Générer la liste classée
    const rankedList = participants.map((participant, index) => {
        return `${index + 1}. ${participant.name} - Wins: ${participant.wins}, Losses: ${participant.losses}`;
    }).join('\n');
    yield interaction.reply({ content: `**Tournament Participants Ranked:**\n\n${rankedList}` });
});
// echange de points entre deux utilisateurs
const handleExchangePoints = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userOption = interaction.options.get('user');
    const user = userOption === null || userOption === void 0 ? void 0 : userOption.user;
    const pointsOption = interaction.options.get('points');
    const points = pointsOption === null || pointsOption === void 0 ? void 0 : pointsOption.value;
    if (!user) {
        yield interaction.reply({ content: 'User not found.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const userId = user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'User not found.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const senderId = interaction.user.id;
    if (!usersPoints[senderId]) {
        yield interaction.reply({ content: 'User not found.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    if (usersPoints[senderId].points < points) {
        yield interaction.reply({ content: 'Not enough points.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    usersPoints[senderId].points -= points;
    usersPoints[userId].points += points;
    yield savePoints();
    yield interaction.reply({ content: `Successfully transferred ${points} GearPoints to ${user.username}.`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleToggleMaintenance = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    maintenanceMode = !maintenanceMode;
    yield interaction.reply({ content: `Maintenance mode has been ${maintenanceMode ? 'enabled' : 'disabled'}.`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleStopBlackjack = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    if (!blackjackGames[userId]) {
        yield interaction.reply({ content: 'No active blackjack game found.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    usersPoints[userId].points += 10; // Rembourser 10 points
    usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
    delete blackjackGames[userId];
    yield savePoints();
    yield interaction.reply({ content: `You have stopped the game. You have been refunded 10 points.`, flags: discord_js_2.MessageFlags.Ephemeral });
    yield interaction.followUp({ content: `You can now play again !`, flags: discord_js_2.MessageFlags.Ephemeral });
});
const handleHighLow = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    let randomCardVisible = Math.floor(Math.random() * 9) + 1; // Carte visible (entre 1 et 9)
    let randomCardHidden = Math.floor(Math.random() * 9) + 1; // Carte cachée (entre 1 et 9)
    // Assurez-vous que les deux cartes sont différentes
    while (randomCardVisible === randomCardHidden) {
        randomCardHidden = Math.floor(Math.random() * 9) + 1;
    }
    // Ajouter l'utilisateur à la liste des jeux High-Low en cours
    highlowGames[userId] = {
        visibleCard: randomCardVisible,
        hiddenCard: randomCardHidden,
    };
    const createHighLowActionRow = () => {
        return new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('highlow_higher') // Custom ID pour "Higher"
            .setLabel('Higher') // Texte sur le bouton
            .setStyle(discord_js_1.ButtonStyle.Success), // Style vert pour un choix positif
        new discord_js_1.ButtonBuilder()
            .setCustomId('highlow_lower') // Custom ID pour "Lower"
            .setLabel('Lower') // Texte sur le bouton
            .setStyle(discord_js_1.ButtonStyle.Danger) // Style rouge pour un choix négatif
        );
    };
    // Message initial du jeu
    yield interaction.reply({
        content: `# High-Low Game\n\n## |${randomCardVisible}| |?|\n\nDo you think the hidden card is higher or lower?`,
        components: [createHighLowActionRow()], // Ajout des boutons au message
        flags: discord_js_2.MessageFlags.Ephemeral, // Réponse éphémère
    });
    // Stocker les données de jeu dans une mémoire temporaire (à implémenter)
    usersPoints[userId].points -= 40; // Déduire 10 points pour jouer
    usersPoints[userId].isDebilus = usersPoints[userId].points <= 0; // Vérifier si l'utilisateur est debilus
    yield savePoints();
});
// Fonction pour gérer les clics sur les boutons
const handleHighLowButton = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    const customId = interaction.customId;
    // Récupérer les données du jeu depuis une mémoire temporaire (à implémenter)
    if (!highlowGames[userId]) {
        yield interaction.reply({ content: 'No active game found. Please start a new game using the High-Low command.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    const { visibleCard, hiddenCard } = highlowGames[userId];
    let resultMessage;
    const calculateReward = (visibleCard) => {
        if (visibleCard <= 2 || visibleCard >= 8) {
            return 45; // Gain faible pour un faible risque
        }
        else if (visibleCard >= 4 && visibleCard <= 6) {
            return 55; // Gain élevé pour une probabilité équilibrée
        }
        else {
            return 50; // Gain standard pour les zones de risque moyen
        }
    };
    const reward = calculateReward(visibleCard); // Calculer le gain en fonction de la carte visible
    // Comparer en fonction du choix de l'utilisateur et attribuer 10 point s'il gagne
    if (customId === 'highlow_higher') {
        if (hiddenCard > visibleCard) {
            usersPoints[userId].points += reward; // Ajouter 20 points si l'utilisateur gagne
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0; // Vérifier si l'utilisateur est debilus
            yield savePoints(); // Sauvegarder les points après la mise à jour
            resultMessage = `**Congratulations!** The hidden card **|${hiddenCard}|** is higher than **|${visibleCard}|**.\n\nYou have **${usersPoints[userId].points}${pointsEmoji}** !`;
        }
        else {
            resultMessage = `**Sorry**, the hidden card **|${hiddenCard}|** is not higher than **|${visibleCard}|**.\n\nYou have **${usersPoints[userId].points}${pointsEmoji}** !`;
        }
    }
    else if (customId === 'highlow_lower') {
        if (hiddenCard < visibleCard) {
            usersPoints[userId].points += reward; // Ajouter 5 à 15 points si l'utilisateur gagne
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0; // Vérifier si l'utilisateur est debilus
            yield savePoints(); // Sauvegarder les points après la mise à jour
            resultMessage = `**Congratulations!** The hidden card **|${hiddenCard}|** is lower than **|${visibleCard}|**.\n\nYou have **${usersPoints[userId].points}${pointsEmoji}** !`;
        }
        else {
            resultMessage = `**Sorry**, the hidden card **|${hiddenCard}|** is not lower than **|${visibleCard}|**.\n\nYou have **${usersPoints[userId].points}${pointsEmoji}** !`;
        }
    }
    if (usersPoints[userId].isDebilus) {
        resultMessage += `\n\nYou have ${usersPoints[userId].points}${pointsEmoji} ! You're now a Debilus. Play wisely next time! ${debilus}`;
    }
    // Répondre et terminer le jeu
    yield interaction.update({
        content: `# High-Low Game\n\n## |${visibleCard}| |${hiddenCard}|\n\n` + resultMessage,
        components: [], // Supprimer les boutons après un choix
    });
    // Supprimer les données de jeu de la mémoire temporaire
    delete highlowGames[userId];
});
const handleStopHighLow = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    if (!highlowGames[userId]) {
        yield interaction.reply({ content: 'No active high-low game found.', flags: discord_js_2.MessageFlags.Ephemeral });
        return;
    }
    usersPoints[userId].points += 40; // Rembourser 10 points
    usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
    delete highlowGames[userId];
    yield savePoints();
    yield interaction.reply({ content: `You have stopped the game. You have been refunded 10 points.`, flags: discord_js_2.MessageFlags.Ephemeral });
});
client.login(process.env.DISCORD_TOKEN);
