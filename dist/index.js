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
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers
    ]
});
const filePath = 'usersPoints.json';
let usersPoints = {};
let currentBets = {};
let bettingOpen = false;
if (fs.existsSync(filePath)) {
    usersPoints = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
const savePoints = () => {
    fs.writeFileSync(filePath, JSON.stringify(usersPoints, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité
};
client.once('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(`Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
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
            name: 'points',
            description: 'Check your points',
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
            description: 'Voir la liste des joueurs ayant parié sur le joueur 1 et le joueur 2'
        },
        {
            name: 'deleteuser',
            description: 'Supprimer un utilisateur enregistré',
            options: [
                {
                    name: 'userid',
                    type: discord_js_1.ApplicationCommandOptionType.String,
                    description: 'ID de l\'utilisateur à supprimer',
                    required: true
                }
            ]
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
            yield interaction.reply('Une erreur est survenue. Impossible de vérifier les rôles de l’utilisateur.');
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
        if (!hasRole('Deamon Punk')) {
            yield interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
            return;
        }
        if (!joinedMoreThan7DaysAgo()) {
            yield interaction.reply({ content: 'Vous devez être membre du serveur depuis au moins 7 jours pour utiliser cette commande.', ephemeral: true });
            return;
        }
        switch (commandName) {
            case 'register':
                yield handleRegister(interaction);
                break;
            case 'placeyourbets':
                if (hasRole('BetManager')) {
                    yield handlePlaceYourBets(interaction);
                }
                else {
                    yield interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
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
                    yield interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
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
                        yield interaction.reply('Le gagnant doit être 1 ou 2.');
                    }
                }
                else {
                    yield interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
                }
                break;
            case 'betslist':
                if (hasRole('BetManager')) {
                    yield handleBetsList(interaction);
                }
                else {
                    yield interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
                }
                break;
            case 'deleteuser':
                if (hasRole('BetManager')) {
                    yield handleDeleteUser(interaction);
                }
                else {
                    yield interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
                }
                break;
            default:
                yield interaction.reply({ content: 'Commande inconnue.', ephemeral: true });
                break;
        }
    }
    else if (interaction.isButton()) {
        const userId = interaction.user.id;
        if (!usersPoints[userId]) {
            yield interaction.reply({ content: 'Inscrivez-vous d\'abord en utilisant /register.', ephemeral: true });
            return;
        }
        currentBets[userId] = { amount: 0, betOn: interaction.customId };
        yield interaction.reply({ content: `Vous avez choisi ${interaction.customId}. Entrez le montant que vous souhaitez parier :`, ephemeral: true });
    }
}));
client.on('messageCreate', (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (!bettingOpen || message.author.bot)
        return;
    const userId = message.author.id;
    const currentBet = currentBets[userId];
    if (!currentBet)
        return;
    const betAmount = parseInt(message.content);
    if (isNaN(betAmount) || betAmount <= 0) {
        yield message.reply('Montant du pari invalide. Essayez à nouveau.');
        return;
    }
    if (usersPoints[userId].points < betAmount) {
        yield message.reply('Points insuffisants. Essayez un montant inférieur.');
        return;
    }
    usersPoints[userId].points -= betAmount; // Assurez-vous d'accéder à la propriété 'points'
    currentBets[userId].amount = betAmount;
    savePoints();
    const playerName = currentBet.betOn === 'player1' ? 'Joueur 1' : 'Joueur 2';
    yield message.reply(`Vous avez parié ${betAmount} points sur ${playerName}.`);
}));
const handleRegister = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = interaction.user.id;
    const member = interaction.member;
    const userName = member.nickname || interaction.user.username;
    if (usersPoints[userId]) {
        yield interaction.reply({ content: 'Vous êtes déjà enregistré.', ephemeral: true });
        return;
    }
    usersPoints[userId] = { points: 100, name: userName };
    savePoints();
    yield interaction.reply({ content: 'Inscription réussie ! Vous avez reçu 100 points.', ephemeral: true });
});
const handlePlaceYourBets = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    bettingOpen = true;
    currentBets = {};
    const player1Option = interaction.options.get('player1name');
    const player2Option = interaction.options.get('player2name');
    const player1Name = player1Option ? player1Option.value : 'Joueur 1';
    const player2Name = player2Option ? player2Option.value : 'Joueur 2';
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('player1')
        .setLabel(player1Name)
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId('player2')
        .setLabel(player2Name)
        .setStyle(discord_js_1.ButtonStyle.Primary));
    yield interaction.reply({ content: `Les paris sont ouverts ! Vous avez 60 secondes pour choisir entre ${player1Name} et ${player2Name}.`, components: [row] });
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        bettingOpen = false;
        yield interaction.followUp('Les paris sont fermés !');
    }), 60000);
});
const handlePoints = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    // Recharge les points depuis le fichier
    if (fs.existsSync(filePath)) {
        usersPoints = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
        yield interaction.reply('Vous n\'êtes pas encore enregistré. Utilisez /register pour vous inscrire.');
        return;
    }
    const userInfo = usersPoints[userId];
    yield interaction.reply({ content: `Vous avez ${userInfo.points} points, ${userInfo.name}.`, ephemeral: true });
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
    yield interaction.reply('Tous les paris ont été annulés et les points ont été restitués.');
});
const handleLeaderboard = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const sortedUsers = Object.entries(usersPoints).sort((a, b) => b[1].points - a[1].points);
    const top10 = sortedUsers.slice(0, 10);
    const leaderboard = top10.map(([userId, userInfo], index) => {
        const user = client.users.cache.get(userId);
        return `${index + 1}. ${(user === null || user === void 0 ? void 0 : user.tag) || userInfo.name} - ${userInfo.points} points`;
    }).join('\n');
    yield interaction.reply(`Classement des meilleurs parieurs :\n\n${leaderboard}`);
});
const handleBetsList = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const player1Bets = Object.entries(currentBets)
        .filter(([, bet]) => bet.betOn === 'player1')
        .map(([userId, bet]) => { var _a; return `${((_a = client.users.cache.get(userId)) === null || _a === void 0 ? void 0 : _a.tag) || 'Utilisateur inconnu'}: ${bet.amount} points`; });
    const player2Bets = Object.entries(currentBets)
        .filter(([, bet]) => bet.betOn === 'player2')
        .map(([userId, bet]) => { var _a; return `${((_a = client.users.cache.get(userId)) === null || _a === void 0 ? void 0 : _a.tag) || 'Utilisateur inconnu'}: ${bet.amount} points`; });
    yield interaction.reply(`Liste des paris :\n\n**Joueur 1 :**\n${player1Bets.join('\n') || 'Aucun pari'}\n\n**Joueur 2 :**\n${player2Bets.join('\n') || 'Aucun pari'}`);
});
const handleWin = (interaction, winningPlayer) => __awaiter(void 0, void 0, void 0, function* () {
    let totalBetAmount = 0;
    let winnerBetAmount = 0;
    for (const bet of Object.values(currentBets)) {
        totalBetAmount += bet.amount;
        if (bet.betOn === winningPlayer) {
            winnerBetAmount += bet.amount;
        }
    }
    if (winnerBetAmount === 0) {
        yield interaction.reply('Aucun pari n\'a été placé sur le gagnant.');
        return;
    }
    const winningsRatio = totalBetAmount / winnerBetAmount;
    for (const [userId, bet] of Object.entries(currentBets)) {
        if (bet.betOn === winningPlayer && usersPoints[userId]) {
            usersPoints[userId].points += Math.floor(bet.amount * winningsRatio); // Assurez-vous que 'points' est bien un nombre
        }
    }
    savePoints();
    currentBets = {};
    bettingOpen = false;
    yield interaction.reply(`Le joueur ${winningPlayer === 'player1' ? 1 : 2} a gagné ! Les points ont été redistribués.`);
});
const handleDeleteUser = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userIdToDelete = (_a = interaction.options.get('userid')) === null || _a === void 0 ? void 0 : _a.value;
    if (userIdToDelete && usersPoints[userIdToDelete]) {
        const userNameToDelete = usersPoints[userIdToDelete].name;
        delete usersPoints[userIdToDelete];
        savePoints();
        yield interaction.reply({ content: `L'utilisateur ${userNameToDelete} (${userIdToDelete}) a été supprimé.`, ephemeral: true });
    }
    else {
        yield interaction.reply({ content: 'Utilisateur non trouvé.', ephemeral: true });
    }
});
client.login(process.env.DISCORD_TOKEN);
