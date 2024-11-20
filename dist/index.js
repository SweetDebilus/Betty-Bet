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
const fs1 = require('fs');
const filePath = 'usersPoints.json';
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
let activeGuessGames = {}; // Canal ID -> Utilisateur ID
const blackjackGames = {};
const cardValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 10, 'Q': 10, 'K': 10, 'A': 11
};
const suits = ['♠', '♥', '♦', '♣'];
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
        const cardValue = card.slice(0, -1); // Extrait la valeur de la carte (2, 3, ..., A)
        value += cardValues[cardValue];
        if (cardValue === 'A')
            aces++;
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
    if (!fs1.existsSync(logDir)) {
        fs1.mkdirSync(logDir, { recursive: true });
    }
};
// Appeler la fonction pour s'assurer que le dossier existe 
ensureLogDirectoryExists(logFile);
const log = (message) => {
    fs1.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
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
});
const loadTournamentParticipants = () => __awaiter(void 0, void 0, void 0, function* () {
    if (fs.existsSync('DataDebilus/tournamentParticipants.json')) {
        const participantsArray = JSON.parse(fs.readFileSync('DataDebilus/tournamentParticipants.json', 'utf-8'));
        tournamentParticipants = new Map(participantsArray.map(participant => [participant.userId, participant.userName]));
    }
});
// Appeler loadTournamentParticipants lors du démarrage
loadTournamentParticipants();
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
    savePoints();
});
const sendNotification = (userId, points) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield client.users.fetch(userId);
    if (user && usersPoints[userId].notificationsEnabled) {
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('claim_yes')
            .setLabel('Yes')
            .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
            .setCustomId('claim_no')
            .setLabel('No')
            .setStyle(discord_js_1.ButtonStyle.Secondary));
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
        .setDescription('Start a betting period')
        .addStringOption(option => option.setName('player1name')
        .setDescription('Name of player 1')
        .setRequired(true))
        .addStringOption(option => option.setName('player2name')
        .setDescription('Name of player 2')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('addpoints')
        .setDescription('Add points to a user')
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
        .setDescription('Clear all bets in case of issues'),
    new discord_js_1.SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show leaderboard of top betters'),
    new discord_js_1.SlashCommandBuilder()
        .setName('win')
        .setDescription('Declare the winner and redistribute points')
        .addIntegerOption(option => option.setName('winner')
        .setDescription('The winning player (1 or 2)')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('betslist')
        .setDescription('See the list of players who bet on player 1 and player 2'),
    new discord_js_1.SlashCommandBuilder()
        .setName('deleteuser')
        .setDescription('Delete a registered user')
        .addStringOption(option => option.setName('userid')
        .setDescription('ID of the user to delete')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('backup')
        .setDescription('Encrypt and save data from decrypted backup'),
    new discord_js_1.SlashCommandBuilder()
        .setName('sendbackup')
        .setDescription('Send the decrypted backup file'),
    new discord_js_1.SlashCommandBuilder()
        .setName('addtournamentparticipant')
        .setDescription('Add a participant to the tournament')
        .addUserOption(option => option.setName('user')
        .setDescription('The user to add to the tournament')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('removetournamentparticipant')
        .setDescription('Remove a participant from the tournament')
        .addUserOption(option => option.setName('user')
        .setDescription('The user to remove from the tournament')
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName('listtournamentparticipants')
        .setDescription('List all participants in the tournament'),
    new discord_js_1.SlashCommandBuilder()
        .setName('cleartournamentparticipants')
        .setDescription('Clear the list of tournament participants'),
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
        .setDescription('View global betting statistics'),
    new discord_js_1.SlashCommandBuilder()
        .setName('guess')
        .setDescription('Play a guessing game! Try to guess the number between 1 and 10000 in 40sec.'),
    new discord_js_1.SlashCommandBuilder()
        .setName('transferdebilus')
        .setDescription('Transfer all GearPoints from the debilus closet to a specific user and empty the closet.')
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
        .setDescription('Add an item to the store')
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
        .setDescription('view purchase history in the store'),
    new discord_js_1.SlashCommandBuilder()
        .setName('myitems')
        .setDescription('view the items you own'),
    new discord_js_1.SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play a game of blackjack')
];
const commandData = commands.map(command => command.toJSON());
client.once('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    log(`Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
    loadPoints();
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
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId('blackjack_stand')
        .setLabel('Stand')
        .setStyle(discord_js_1.ButtonStyle.Secondary));
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
        const joinedMoreThan7DaysAgo = () => {
            const joinedTimestamp = member.joinedTimestamp;
            if (!joinedTimestamp) {
                return false;
            }
            const now = Date.now();
            const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
            return now - joinedTimestamp >= sevenDaysInMillis;
        };
        if (!hasRole(process.env.ROLE)) {
            yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }
        if (!joinedMoreThan7DaysAgo()) {
            yield interaction.reply({ content: 'You must have been a member of the server for at least 7 days to use this command.', ephemeral: true });
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
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'removetournamentparticipant':
                    if (hasRole('BetManager')) {
                        yield handleRemoveTournamentParticipant(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'listtournamentparticipants':
                    if (hasRole('BetManager')) {
                        yield handleListTournamentParticipants(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'cleartournamentparticipants':
                    if (hasRole('BetManager')) {
                        yield handleClearTournamentParticipants(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'placeyourbets':
                    if (hasRole('BetManager')) {
                        yield handlePlaceYourBets(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
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
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'leaderboard':
                    yield handleLeaderboard(interaction);
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
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'betslist':
                    if (hasRole('BetManager')) {
                        yield handleBetsList(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'deleteuser':
                    if (hasRole('BetManager')) {
                        yield handleDeleteUser(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'addpoints':
                    if (hasRole('BetManager')) {
                        yield handleAddPoints(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
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
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'sendbackup':
                    if (hasRole('BetManager')) {
                        yield handleSendDecryptedBackup(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
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
                    yield handleBetHistory(interaction);
                    break;
                case 'stats':
                    yield handleStats(interaction);
                    break;
                case 'globalstats':
                    yield handleGlobalStats(interaction);
                    break;
                case 'guess':
                    yield handleGuess(interaction);
                    break;
                case 'transferdebilus':
                    if (hasRole('BetManager')) {
                        yield handleTransferDebilus(interaction);
                    }
                    else {
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'buyitem':
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
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'listitems':
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
                        yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    }
                    break;
                case 'myitems':
                    yield handleItemsInventory(interaction);
                    break;
                case 'blackjack':
                    const userId = interaction.user.id;
                    if (usersPoints[userId].points < 10) {
                        yield interaction.reply({ content: 'You need at least 10 points to play blackjack.', ephemeral: true });
                        return;
                    }
                    const { playerHand, dealerHand } = startBlackjackGame(userId, 10);
                    usersPoints[userId].points -= 10;
                    yield interaction.reply({ content: `\n*Your hand*: \n**|${playerHand.join('| |')}|**\n\n*Betty Bet's visible card*: \n**|${dealerHand[0]}|**\n`, components: [createBlackjackActionRow()], ephemeral: true });
                    savePoints();
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
            yield interaction.reply({ content: 'Please register first using /register.', ephemeral: true });
            return;
        }
        if (interaction.customId.startsWith('claim_')) {
            yield handleClaimYesNo(interaction);
        }
        else if (interaction.customId === 'blackjack_hit' || interaction.customId === 'blackjack_stand') {
            const game = blackjackGames[userId];
            if (!game) {
                yield interaction.reply({ content: 'No active blackjack game found. Start a new game with /blackjack', ephemeral: true });
                return;
            }
            if (interaction.customId === 'blackjack_hit') {
                game.playerHand.push(drawCard());
                const playerValue = calculateHandValue(game.playerHand);
                if (playerValue > 21) {
                    delete blackjackGames[userId];
                    yield interaction.update({ content: `\n*Your hand*: \n**|${game.playerHand.join('| |')}|**\n\n**You bust!** *Betty Bet wins.*`, components: [] });
                    debilusCloset += 10;
                    savePoints();
                    return;
                }
                yield interaction.update({ content: `\n*Your hand*: \n**|${game.playerHand.join('| |')}|**\n\n*Betty Bet's visible card*: \n**|${game.dealerHand[0]}|**\n`, components: [createBlackjackActionRow()] });
            }
            else if (interaction.customId === 'blackjack_stand') {
                let dealerValue = calculateHandValue(game.dealerHand);
                while (dealerValue < 17) {
                    game.dealerHand.push(drawCard());
                    dealerValue = calculateHandValue(game.dealerHand);
                }
                const playerValue = calculateHandValue(game.playerHand);
                let resultMessage = `\n*Your hand*: \n**|${game.playerHand.join('| |')}|**\n\n*Betty Bet's hand*: \n**|${game.dealerHand.join('| |')}|**\n\n`;
                if (dealerValue > 21 || playerValue > dealerValue) {
                    usersPoints[userId].points += game.bet * 2;
                    resultMessage += '**You win!**';
                    delete blackjackGames[userId];
                    savePoints();
                }
                else if (playerValue < dealerValue) {
                    resultMessage += '**Betty Bet wins!**';
                    debilusCloset += 10;
                    delete blackjackGames[userId];
                    savePoints();
                }
                else {
                    usersPoints[userId].points += game.bet;
                    resultMessage += '**It\'s a tie!**';
                    delete blackjackGames[userId];
                    savePoints();
                }
                yield interaction.update({ content: resultMessage, components: [] });
            }
        }
        else {
            yield handleBetSelection(interaction);
        }
    }
}));
client.on('messageCreate', (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (!bettingOpen || message.author.bot)
        return;
    const userId = message.author.id;
    if (tournamentParticipants.has(userId)) {
        const reply = yield message.reply({ content: 'You are participating in the tournament and cannot place bets during the event.' });
        setTimeout(() => reply.delete(), 3000); // Supprimer le message après 3 secondes
        return;
    }
    const currentBet = currentBets[userId];
    if (!currentBet)
        return; // Vérifier si l'utilisateur a déjà sélectionné un joueur
    const betAmount = parseInt(message.content);
    if (isNaN(betAmount) || betAmount <= 0) {
        const reply = yield message.reply('Invalid bet amount. Please try again.');
        setTimeout(() => reply.delete(), 3000); // Supprimer le message après 3 secondes
        return;
    }
    if (usersPoints[userId].points < betAmount) {
        const reply = yield message.reply(`${pointsEmoji} not enough. Try a lower amount.`);
        setTimeout(() => reply.delete(), 3000); // Supprimer le message après 3 secondes
        return;
    }
    // Ajuster les points et ajouter le pari
    usersPoints[userId].points -= betAmount;
    currentBets[userId] = { amount: (currentBet.amount || 0) + betAmount, betOn: currentBet.betOn };
    // Mettre à jour l'historique des paris
    const betHistory = usersPoints[userId].betHistory;
    const chosenPlayerName = currentBet.betOn === 'player1' ? player1Name : player2Name;
    const lastBet = betHistory[betHistory.length - 1];
    if (lastBet && lastBet.result === 'pending' && lastBet.betOn === chosenPlayerName) {
        lastBet.amount += betAmount;
    }
    else {
        betHistory.push({
            betOn: chosenPlayerName,
            amount: betAmount,
            result: 'pending',
            date: new Date()
        });
    }
    savePoints();
    // Ajouter une réaction au message de l'utilisateur
    yield message.react('✅'); // Remplace '✅' par l'emoji que tu préfères
}));
const handleRegister = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    const member = interaction.member;
    const userName = member.nickname || interaction.user.displayName;
    if (usersPoints[userId]) {
        yield interaction.reply({ content: `You are already registered.\n\n\n*Debilus* ${debilus}`, ephemeral: true });
        return;
    }
    usersPoints[userId] = { points: 100, name: userName, wins: 0, losses: 0, isDebilus: false, inventory: 0, notificationsEnabled: false, betHistory: [], inventoryShop: [] };
    savePoints();
    yield interaction.reply({ content: `Registration successful!\n\nYou have received **100 ${pointsEmoji}** !!!\n\n **Optional**: This bot integrates a notification system, you can activate it by doing the command \`/togglenotification\` and Betty Bet will send you a DM when you reach 10 points in your inventory.`, ephemeral: true });
});
const handleToggleNotifications = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', ephemeral: true });
        return;
    }
    usersPoints[userId].notificationsEnabled = !usersPoints[userId].notificationsEnabled;
    savePoints();
    yield interaction.reply({ content: `Notifications have been ${usersPoints[userId].notificationsEnabled ? 'enabled' : 'disabled'}.`, ephemeral: true });
});
const handlePlaceYourBets = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    bettingOpen = true;
    currentBets = {};
    const player1Option = interaction.options.get('player1name');
    const player2Option = interaction.options.get('player2name');
    player1Name = player1Option ? player1Option.value : 'Player 1';
    player2Name = player2Option ? player2Option.value : 'Player 2';
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('player1')
        .setLabel(player1Name)
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId('player2')
        .setLabel(player2Name)
        .setStyle(discord_js_1.ButtonStyle.Primary));
    yield interaction.reply({ content: `**the bets are open !!!\n\n**You have **60 seconds** to choose between **${player1Name}** and **${player2Name}**.`, components: [row] });
    const channel = interaction.channel;
    if (channel) {
        channel.send(`${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}`);
    }
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        bettingOpen = false;
        yield interaction.followUp('**Bets are closed !**');
        if (channel) {
            channel.send(`${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}`);
            channel.send('*Thanks for money !*');
        }
    }), 60000);
});
const handleBetSelection = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    const customId = interaction.customId;
    // Vérifier si l'utilisateur essaie de parier sur un autre joueur
    if (currentBets[userId] && currentBets[userId].betOn !== customId) {
        yield interaction.reply({ content: 'You have already placed a bet on the other player. You cannot bet on both players.', ephemeral: true });
        return;
    }
    currentBets[userId] = { amount: 0, betOn: customId };
    const points = usersPoints[userId].points;
    const chosenPlayerName = customId === 'player1' ? player1Name : player2Name;
    if (!interaction.replied) {
        yield interaction.reply({
            content: `You have chosen ${chosenPlayerName}.\n\nYou have ${points}${pointsEmoji}\nEnter the amount you wish to bet:`,
            ephemeral: true
        });
    }
});
const handlePoints = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    loadPoints();
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use */register* to register.', ephemeral: true });
        return;
    }
    const userInfo = usersPoints[userId];
    const status = userInfo.isDebilus ? `you are a **Debilus** ${debilus}` : 'bettor';
    yield interaction.reply({ content: `**${userInfo.name}**\n\nYou have **${userInfo.points}** ${pointsEmoji}\n\n| **${userInfo.wins} wins** | **${userInfo.losses} losses** |\n\n**Status:** ${status}`, ephemeral: true });
});
const handleClearBets = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    for (const [userId, bet] of Object.entries(currentBets)) {
        if (usersPoints[userId]) {
            usersPoints[userId].points += bet.amount; // Assurez-vous que 'points' est bien un nombre
        }
    }
    savePoints();
    currentBets = {};
    bettingOpen = false;
    yield interaction.reply('All bets were void and Gearpoints were refunded.');
});
const handleLeaderboard = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    loadPoints();
    const sortedUsers = Object.entries(usersPoints).sort((a, b) => b[1].points - a[1].points);
    const top10 = sortedUsers.slice(0, 10);
    const leaderboard = top10.map(([userId, userInfo], index) => {
        const user = client.users.cache.get(userId);
        return `${index + 1}. ${(user === null || user === void 0 ? void 0 : user.displayName) || userInfo.name} - ${userInfo.points} ${pointsEmoji}`;
    }).join('\n');
    yield interaction.reply(`Ranking of the best bettors :\n\n${leaderboard}`);
});
const handleBetsList = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    let totalPlayer1Bets = 0;
    let totalPlayer2Bets = 0;
    const player1Bets = Object.entries(currentBets)
        .filter(([, bet]) => bet.betOn === 'player1')
        .map(([userId, bet]) => {
        var _a;
        totalPlayer1Bets += bet.amount;
        return `${((_a = client.users.cache.get(userId)) === null || _a === void 0 ? void 0 : _a.tag) || 'Unknown User'}: ${bet.amount} ${pointsEmoji}`;
    });
    const player2Bets = Object.entries(currentBets)
        .filter(([, bet]) => bet.betOn === 'player2')
        .map(([userId, bet]) => {
        var _a;
        totalPlayer2Bets += bet.amount;
        return `${((_a = client.users.cache.get(userId)) === null || _a === void 0 ? void 0 : _a.tag) || 'Unknown User'}: ${bet.amount} ${pointsEmoji}`;
    });
    const totalBets = totalPlayer1Bets + totalPlayer2Bets;
    const ratio = totalPlayer2Bets === 0 ? 'N/A' : (totalPlayer1Bets / totalPlayer2Bets).toFixed(2);
    yield interaction.reply(`Bets List:\n\n**Player 1:**\n${player1Bets.join('\n') || 'No bets'}\n\n**Player 2:**\n${player2Bets.join('\n') || 'No bets'}\n\n**Total points bet on Player 1:** ${totalPlayer1Bets} ${pointsEmoji}\n**Total GearPoints bet on Player 2:** ${totalPlayer2Bets} ${pointsEmoji}\n**Total GearPoints bet overall:** ${totalBets} ${pointsEmoji}\n\n**Betting Ratio (Player 1 / Player 2):** ${ratio}`);
});
const handleWin = (interaction, winningPlayer) => __awaiter(void 0, void 0, void 0, function* () {
    let totalBetAmount = 0;
    let winnerBetAmount = 0;
    let loserBetAmount = 0;
    const winningPlayerName = winningPlayer === 'player1' ? player1Name : player2Name;
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
        yield interaction.reply({ content: message, ephemeral: true });
        return;
    }
    if (winnerBetAmount === 0) {
        // Ajouter tous les points dans le placard à debilus
        debilusCloset += totalBetAmount;
        savePoints(); // Sauvegarder après avoir mis à jour debilusCloset
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
        savePoints();
        return;
    }
    const winningsRatio = totalBetAmount / winnerBetAmount;
    for (const [userId, bet] of Object.entries(currentBets)) {
        if (bet.betOn === winningPlayer) {
            usersPoints[userId].points += Math.floor(bet.amount * winningsRatio);
            usersPoints[userId].wins += 1; // Incrémenter le nombre de victoires
            // Mettre à jour le résultat du pari dans l'historique
            const betHistory = usersPoints[userId].betHistory;
            betHistory[betHistory.length - 1].result = 'win';
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
        }
        else {
            usersPoints[userId].losses += 1; // Incrémenter le nombre de défaites
            // Mettre à jour le résultat du pari dans l'historique
            const betHistory = usersPoints[userId].betHistory;
            betHistory[betHistory.length - 1].result = 'loss';
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
        }
    }
    savePoints();
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
        savePoints();
        yield interaction.reply({ content: `The user **${userNameToDelete}** (${userIdToDelete}) has been deleted.`, ephemeral: true });
    }
    else {
        yield interaction.reply({ content: 'User no found', ephemeral: true });
    }
});
const handleAddPoints = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userOption = interaction.options.get('user');
    const pointsOption = interaction.options.get('points');
    const userId = userOption === null || userOption === void 0 ? void 0 : userOption.value;
    const pointsToAdd = pointsOption === null || pointsOption === void 0 ? void 0 : pointsOption.value;
    if (userId == bettyBettId) {
        debilusCloset += pointsToAdd;
        yield interaction.reply({ content: `**${pointsToAdd}** points have been added to DebilusCloset.`, ephemeral: true });
        savePoints();
        return;
    }
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: `User with id ${userId} is not registered`, ephemeral: true });
        return;
    }
    usersPoints[userId].points += pointsToAdd;
    usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
    savePoints();
    yield interaction.reply({ content: `**${pointsToAdd}** ${pointsEmoji} Points have been added to **${usersPoints[userId].name}**.`, ephemeral: true });
});
const handleClaim = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    loadPoints();
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use `/register` to register.', ephemeral: true });
        return;
    }
    const pointsToClaim = usersPoints[userId].inventory;
    if (pointsToClaim > 0) {
        usersPoints[userId].points += pointsToClaim;
        usersPoints[userId].inventory = 0;
        usersPoints[userId].isDebilus = false; // Mettre à jour le statut debilus
        savePoints();
        yield interaction.reply({ content: `You have claimed **${pointsToClaim}** ${pointsEmoji}.\n\nYou now have **${usersPoints[userId].points}** ${pointsEmoji}`, ephemeral: true });
    }
    else {
        yield interaction.reply({ content: 'You have no points to claim. try again later !', ephemeral: true });
    }
});
const handleInventory = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    loadPoints();
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: `You are not registered yet. Use */register* to register.`, ephemeral: true });
        return;
    }
    const inventoryPoints = usersPoints[userId].inventory;
    yield interaction.reply({ content: `You have **${inventoryPoints}** ${pointsEmoji} in your Point Vault.`, ephemeral: true });
});
const handleBackup = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    createDataDebilusDir();
    if (!fs.existsSync('DataDebilus/decrypted_backup.json')) {
        yield interaction.reply({ content: 'No decrypted backup found.', ephemeral: true });
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
    yield interaction.reply({ content: 'Data from decrypted backup has been encrypted and **saved successfully** !', ephemeral: true });
});
const handleSendDecryptedBackup = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    createDataDebilusDir();
    if (!fs.existsSync('DataDebilus/decrypted_backup.json')) {
        yield interaction.reply({ content: 'No decrypted backup found.', ephemeral: true });
        return;
    }
    const file = new discord_js_1.AttachmentBuilder('DataDebilus/decrypted_backup.json');
    yield interaction.reply({ content: 'Here is the decrypted backup file.', files: [file], ephemeral: true });
});
const handleAddTournamentParticipant = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userOption = interaction.options.get('user');
    const user = userOption === null || userOption === void 0 ? void 0 : userOption.user;
    if (user) {
        tournamentParticipants.set(user.id, user.displayName); // Ajouter l'ID et le pseudo à la Map
        saveTournamentParticipants();
        yield interaction.reply({ content: `${user.displayName} has been added to the tournament.`, ephemeral: true });
    }
    else {
        yield interaction.reply({ content: 'User not found.', ephemeral: true });
    }
});
const handleRemoveTournamentParticipant = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userOption = interaction.options.get('user');
    const user = userOption === null || userOption === void 0 ? void 0 : userOption.user;
    if (user) {
        tournamentParticipants.delete(user.id);
        saveTournamentParticipants();
        yield interaction.reply({ content: `${user.displayName} has been removed from the tournament.`, ephemeral: true });
    }
    else {
        yield interaction.reply({ content: 'User not found.', ephemeral: true });
    }
});
const handleListTournamentParticipants = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (tournamentParticipants.size === 0) {
        yield interaction.reply({ content: 'No participants in the tournament.', ephemeral: true });
        return;
    }
    const participantsList = Array.from(tournamentParticipants.entries()).map(([id, username]) => {
        return `ID: ${id}, Pseudo: ${username}`;
    }).join('\n');
    yield interaction.reply({ content: `Tournament Participants:\n${participantsList}`, ephemeral: true });
});
const handleClearTournamentParticipants = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    tournamentParticipants.clear(); // Effacer tous les participants
    saveTournamentParticipants(); // Sauvegarder l'état vide
    yield interaction.reply({ content: 'All tournament participants have been cleared.', ephemeral: true });
});
const handleClaimYesNo = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        if (!interaction.replied) {
            yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', ephemeral: true });
        }
        return;
    }
    if (interaction.customId === 'claim_yes') {
        const pointsToClaim = usersPoints[userId].inventory;
        usersPoints[userId].points += pointsToClaim;
        usersPoints[userId].inventory = 0;
        savePoints();
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
Hello ! I'm **Betty Bet**, your betting bot! Here’s a quick guide to all the commands available to help you make the most of our betting experience:

1. **/register**
   - Register to get initial GearPoints and start betting.
2. **/points**
   - Check your current GearPoints and status.
3. **/inventory**
   - Check the GearPoints in your inventory.
4. **/claim**
   - Claim GearPoints from your inventory to add them to your balance.
5. **/leaderboard**
   - Show the leaderboard of top betters.
6. **/bethistory**
   - View your betting history.
7. **/stats**
   - View your detailed statistics.
8. **/globalstats**
   - View global betting statistics.
9. **/togglenotifications**
   - Toggle notifications for inventory GearPoints. *This feature is optional, by default it is disabled*
10. **/clearmessages**
    - Clear all private messages sent by the bot.
11. **/presentation**
    - Present Betty Bet and its features.
12. **/guess**
    - Play a guessing game ! Try to guess the number between 1 and 10,000 in 40sec. (**+5 GearPoints** if you win, **-10 GearPoints** if you lose)\n  **Warning**: use this command in the #betty-bet-game channel and one person at a time

`;
    const part2 = `
### Commands reserved for **BetManager** role:

13. **/placeyourbets**
   - Start a betting period between two players.
   - Options:
     - \`player1name\`: Name of player 1
     - \`player2name\`: Name of player 2
14. **/addpoints**
   - Add GearPoints to a specified user.
   - Options:
     - \`user\`: User to add GearPoints to
     - \`points\`: Number of GearPoints to add
15. **/clearbets**
   - Clear all bets in case of issues and refund GearPoints.
16. **/win**
   - Declare the winner and redistribute GearPoints.
   - Options:
     - \`winner\`: The winning player (1 or 2)
17. **/betslist**
    - See the list of bets placed on each player.
18. **/deleteuser**
    - Delete a registered user.
    - Options:
      - \`userid\`: ID of the user to delete
19. **/backup**
    - Encrypt and save data from decrypted backup.
20. **/sendbackup**
    - Send the decrypted backup file.
21. **/addtournamentparticipant**
    - Add a user to the tournament participant list.
    - Options:
      - \`user\`: User to add
22. **/removetournamentparticipant**
    - Remove a user from the tournament participant list.
    - Options:
      - \`user\`: User to remove
23. **/listtournamentparticipants**
    - List all tournament participants.
24. **/cleartournamentparticipants**
    - Clear the list of tournament participants.

`;
    const part3 = `
Here are some additional features:
  - **Automatic Points System**: Points are added to your inventory at fixed times every day (12:00 AM and 12:00 PM), up to a maximum of 15 points. You can claim these points using the \`/claim\` command.
- **Debilus Closet**: If no bets are placed on the winning player, all points are added to the Debilus Closet. If you have zero points, you will be sent to the Debilus Closet until you get points back, either through your inventory with \`/claim\` or by putting **1M gil** in the FC chest to recover **100** ${pointsEmoji}.

I’m here to make your betting experience fun and exciting! Let’s get started!
  `;
    yield interaction.reply({ content: part1, ephemeral: true });
    yield interaction.followUp({ content: part2, ephemeral: true });
    yield interaction.followUp({ content: part3, ephemeral: true });
});
const handleClearMessages = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    const user = yield client.users.fetch(userId);
    if (!user) {
        yield interaction.reply({ content: 'User not found.', ephemeral: true });
        return;
    }
    try {
        const dmChannel = yield user.createDM();
        const messages = yield dmChannel.messages.fetch({ limit: 100 });
        const botMessages = messages.filter(msg => { var _a; return msg.author.id === ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id); });
        for (const message of botMessages.values()) {
            yield message.delete();
        }
        yield interaction.reply({ content: 'All private messages sent by the bot have been cleared.', ephemeral: true });
    }
    catch (error) {
        log(`Failed to clear messages for user ${userId}: ${error}`);
        yield interaction.reply({ content: 'Failed to clear messages.', ephemeral: true });
    }
});
const handleBetHistory = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', ephemeral: true });
        return;
    }
    const betHistory = usersPoints[userId].betHistory;
    if (betHistory.length === 0) {
        yield interaction.reply({ content: 'You have no betting history.', ephemeral: true });
        return;
    }
    let historyMessage = 'Your Betting History:\n';
    betHistory.forEach((bet, index) => __awaiter(void 0, void 0, void 0, function* () {
        const betInfo = `\n**Bet ${index + 1}:**\nDate: ${bet.date.toLocaleString()}\nBet On: ${bet.betOn}\nAmount: ${bet.amount}${pointsEmoji}\nResult: ${bet.result}\n`;
        if ((historyMessage + betInfo).length > 2000) {
            yield interaction.reply({ content: historyMessage, ephemeral: true });
            historyMessage = 'Your Betting History (continued):\n';
        }
        historyMessage += betInfo;
    }));
    yield interaction.reply({ content: historyMessage, ephemeral: true });
});
const handleStats = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', ephemeral: true });
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

