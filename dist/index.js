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
const node_schedule_1 = __importDefault(require("node-schedule"));
dotenv_1.default.config();
const crypto_1 = __importDefault(require("crypto"));
const algorithm = process.env.ALGO;
const secretKey = Buffer.from(process.env.KEY, 'hex');
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
    createDataDebilusDir();
    const data = {
        usersPoints,
        debilusCloset,
        lastUpdateTime: lastUpdateTime.toISOString()
    };
    fs.writeFileSync('DataDebilus/decrypted_backup.json', JSON.stringify(data, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité
};
const saveTournamentParticipants = () => {
    const participantsArray = Array.from(tournamentParticipants);
    fs.writeFileSync('DataDebilus/tournamentParticipants.json', JSON.stringify(participantsArray, null, 2));
};
const loadTournamentParticipants = () => {
    if (fs.existsSync('DataDebilus/tournamentParticipants.json')) {
        const participantsArray = JSON.parse(fs.readFileSync('DataDebilus/tournamentParticipants.json', 'utf-8'));
        tournamentParticipants = new Set(participantsArray);
    }
};
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers
    ]
});
const pointsEmoji = '<a:GearPoint:1300144849688723486>'; // Use your emoji ID here
const betyEmoji = '<:Bety:1300151295180537978>';
const debilus = '<:debilus:1300218189703024670>';
const filePath = 'usersPoints.json';
let debilusCloset = 0;
let player1Name;
let player2Name;
let usersPoints = {};
let currentBets = {};
let bettingOpen = false;
let tournamentParticipants = new Set();
let lastUpdateTime = new Date();
const loadPoints = () => {
    if (fs.existsSync(filePath)) {
        try {
            const encryptedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const decryptedData = JSON.parse(decrypt(encryptedData));
            usersPoints = decryptedData.usersPoints || {};
            debilusCloset = decryptedData.debilusCloset || 0;
            lastUpdateTime = new Date(decryptedData.lastUpdateTime || Date.now());
        }
        catch (error) {
            console.error('Failed to decrypt data:', error);
        }
    }
};
const savePoints = () => {
    const data = {
        usersPoints,
        debilusCloset,
        lastUpdateTime: lastUpdateTime.toISOString()
    };
    const encryptedData = encrypt(JSON.stringify(data));
    fs.writeFileSync(filePath, JSON.stringify(encryptedData, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité
    // Créer un fichier de sauvegarde des données déchiffrées
    saveDecryptedBackup();
};
// Fonction pour ajouter des points à l'inventaire
const addPointsToInventory = () => {
    const now = new Date();
    const timeDifference = now.getTime() - lastUpdateTime.getTime();
    const cyclesPassed = Math.floor(timeDifference / (1000 * 60 * 60 * 12)); // Nombre de cycles de 12 heures écoulés
    for (const userId in usersPoints) {
        usersPoints[userId].inventory = Math.min(usersPoints[userId].inventory + cyclesPassed, 15);
    }
    lastUpdateTime = now; // Mettre à jour `lastUpdateTime`
    savePoints();
};
// Planifier la tâche pour qu'elle s'exécute à des heures fixes (12:00 AM et 12:00 PM)
node_schedule_1.default.scheduleJob('0 0 * * *', addPointsToInventory); // Exécute tous les jours à minuit
node_schedule_1.default.scheduleJob('0 12 * * *', addPointsToInventory); // Exécute tous les jours à midi
client.once('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(`Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
    loadPoints();
    addPointsToInventory();
    const commands = [
        {
            name: 'register',
            description: 'Register to get initial points',
        },
        {
            name: 'placeyourbets',
            description: 'Start a betting period',
            options: [
                {
                    name: 'player1name',
                    type: discord_js_1.ApplicationCommandOptionType.String,
                    description: 'Name of player 1',
                    required: true
                },
                {
                    name: 'player2name',
                    type: discord_js_1.ApplicationCommandOptionType.String,
                    description: 'Name of player 2',
                    required: true
                }
            ]
        },
        {
            name: 'addpoints',
            description: 'Add points to a user',
            options: [
                {
                    name: 'user',
                    type: discord_js_1.ApplicationCommandOptionType.User,
                    description: 'User to add points to',
                    required: true
                },
                {
                    name: 'points',
                    type: discord_js_1.ApplicationCommandOptionType.Integer,
                    description: 'Number of points to add',
                    required: true
                }
            ]
        },
        {
            name: 'points',
            description: 'Check your points',
        },
        {
            name: 'inventory',
            description: 'Check your inventory',
        },
        {
            name: 'claim',
            description: 'Claim your points from inventory',
        },
        {
            name: 'clearbets',
            description: 'Clear all bets in case of issues',
        },
        {
            name: 'leaderboard',
            description: 'Show leaderboard of top betters',
        },
        {
            name: 'win',
            description: 'Declare the winner and redistribute points',
            options: [
                {
                    name: 'winner',
                    type: discord_js_1.ApplicationCommandOptionType.Integer,
                    description: 'The winning player (1 or 2)',
                    required: true
                }
            ]
        },
        {
            name: 'betslist',
            description: 'See the list of players who bet on player 1 and player 2'
        },
        {
            name: 'deleteuser',
            description: 'Delete a registered user',
            options: [
                {
                    name: 'userid',
                    type: discord_js_1.ApplicationCommandOptionType.String,
                    description: 'ID of the user to delete',
                    required: true
                }
            ]
        },
        {
            name: 'backup',
            description: 'Encrypt and save data from decrypted backup'
        },
        {
            name: 'sendbackup',
            description: 'Send the decrypted backup file'
        },
        {
            name: 'addtournamentparticipant',
            description: 'Add a participant to the tournament',
            options: [
                {
                    name: 'user',
                    type: discord_js_1.ApplicationCommandOptionType.User,
                    description: 'The user to add to the tournament',
                    required: true
                }
            ]
        },
        {
            name: 'removetournamentparticipant',
            description: 'Remove a participant from the tournament',
            options: [
                {
                    name: 'user',
                    type: discord_js_1.ApplicationCommandOptionType.User,
                    description: 'The user to remove from the tournament',
                    required: true
                }
            ]
        },
        {
            name: 'listtournamentparticipants',
            description: 'List all participants in the tournament'
        },
        {
            name: 'presentation',
            description: 'Present Betty Bet and its functions'
        }
    ];
    const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('Started refreshing application (/) commands.');
        yield rest.put(discord_js_1.Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    }
    catch (error) {
        console.error(error);
    }
}));
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
        if (!hasRole('Dæmon Punk')) {
            yield interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }
        if (!joinedMoreThan7DaysAgo()) {
            yield interaction.reply({ content: 'You must have been a member of the server for at least 7 days to use this command.', ephemeral: true });
            return;
        }
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
                yield handleListTournamentParticipants(interaction);
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
            case 'inventory':
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
            case 'presentation':
                yield handlePresentation(interaction);
                break;
            default:
                yield interaction.reply({ content: 'Unknown command.', ephemeral: true });
                break;
        }
    }
    else if (interaction.isButton()) {
        const userId = interaction.user.id;
        if (!usersPoints[userId]) {
            yield interaction.reply({ content: 'Please register first using /register.', ephemeral: true });
            return;
        }
        yield handleBetSelection(interaction);
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
        return;
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
    currentBets[userId] = { amount: (currentBet.amount || 0) + betAmount, betOn: currentBet.betOn || "player1" }; // Remplacer "player1" par une valeur par défaut appropriée
    savePoints();
    // Ajouter une réaction au message de l'utilisateur
    yield message.react('✅'); // Remplace '✅' par l'emoji que tu préfères
}));
const handleRegister = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    const member = interaction.member;
    const userName = member.nickname || interaction.user.username;
    if (usersPoints[userId]) {
        yield interaction.reply({ content: `You are already registered.\n\n\n*Debilus* ${debilus}`, ephemeral: true });
        return;
    }
    usersPoints[userId] = { points: 100, name: userName, wins: 0, losses: 0, isDebilus: false, inventory: 0 };
    savePoints();
    yield interaction.reply({ content: `Registration successful!\n\nYou have received **100 ${pointsEmoji}** !!!`, ephemeral: true });
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
    currentBets[userId] = { amount: 0, betOn: interaction.customId };
    const points = usersPoints[userId].points;
    const chosenPlayerName = interaction.customId === 'player1' ? player1Name : player2Name;
    yield interaction.reply({
        content: `You have chosen ${chosenPlayerName}.\n\nYou have ${points}${pointsEmoji}\nEnter the amount you wish to bet:`,
        ephemeral: true
    });
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
    yield interaction.reply('All bets were void and points were refunded.');
});
const handleLeaderboard = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    loadPoints();
    const sortedUsers = Object.entries(usersPoints).sort((a, b) => b[1].points - a[1].points);
    const top10 = sortedUsers.slice(0, 10);
    const leaderboard = top10.map(([userId, userInfo], index) => {
        const user = client.users.cache.get(userId);
        return `${index + 1}. ${(user === null || user === void 0 ? void 0 : user.tag) || userInfo.name} - ${userInfo.points} ${pointsEmoji} Points`;
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
    yield interaction.reply(`Bets List:\n\n**Player 1:**\n${player1Bets.join('\n') || 'No bets'}\n\n**Player 2:**\n${player2Bets.join('\n') || 'No bets'}\n\n**Total points bet on Player 1:** ${totalPlayer1Bets} ${pointsEmoji}\n**Total points bet on Player 2:** ${totalPlayer2Bets} ${pointsEmoji}\n**Total points bet overall:** ${totalBets} ${pointsEmoji}\n\n**Betting Ratio (Player 1 / Player 2):** ${ratio}`);
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
    if (winnerBetAmount === 0) {
        // Ajouter tous les points dans le placard à debilus et compter une défaite pour chaque utilisateur
        for (const [userId, bet] of Object.entries(currentBets)) {
            if (bet.betOn !== winningPlayer) {
                usersPoints[userId].losses += 1; // Incrémenter le nombre de défaites
                if (usersPoints[userId].points === 0) {
                    usersPoints[userId].isDebilus = true; // Envoyer au placard à debilus
                }
            }
        }
        debilusCloset += totalBetAmount; // Ajouter tous les points dans le placard à debilus
        savePoints(); // Sauvegarder après avoir mis à jour debilusCloset
        const file = new discord_js_1.AttachmentBuilder('./images/crashboursier.png');
        const message2 = `Thanks for money, Debilus !\n\nAll GearPoints have been added to the **debilus closet** ! \nTotal GearPoints in debilus closet: **${debilusCloset}** ${pointsEmoji}`;
        yield interaction.reply({ content: `The winner is ${winningPlayerName} ! No bets were placed on the winner. ${message2}`, files: [file] });
        return;
    }
    const winningsRatio = totalBetAmount / winnerBetAmount;
    for (const [userId, bet] of Object.entries(currentBets)) {
        if (bet.betOn === winningPlayer) {
            usersPoints[userId].points += Math.floor(bet.amount * winningsRatio);
            usersPoints[userId].wins += 1; // Incrémenter le nombre de victoires
        }
        else {
            usersPoints[userId].losses += 1; // Incrémenter le nombre de défaites
            if (usersPoints[userId].points === 0) {
                usersPoints[userId].isDebilus = true; // Envoyer au placard à debilus
            }
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
});
const handleDeleteUser = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userIdToDelete = (_a = interaction.options.get('userid')) === null || _a === void 0 ? void 0 : _a.value;
    if (userIdToDelete && usersPoints[userIdToDelete]) {
        const userNameToDelete = usersPoints[userIdToDelete].name;
        delete usersPoints[userIdToDelete];
        savePoints();
        yield interaction.reply({ content: `The user ${userNameToDelete} (${userIdToDelete}) has been deleted.`, ephemeral: true });
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
    if (!usersPoints[userId]) {
        yield interaction.reply({ content: `User with id ${userId} is not registered`, ephemeral: true });
        return;
    }
    usersPoints[userId].points += pointsToAdd;
    usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
    savePoints();
    yield interaction.reply({ content: `${pointsToAdd} ${pointsEmoji} Points have been added to ${usersPoints[userId].name}.`, ephemeral: true });
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
        yield interaction.reply({ content: 'You have no points to claim.', ephemeral: true });
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
    yield interaction.reply({ content: `You have **${inventoryPoints}** ${pointsEmoji} in your inventory.`, ephemeral: true });
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
    lastUpdateTime = new Date(decryptedData.lastUpdateTime);
    yield interaction.reply({ content: 'Data from decrypted backup has been encrypted and saved successfully.', ephemeral: true });
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
        tournamentParticipants.add(user.id);
        saveTournamentParticipants();
        yield interaction.reply({ content: `${user.username} has been added to the tournament.`, ephemeral: true });
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
        yield interaction.reply({ content: `${user.username} has been removed from the tournament.`, ephemeral: true });
    }
    else {
        yield interaction.reply({ content: 'User not found.', ephemeral: true });
    }
});
// Appeler loadTournamentParticipants lors du démarrage
loadTournamentParticipants();
const handleListTournamentParticipants = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (tournamentParticipants.size === 0) {
        yield interaction.reply({ content: 'No participants in the tournament.', ephemeral: true });
        return;
    }
    const participantsList = Array.from(tournamentParticipants).map(id => {
        const user = client.users.cache.get(id);
        return user ? user.username : 'Unknown User';
    }).join('\n');
    yield interaction.reply({ content: `Tournament Participants:\n${participantsList}`, ephemeral: true });
});
const handlePresentation = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const presentation = `
Hi, I'm Betty Bet, your betting bot! Here’s what I can do:
  - **Register**: Use \`/register\` to sign up and get your initial points.
- **Place Your Bets**: Start a betting period with \`/placeyourbets\`, and choose between two players. **(BetManager only)**
  BetManager uses this command to start betting, bettors can choose who they want to bet on and the bet amount. \n **Warning**, placing several amounts during the betting phase will add up the amount of your bet, so place **wisely**
- **Check Points**: Use \`/points\` to see your current points.
- **Inventory**: Use \`/inventory\` to check the points you have in your inventory.
- **Claim Points**: Use \`/claim\` to add points from your inventory to your balance.
- **Clear Bets**: Use \`/clearbets\` to reset all bets in case of issues. **(BetManager only)**
- **Leaderboard**: See the top betters with \`/leaderboard\`.
- **Declare Winner**: Use \`/win\` to declare the winner and redistribute points. **(BetManager only)**
- **Bets List**: Check the list of bets placed with \`/betslist\`. **(BetManager only)**
- **Backup**: Use \`/backup\` to encrypt and save data from decrypted backup. **(BetManager only)**
- **Send Backup**: Get the decrypted backup file with \`/sendbackup\`. **(BetManager only)**

Here are some additional features:
  - **Automatic Points System**: Points are added to your inventory at fixed times every day (12:00 AM and 12:00 PM), up to a maximum of 15 points. You can claim these points using the \`/claim\` command.
- **Debilus Closet**: If no bets are placed on the winning player, all points are added to the Debilus Closet. If you have zero points, you will be sent to the Debilus Closet until you get points back, either through your inventory with \`/claim\` or by putting **1M gil** in the FC chest to recover **100** ${pointsEmoji}.

I’m here to make your betting experience fun and exciting! Let’s get started!
  `;
    yield interaction.reply({ content: presentation, ephemeral: true });
});
client.login(process.env.DISCORD_TOKEN);