- ${debcoins} **Total GearPoints**: ${totalPoints} ${pointsEmoji}
- 💪 **Total Wins**: ${totalWins}
- 😢 **Total Losses**: ${totalLosses}
- 🎲 **Total Bets**: ${totalBets}
- 📈 **Win Percentage**: ${winPercentage}%
- 📉 **Loss Percentage**: ${lossPercentage}%
  `;
    yield interaction.reply({ content: statsMessage, ephemeral: true });
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

- ${debcoins} **Total Points**: ${totalPoints} ${pointsEmoji}
- 🏆 **Total Wins**: ${totalWins}
- 😢 **Total Losses**: ${totalLosses}
- 🎲 **Total Bets**: ${totalBets}
- 📈 **Global Win Percentage**: ${winPercentage}%
- 📉 **Global Loss Percentage**: ${lossPercentage}%
  `;
    yield interaction.reply({ content: globalStatsMessage });
});
const handleGuess = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const allowedChannelId = process.env.CHANNEL; // Remplacez par l'ID de votre canal #Betty-Bet-Game
    const channelId = interaction.channelId;
    if (channelId !== allowedChannelId) {
        const reply = yield interaction.reply({ content: 'This command can only be used in the #Betty-Bet-Game channel.', ephemeral: true });
        setTimeout(() => reply.delete(), 3000);
        return;
    }
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        const reply = yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', ephemeral: true });
        setTimeout(() => reply.delete(), 3000);
        return;
    }
    if (activeGuessGames[channelId]) {
        const reply = yield interaction.reply({ content: 'A guessing game is already in progress in this channel. Please wait for it to finish.', ephemeral: true });
        setTimeout(() => reply.delete(), 3000);
        return;
    }
    activeGuessGames[channelId] = userId; // Marquer le jeu comme actif
    const numberToGuess = Math.floor(Math.random() * 10000) + 1;
    yield interaction.reply({ content: 'Guess a number between 1 and 10000!' });
    const channel = interaction.channel;
    if (!channel || !(channel instanceof discord_js_1.TextChannel)) {
        yield interaction.followUp({ content: 'Unable to start the guessing game as the channel is not available or is not a text channel.', ephemeral: true });
        delete activeGuessGames[channelId]; // Nettoyer l'état en cas d'erreur
        return;
    }
    const filter = (response) => {
        return !isNaN(Number(response.content)) && response.author.id === userId;
    };
    const messagesToDelete = [];
    const collector = channel.createMessageCollector({ filter, time: 40000 });
    collector.on('collect', (response) => __awaiter(void 0, void 0, void 0, function* () {
        const guess = Number(response.content);
        messagesToDelete.push(response);
        if (guess === numberToGuess) {
            usersPoints[userId].points += 5; // Gagner 5 GearPoints en cas de succès
            savePoints();
            yield response.reply({ content: `Congratulations! You guessed the correct number: ${numberToGuess}. You have won 5 GearPoints.` });
            collector.stop('guessed correctly');
        }
        else if (guess < numberToGuess) {
            const reply = yield response.reply({ content: 'Higher!' });
            messagesToDelete.push(reply);
        }
        else {
            const reply = yield response.reply({ content: 'Lower!' });
            messagesToDelete.push(reply);
        }
    }));
    collector.on('end', (collected, reason) => {
        if (reason !== 'guessed correctly') {
            const pointsLost = Math.min(10, usersPoints[userId].points); // Nombre de points à perdre
            usersPoints[userId].points -= pointsLost; // Perdre les points
            debilusCloset += pointsLost; // Ajouter les points perdus au debilus closet
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
            savePoints();
            interaction.followUp({ content: `Time is up! The correct number was: ${numberToGuess}. You have lost 10 GearPoints, which have been added to the debilus closet.\n\nTotal GearPoints in debilus closet: **${debilusCloset}**` });
            ;
        }
        const startTime = performance.now();
        // Supprimer tous les messages collectés après la fin du jeu
        messagesToDelete.forEach(message => {
            message.delete();
        });
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        log(`Temps d'exécution : ${executionTime} millisecondes`);
        delete activeGuessGames[channelId]; // Nettoyer l'état après la fin du jeu
    });
});
const handleTransferDebilus = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userOption = interaction.options.get('user');
    const user = userOption === null || userOption === void 0 ? void 0 : userOption.user;
    if (!user) {
        yield interaction.reply({ content: 'User not found.', ephemeral: true });
        return;
    }
    const userId = user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'The specified user is not registered.', ephemeral: true });
        return;
    }
    if (debilusCloset === 0) {
        yield interaction.reply({ content: 'The debilus closet is already empty.', ephemeral: true });
        return;
    }
    // Transfer the points from the debilus closet to the user
    usersPoints[userId].points += debilusCloset;
    const transferredPoints = debilusCloset;
    debilusCloset = 0;
    savePoints();
    yield interaction.reply({ content: `Transferred ${transferredPoints} GearPoints from the debilus closet to ${user.username}. The debilus closet is now empty.`, ephemeral: true });
});
const handleBuyItem = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield loadPoints(); // Charger les points depuis le fichier
    const userId = interaction.user.id;
    const itemName = (_a = interaction.options.get('itemname', true)) === null || _a === void 0 ? void 0 : _a.value;
    const quantity = (_b = interaction.options.get('quantity', true)) === null || _b === void 0 ? void 0 : _b.value;
    // Vérifier si l'utilisateur existe
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'User not found', ephemeral: true });
        return;
    }
    // Vérifier si l'article existe dans la boutique
    if (!store[itemName]) {
        yield interaction.reply({ content: 'Item not found', ephemeral: true });
        return;
    }
    const item = store[itemName];
    const totalPrice = item.unitPrice * quantity;
    // Vérifier si l'utilisateur a suffisamment de points
    if (usersPoints[userId].points < totalPrice) {
        yield interaction.reply({ content: 'Not enough points', ephemeral: true });
        return;
    }
    // Vérifier si la boutique a suffisamment d'articles en stock
    if (item.quantity < quantity) {
        yield interaction.reply({ content: 'Not enough items in stock', ephemeral: true });
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
    yield interaction.reply({ content: `Successfully purchased ${quantity} ${item.name}(s)`, ephemeral: true });
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
    yield interaction.reply({ content: `Added ${quantity} ${itemName}(s) to the store`, ephemeral: true });
});
const handleListItems = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    let storeItems = 'Available items in the store:\n\n';
    for (const itemName in store) {
        const item = store[itemName];
        storeItems += `${item.name} - *Quantity*: **${item.quantity}** | *Unit Price*: **${item.unitPrice}** ${pointsEmoji}\n`;
    }
    yield interaction.reply({ content: storeItems, ephemeral: true });
});
const handleViewPurchaseHistory = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const allPurchaseRecords = Object.values(purchaseHistory);
    if (allPurchaseRecords.length === 0) {
        yield interaction.reply({ content: 'No purchase history found.', ephemeral: true });
        return;
    }
    // Trier les enregistrements d'achat par nom d'utilisateur
    allPurchaseRecords.sort((a, b) => a.userName.localeCompare(b.userName));
    const historyMessage = allPurchaseRecords.map(record => {
        const date = new Date(record.timestamp);
        const formattedDate = formatDate(date);
        return `*User*: **${record.userName}**\n- *Item*: **${record.itemName}**\n- *Quantity*: **${record.quantity}**\n- *Total Price*: **${record.totalPrice}** ${pointsEmoji}\n- *Date*: **${formattedDate}**\n`;
    }).join('\n');
    yield interaction.reply({ content: `Global purchase history:\n\n${historyMessage}`, ephemeral: true });
});
const handleItemsInventory = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    let inventoryItemsMessage = `**Item Inventory**:\n`;
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', ephemeral: true });
        return;
    }
    const items = usersPoints[userId].inventoryShop;
    if (items.length === 0) {
        yield interaction.reply({ content: 'you have no items in your inventory', ephemeral: true });
        return;
    }
    items.forEach((item, index) => __awaiter(void 0, void 0, void 0, function* () {
        const itemInfo = `\n**Item ${index + 1}**:\n- *Name*: **${item.name}**\n- *Quantity*: **${item.quantity}**\n`;
        inventoryItemsMessage += itemInfo;
    }));
    yield interaction.reply({ content: inventoryItemsMessage, ephemeral: true });
});
client.login(process.env.DISCORD_TOKEN);
