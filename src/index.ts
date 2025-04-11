import { Client, GatewayIntentBits, REST, Routes, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, GuildMember, GuildMemberRoleManager, CommandInteraction, TextChannel, ButtonInteraction, Message, SlashCommandBuilder, InteractionType, User } from 'discord.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import schedule from 'node-schedule';
dotenv.config();
import crypto from 'crypto';
import { MessageFlags } from 'discord.js';
import { userInfo } from 'os';

const algorithm = process.env.ALGO!;
const secretKey = Buffer.from(process.env.KEY!, 'hex');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const pointsEmoji = process.env.POINTS!;
const betyEmoji = process.env.BETTY!;
const debilus = process.env.DEBILUS!;
const debcoins = process.env.DEBCOIN!;
const bettyBettId = process.env.BETTYID!;
const logFile = process.env.PATHLOG!;
const restricted = false;
const fs1 = require('fs');
const filePath = 'usersPoints.json';
let maintenanceMode: boolean = false;
let debilusCloset = 0;
let player1Name: string;
let player2Name: string;
let usersPoints: { [key: string]: { points: number, name: string, wins: number, losses: number, isDebilus: boolean, inventory: number, notificationsEnabled: boolean, betHistory: { betOn: string, amount: number, result: string, date: Date  }[], inventoryShop: { name: string, quantity: number }[], winMatch: number, loseMatch: number}} = {};
let currentBets: { [key: string]: { amount: number, betOn: 'player1' | 'player2' } } = {};
let store: {[key: string]: {name: string, quantity: number, unitPrice: number}} = {};
let purchaseHistory: {[key: string]: {userId: string, userName: string, itemName: string, quantity: number, totalPrice: number, timestamp: Date}} = {};
let bettingOpen: boolean = false;
let tournamentParticipants: Map<string, string> = new Map();
let lastUpdateTime: Date = new Date();
let activeGuessGames: { [key: string]: string } = {}; // Canal ID -> Utilisateur ID

const blackjackGames: { [key: string]: { playerHand: string[], dealerHand: string[], bet: number } } = {};
const cardValues: { [key: string]: number } = {
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

const calculateHandValue = (hand: string[]) => {
  let value = 0;
  let aces = 0;

  hand.forEach(card => {
    const cardValue = card.slice(0, -1); // Extrait la valeur de la carte (2, 3, ..., A)
    value += cardValues[cardValue];
    if (cardValue === 'A') aces++;
  });

  while (value > 21 && aces) {
    value -= 10;
    aces--;
  }

  return value;
};

const startBlackjackGame = (userId: string, bet: number) => {
  const playerHand = [drawCard(), drawCard()];
  const dealerHand = [drawCard(), drawCard()];

  blackjackGames[userId] = { playerHand, dealerHand, bet };

  return {
    playerHand,
    dealerHand
  };
};


const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`;
};

// Fonction pour créer le dossier si nécessaire 
const ensureLogDirectoryExists = (filePath: string): void => { 
  const logDir = path.dirname(filePath); 
  if (!fs1.existsSync(logDir)) { 
    fs1.mkdirSync(logDir, { recursive: true }); 
  } 
}; 

// Appeler la fonction pour s'assurer que le dossier existe 
ensureLogDirectoryExists(logFile); 

const log = (message: string): void => { 
  fs1.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`); 
};

const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  };
};

const decrypt = (hash: { iv: string; content: string }) => {
  if (!hash || !hash.iv || !hash.content) {
    throw new Error('Invalid data to decrypt');
  }

  const iv = Buffer.from(hash.iv, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

  return decrypted.toString();
};

const createDataDebilusDir = () => {
  if (!fs.existsSync('DataDebilus')) {
    fs.mkdirSync('DataDebilus');
  }
};

const saveDecryptedBackup = () => {
  try{
    createDataDebilusDir();

    const data = {
      usersPoints,
      debilusCloset,
      store,
      purchaseHistory,
      lastUpdateTime: lastUpdateTime.toISOString()
    };
    fs.writeFileSync('DataDebilus/decrypted_backup.json', JSON.stringify(data, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité
  } catch (error) {
    log(`Error saving points: ${error}`)
  }
};

const saveTournamentParticipants = async () => {
  const participantsArray = Array.from(tournamentParticipants);
  fs.writeFileSync('DataDebilus/tournamentParticipants.json', JSON.stringify(participantsArray, null, 2));
  log("Tournament participants data saved.");
};

const loadTournamentParticipants = async () => {
  if (fs.existsSync('DataDebilus/tournamentParticipants.json')) {
    const participantsArray: [string, string][] = JSON.parse(fs.readFileSync('DataDebilus/tournamentParticipants.json', 'utf-8'));
    tournamentParticipants = new Map(participantsArray);
    log("Tournament participants data loaded.");
  }
};

const loadPoints = async () => {
  if (fs.existsSync(filePath)) {
    try {
      const encryptedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const decryptedData = JSON.parse(decrypt(encryptedData));
      usersPoints = decryptedData.usersPoints || {};
      debilusCloset = decryptedData.debilusCloset || 0;
      store = decryptedData.store || {};
      purchaseHistory = decryptedData.purchaseHistory || {}
      lastUpdateTime = new Date(decryptedData.lastUpdateTime || Date.now());
    } catch (error) {
      log(`Failed to decrypt data: ${error}`);
    }
  }
};

const savePoints = async () => {
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
};

// Fonction pour ajouter des points à l'inventaire
const addPointsToInventory = async () => {
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
      } else { 
        usersPoints[userId].inventory = potentialNewInventory; 
      }

      if (usersPoints[userId].inventory === 10) {
        await sendNotification(userId, 10); // Notification à 10 points
      } else if (usersPoints[userId].inventory === 15) {
        await sendNotification(userId, 15); // Notification à 15 points
      } else {
        debilusCloset += cyclesPassed;
      }
    }
  }
  if (now.getHours() < 12) {
    lastUpdateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else {
    lastUpdateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }
  await savePoints();
};

const sendNotification = async (userId: string, points: number) => {
  const user = await client.users.fetch(userId);
  
  if (user && usersPoints[userId].notificationsEnabled) {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('claim_yes')
          .setLabel('Yes')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('claim_no')
          .setLabel('No')
          .setStyle(ButtonStyle.Secondary),
      );

    await user.send({
      content: `You have ${points} out of 15 points. Do you want to claim them?`,
      components: [row]
    });
  }
};

// Planifier la tâche pour qu'elle s'exécute à des heures fixes (12:00 AM et 12:00 PM)
schedule.scheduleJob('0 0 * * *', addPointsToInventory); // Exécute tous les jours à minuit
schedule.scheduleJob('0 12 * * *', addPointsToInventory); // Exécute tous les jours à midi

client.on('rateLimit', (info) => {
  log(`WARNING: Rate limit hit: ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout : 'Unknown timeout '}`);
});

const commands = [ 
  new SlashCommandBuilder() 
    .setName('register') 
    .setDescription('Register to get initial points'), 
  new SlashCommandBuilder() 
    .setName('placeyourbets') 
    .setDescription('Start a betting period. (BetManager only)') 
    .addStringOption(option => 
      option.setName('player1name') 
        .setDescription('Name of player 1') 
        .setRequired(true)) 
    .addStringOption(option => 
      option.setName('player2name') 
        .setDescription('Name of player 2') 
        .setRequired(true)), 
  new SlashCommandBuilder() 
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
  new SlashCommandBuilder() 
    .setName('points') 
    .setDescription('Check your points'), 
  new SlashCommandBuilder() 
    .setName('pointvault') 
    .setDescription('Check your Point Vault'), 
  new SlashCommandBuilder() 
    .setName('claim') 
    .setDescription('Claim your points from Point Vault'),
  new SlashCommandBuilder() 
    .setName('clearbets') 
    .setDescription('Clear all bets in case of issues. (BetManager only)'), 
  new SlashCommandBuilder() 
    .setName('leaderboard') 
    .setDescription('Show leaderboard of top betters. (BetManager only)'),
  new SlashCommandBuilder() 
    .setName('win') 
    .setDescription('Declare the winner and redistribute points. (BetManager only)') 
    .addIntegerOption(option => 
      option.setName('winner') 
        .setDescription('The winning player (1 or 2)') 
        .setRequired(true)), 
  new SlashCommandBuilder() 
    .setName('betslist') 
    .setDescription('View the list of players who bet on player 1 and player 2. (BetManager only)'), 
  new SlashCommandBuilder() 
    .setName('deleteuser') 
    .setDescription('Delete a registered user. (BetManager only)') 
    .addStringOption(option => 
      option.setName('userid') 
        .setDescription('ID of the user to delete') 
        .setRequired(true)), 
  new SlashCommandBuilder() 
    .setName('backup') 
    .setDescription('Encrypt and save data from decrypted backup. (BetManager only)'), 
  new SlashCommandBuilder() 
    .setName('sendbackup') 
    .setDescription('Send the decrypted backup file. (BetManager only)'), 
  new SlashCommandBuilder() 
    .setName('addtournamentparticipant') 
    .setDescription('Add a participant to the tournament. (BetManager only)') 
    .addUserOption(option => 
      option.setName('user') 
        .setDescription('The user to add to the tournament') 
        .setRequired(true)), 
  new SlashCommandBuilder() 
    .setName('removetournamentparticipant') 
    .setDescription('Remove a participant from the tournament. (BetManager only)') 
    .addUserOption(option => 
      option.setName('user') 
        .setDescription('The user to remove from the tournament') 
        .setRequired(true)), 
  new SlashCommandBuilder() 
    .setName('listtournamentparticipants') 
    .setDescription('List all participants in the tournament. (BetManager only)'),
  new SlashCommandBuilder() 
    .setName('cleartournamentparticipants') 
    .setDescription('Clear the list of tournament participants. (BetManager only)'), 
  new SlashCommandBuilder() 
    .setName('presentation') 
    .setDescription('Present Betty Bet and its functions'), 
  new SlashCommandBuilder() 
    .setName('togglenotifications') 
    .setDescription('Toggle notifications for Point Vault GearPoints'), 
  new SlashCommandBuilder() 
    .setName('clearmessages') 
    .setDescription('Clear all private messages sent by the bot'), 
  new SlashCommandBuilder() 
    .setName('bethistory') 
    .setDescription('View your betting history'), 
  new SlashCommandBuilder() 
    .setName('stats') 
    .setDescription('View your detailed statistics'), 
  new SlashCommandBuilder() 
    .setName('globalstats') 
    .setDescription('View global betting statistics. (BetManager only)'),
  new SlashCommandBuilder() 
    .setName('transferdebilus') 
    .setDescription('Transfer all GearPoints from the debilus closet to a specific user. (BetManager only)') 
    .addUserOption(option => 
      option.setName('user') 
        .setDescription('User to transfer the GearPoints to') 
        .setRequired(true)),
  new SlashCommandBuilder() 
    .setName('buyitem') 
    .setDescription('Buy an item from the store') 
    .addStringOption(option => 
      option.setName('itemname') 
        .setDescription('Name of the item') 
        .setRequired(true)) 
    .addIntegerOption(option => 
      option.setName('quantity') 
        .setDescription('Quantity of the item') 
        .setRequired(true)), 
  new SlashCommandBuilder() 
    .setName('additem') 
    .setDescription('Add an item to the store. (BetManager only)') 
    .addStringOption(option => 
      option.setName('itemname') 
        .setDescription('Name of the item') 
        .setRequired(true)) 
    .addIntegerOption(option => 
      option.setName('quantity') 
        .setDescription('Quantity of the item') 
        .setRequired(true)) 
    .addIntegerOption(option => 
      option.setName('unitprice') 
        .setDescription('Unit price of the item') 
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('listitems')
    .setDescription('List all items available in the store'),
  new SlashCommandBuilder()
      .setName('purchasehistory')
      .setDescription('view purchase history in the store. (BetManager only)'),
  new SlashCommandBuilder()
      .setName('myitems')
      .setDescription('view the items you own'),
  new SlashCommandBuilder()
      .setName('blackjack')
      .setDescription('Play a game of blackjack'),
  new SlashCommandBuilder()
      .setName('stopblackjack')
      .setDescription('Stop the current game of blackjack'),
  new SlashCommandBuilder()
      .setName('addwinmatch')
      .setDescription('adds 1 winning point to a user. (BetManager only)')
      .addUserOption(option =>
        option.setName('user')
        .setDescription('The user to add winning point')
        .setRequired(true)),
  new SlashCommandBuilder()
        .setName('addlosematch')
        .setDescription('adds 1 lossing point to a user. (BetManager only)')
        .addUserOption(option =>
          option.setName('user')
          .setDescription('The user to add lossing point')
          .setRequired(true)),
  new SlashCommandBuilder()
        .setName('tournamentranking')
        .setDescription('view the ranking of the tournament participants. (BetManager only)'),
  new SlashCommandBuilder()
        .setName('exchange')
        .setDescription('exchange GearPoints between users')
        .addUserOption(option =>
          option.setName('user')
          .setDescription('The user to exchange points')
          .setRequired(true))
        .addIntegerOption(option =>
          option.setName('points')
          .setDescription('Number of points to exchange')
          .setRequired(true)),
  new SlashCommandBuilder()
        .setName('maintenance')
        .setDescription('Toggle maintenance mode. (BetManager only)')
]; 

const commandData = commands.map(command => command.toJSON()); 

client.once('ready', async () => {
  log(`Logged in as ${client.user?.tag}!`);

  loadPoints();
  
  await loadTournamentParticipants()
  await addPointsToInventory();

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

  try {
    log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: commandData },
    );

    log('Successfully reloaded application (/) commands.');
  } catch (error) {
    log(`${error}`);
  }

});

const createBlackjackActionRow = () => {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('blackjack_hit')
        .setLabel('Hit')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('blackjack_stand')
        .setLabel('Stand')
        .setStyle(ButtonStyle.Success),
    );
};

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;
    const member = interaction.member as GuildMember;

    if (!member) {
      await interaction.reply('An error has occurred. Unable to verify user roles.');
      return;
    }

    const roles = member.roles as GuildMemberRoleManager;
    const hasRole = (roleName: string) => roles.cache.some(role => role.name === roleName);
    const joinedMoreThan7DaysAgo = () => {
      const joinedTimestamp = member.joinedTimestamp;
      if (!joinedTimestamp) {
        return false;
      }
      const now = Date.now();
      const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
      return now - joinedTimestamp >= sevenDaysInMillis;
    };

    if (!hasRole(process.env.ROLE!)) {
      await interaction.reply({ content: `Only users with the role *${process.env.ROLE}* are allowed to use Betty Bet`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (maintenanceMode && !hasRole('BetManager')) {
      await interaction.reply({ content: 'Betty Bet is currently in maintenance mode. Please try again later.', flags: MessageFlags.Ephemeral });
      return;
    }

    try {
      switch (commandName) {
        case 'register':
          await handleRegister(interaction);
          break;
        case 'addtournamentparticipant':
          if (hasRole('BetManager')) {
          await handleAddTournamentParticipant(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'removetournamentparticipant':
          if (hasRole('BetManager')) {
            await handleRemoveTournamentParticipant(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'listtournamentparticipants':
          if (hasRole('BetManager')) {
            await handleListTournamentParticipants(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'cleartournamentparticipants':
          if (hasRole('BetManager')) {
            await handleClearTournamentParticipants(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;        
        case 'placeyourbets':
          if (hasRole('BetManager')) {
            await handlePlaceYourBets(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'points':
          await handlePoints(interaction);
          break;
        case 'clearbets':
          if (hasRole('BetManager')) {
            await handleClearBets(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'leaderboard':
          if (hasRole('BetManager')) {
            await handleLeaderboard(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'win':
          if (hasRole('BetManager')) {
            const winnerOption = interaction.options.get('winner');
            const winner = winnerOption ? winnerOption.value : null;
      
            if (winner === 1 || winner === 2) {
              await handleWin(interaction, winner === 1 ? 'player1' : 'player2');
              } else {
              await interaction.reply('The winner must be 1 or 2.');
            }
          } else {
            await interaction.reply({content:'You do not have permission to use this command.', flags: MessageFlags.Ephemeral});
          }
          break;
        case 'betslist':
          if (hasRole('BetManager')) {
            await handleBetsList(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'deleteuser':
          if (hasRole('BetManager')) {
            await handleDeleteUser(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'addpoints':
          if (hasRole('BetManager')) {
            await handleAddPoints(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'claim':
          await handleClaim(interaction);
          break;
        case 'pointvault':
          await handleInventory(interaction);
          break;   
        case 'backup':
          if (hasRole('BetManager')) {
            await handleBackup(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;  
        case 'sendbackup':
          if (hasRole('BetManager')) {
            await handleSendDecryptedBackup(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'togglenotifications':
          await handleToggleNotifications(interaction);
          break
        case 'presentation':
          await handlePresentation(interaction);
          break;
        case 'clearmessages':
          await handleClearMessages(interaction);
          break;   
        case 'bethistory':
          if (restricted) {
            await interaction.reply({ content: 'This command is currently unavailable, it will be available later.', flags: MessageFlags.Ephemeral });
            break;
          }
          await handleBetHistory(interaction);
          break;
        case 'stats':
          if (restricted) {
            await interaction.reply({ content: 'This command is currently unavailable, it will be available later.', flags: MessageFlags.Ephemeral });
            break;
          }
          await handleStats(interaction);
          break;
        case 'globalstats':
          if (hasRole('BetManager')) {
            await handleGlobalStats(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'transferdebilus':
          if (hasRole('BetManager')) {
            await handleTransferDebilus(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'buyitem': 
          if (restricted) {
            await interaction.reply({ content: 'This command is currently unavailable, it will be available later.', flags: MessageFlags.Ephemeral });
            break;
          }
          try { 
            await handleBuyItem(interaction); 
          } catch (error) { 
            log(`Error handling buyitem command: ${error}`); 
            await interaction.reply('There was an error processing your purchase.'); 
          } 
          break; 
        case 'additem': 
          if (hasRole('BetManager')){
            try { 
              await handleAddItemToStore(interaction); 
            } catch (error) { 
              log(`Error handling additem command: ${error}`); 
              await interaction.reply('There was an error adding the item to the store.'); 
            } 
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'listitems':
          if (restricted) {
            await interaction.reply({ content: 'This command is currently unavailable, it will be available later.', flags: MessageFlags.Ephemeral });
            break;
          }
          try{
            await handleListItems(interaction);
          } catch (error) {
            log(`Error handling listitems command: ${error}`);
            await interaction.reply('There was an error retrieving the items list.');
          }
          break;
        case 'purchasehistory':
          if (hasRole('BetManager')) {
            await handleViewPurchaseHistory(interaction);
          } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'myitems':
          if (restricted) {
            await interaction.reply({ content: 'This command is currently unavailable, it will be available later.', flags: MessageFlags.Ephemeral });
            break;
          }
          await handleItemsInventory(interaction);
          break;
        case 'blackjack': 
          const userId = interaction.user.id; 

          if (!usersPoints[userId]) {
            await interaction.reply({content:'You are not registered yet. Use `/register` to sign up.', flags: MessageFlags.Ephemeral});
            return;
          }

          if (blackjackGames[userId]) {
            await interaction.reply({content:'You already have an active blackjack game. Please finish it before starting a new one or use `/stopstopblackjack` for delete this one', flags: MessageFlags.Ephemeral});
            return;
          }

          if (usersPoints[userId].points < 10) { 
            await interaction.reply({ content: 'You need at least 10 points to play blackjack.', flags: MessageFlags.Ephemeral });
            return; 
          } 

          const { playerHand, dealerHand } = startBlackjackGame(userId, 10); 
          const playerValue = calculateHandValue(playerHand);
          const dealerValue = calculateHandValue(dealerHand);
          usersPoints[userId].points -= 10;  

          await interaction.reply({ content: `\n*Betty Bet's visible card*: \n**|${dealerHand[0]}| |??|**\n\n*Your hand*: \n**|${playerHand.join('| |')}|**\n= **${playerValue}**`, components: [createBlackjackActionRow()], flags: MessageFlags.Ephemeral }); 

          await savePoints();

          break;
        case 'addwinmatch':
          if (hasRole('BetManager')) {
            await handleAddWinMatch(interaction);
          } else {
            await interaction.reply({content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'stopblackjack':
          await handleStopBlackjack(interaction);
          break;
        case 'addlosematch':
          if (hasRole('BetManager')) {
            await handleAddLoseMatch(interaction);
          } else {
            await interaction.reply({content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'tournamentranking':
          if (hasRole('BetManager')) {
            await handleListTournamentParticipantsByRanking(interaction)
          } else {
            await interaction.reply({content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
          }
          break;
        case 'exchange':
          await handleExchangePoints(interaction);
          break;
        case 'maintenance':
          await handleToggleMaintenance(interaction);
          break;
        default:
          try { 
            await interaction.reply('Unknown command'); 
          } catch (error) { 
            log(`Error handling default command: ${error}`); 
            await interaction.reply('There was an error processing your request.'); 
          }
          break;
      }
    } catch (error){
      log(`Error handling ${commandName} command: ${error}`)
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply('There was an error processing your request.')
      }
    }
  } else if (interaction.isButton()) {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
      await interaction.reply({ content: 'Please register first using /register.', flags: MessageFlags.Ephemeral });
      return;
    }

    if (interaction.customId.startsWith('claim_')) {
      await handleClaimYesNo(interaction as ButtonInteraction);
    } else if (interaction.customId === 'blackjack_hit' || interaction.customId === 'blackjack_stand') {
      const game = blackjackGames[userId];

      if (!game) {
        await interaction.reply({ content: 'No active blackjack game found. Start a new game with /blackjack', flags: MessageFlags.Ephemeral });
        return;
      }

      if (interaction.customId === 'blackjack_hit') {
        game.playerHand.push(drawCard());
        const playerValue = calculateHandValue(game.playerHand);
        const dealerValue = calculateHandValue(game.dealerHand);

        if (playerValue > 21) {
          delete blackjackGames[userId];
          await interaction.update({ content: `\n*Your hand*: \n**|${game.playerHand.join('| |')}|**\n= **${playerValue}**\n\n**You bust!** *Betty Bet wins.*`, components: [] });
          debilusCloset += 10;
          await savePoints();
          return;
        }

        await interaction.update({ content: `\n*Betty Bet's visible card*: \n**|${game.dealerHand[0]}| |??|**\n\n*Your hand*: \n**|${game.playerHand.join('| |')}|**\n= **${playerValue}**`, components: [createBlackjackActionRow()] });

      } else if (interaction.customId === 'blackjack_stand') {
        let dealerValue = calculateHandValue(game.dealerHand);

        while (dealerValue < 17) {
          game.dealerHand.push(drawCard());
          dealerValue = calculateHandValue(game.dealerHand);
        }

        const playerValue = calculateHandValue(game.playerHand);
        let resultMessage = `\n*Betty Bet's hand*: \n**|${game.dealerHand.join('| |')}|**\n= **${dealerValue}**\n\n*Your hand*: \n**|${game.playerHand.join('| |')}|**\n= **${playerValue}**\n\n`;

        if (dealerValue > 21 || playerValue > dealerValue) {
          usersPoints[userId].points += game.bet * 2;
          resultMessage += '**You win!**';
          delete blackjackGames[userId];
          await savePoints();
        } else if (playerValue < dealerValue) {
          resultMessage += '**Betty Bet wins!**';
          debilusCloset += 10;
          delete blackjackGames[userId];
          await savePoints();
        } else {
          usersPoints[userId].points += game.bet;
          resultMessage += '**It\'s a tie!**';
          delete blackjackGames[userId];
          await savePoints();
        }

        await interaction.update({ content: resultMessage + `\n you have **${usersPoints[userId].points}** ${pointsEmoji}`, components: [] });
      }
    } else {
      await handleBetSelection(interaction as ButtonInteraction);
    }
  }
});

client.on('messageCreate', async message => {
  if (!bettingOpen || message.author.bot) return;

  const userId = message.author.id;

  if (tournamentParticipants.has(userId)) {
    const reply = await message.reply({ content: 'You are participating in the tournament and cannot place bets during the event.' });
    setTimeout(() => reply.delete(), 3000); // Supprimer le message après 3 secondes
    return;
  }

  const currentBet = currentBets[userId];
  if (!currentBet) return; // Vérifier si l'utilisateur a déjà sélectionné un joueur

  // Vérifier si l'utilisateur a déjà parié sur ce joueur
  const chosenPlayerName = currentBet.betOn === 'player1' ? player1Name : player2Name;
  const existingBet = usersPoints[userId].betHistory.some(
    bet => bet.result === 'pending' && bet.betOn === chosenPlayerName
  );

  if (existingBet) {
    const reply = await message.reply('You have already placed a bet on this player. You cannot bet again on the same player.');
    setTimeout(() => reply.delete(), 3000); // Supprimer le message après 3 secondes
    return;
  }

  // Validation stricte : vérifier si le message est entièrement composé de chiffres
  if (!/^\d+$/.test(message.content)) {
    const reply = await message.reply('Invalid bet format. Please enter a numeric value.');
    setTimeout(() => reply.delete(), 3000); // Supprimer le message après 3 secondes
    return;
  }

  const betAmount = parseInt(message.content);

  if (betAmount <= 0) {
    const reply = await message.reply('Invalid bet amount. Please enter a positive number.');
    setTimeout(() => reply.delete(), 3000); // Supprimer le message après 3 secondes
    return;
  }

  if (usersPoints[userId].points < betAmount) {
    const reply = await message.reply(`${pointsEmoji} not enough. Try a lower amount.`);
    setTimeout(() => reply.delete(), 3000); // Supprimer le message après 3 secondes
    return;
  }

  // Ajuster les points et ajouter le pari
  usersPoints[userId].points -= betAmount;
  currentBets[userId] = { amount: (currentBet.amount || 0) + betAmount, betOn: currentBet.betOn };

  // Mettre à jour l'historique des paris
  const betHistory = usersPoints[userId].betHistory;

  const lastBet = betHistory.find(
    bet => bet.result === 'pending' && bet.betOn === chosenPlayerName
  );

  if (lastBet) {
    lastBet.amount += betAmount;
  } else {
    betHistory.push({
      betOn: chosenPlayerName,
      amount: betAmount,
      result: 'pending',
      date: new Date()
    });
  }

  usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;

  await savePoints();

  // Ajouter une réaction au message de l'utilisateur
  await message.react('✅'); // Remplace '✅' par l'emoji que tu préfères
});

const handleRegister = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;
  const member = interaction.member as GuildMember;
  const userName = member.nickname || interaction.user.displayName;

  if (usersPoints[userId]) {
    await interaction.reply({content:`You are already registered.\n\n\n*Debilus* ${debilus}`, flags: MessageFlags.Ephemeral});
    return;
  }

  usersPoints[userId] = { points: 100, name: userName, wins:0, losses:0, isDebilus:false, inventory:0, notificationsEnabled: false, betHistory: [], inventoryShop: [], winMatch:0, loseMatch:0 };
  await savePoints();
  await interaction.reply({content:`Registration successful!\n\nYou have received **100 ${pointsEmoji}** !!!\n\n **Optional**: This bot integrates a notification system, you can activate it by doing the command \`/togglenotification\` and Betty Bet will send you a DM when you reach 10 points in your inventory.`, flags: MessageFlags.Ephemeral});

};

const handleToggleNotifications = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({content:'You are not registered yet. Use `/register` to sign up.', flags: MessageFlags.Ephemeral});
    return;
  }

  usersPoints[userId].notificationsEnabled = !usersPoints[userId].notificationsEnabled;
  await savePoints();
  await interaction.reply({content:`Notifications have been ${usersPoints[userId].notificationsEnabled ? 'enabled' : 'disabled'}.`, flags: MessageFlags.Ephemeral});
};

const handlePlaceYourBets = async (interaction: CommandInteraction) => {
  bettingOpen = true;
  currentBets = {};

  const player1Option = interaction.options.get('player1name');
  const player2Option = interaction.options.get('player2name');

  player1Name = player1Option ? player1Option.value as string : 'Player 1';
  player2Name = player2Option ? player2Option.value as string : 'Player 2';

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('player1')
        .setLabel('Bet on '+player1Name)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('player2')
        .setLabel('Bet on '+player2Name)
        .setStyle(ButtonStyle.Danger),
    );

  await interaction.reply({ content: `## the bets are open !!!\n\nYou have **60 seconds** to choose between **${player1Name}** and **${player2Name}**.\n\n`, components: [row] });

  const channel = interaction.channel as TextChannel;
  if (channel) {
    channel.send(`${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}`);
  }

  setTimeout(async () => {
    bettingOpen = false;
    await interaction.followUp('## Bets are closed !');
    if (channel) {
      channel.send(`${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}`);
      channel.send('*Thanks for money !*');
    }
  }, 60000);
};

const handleBetSelection = async (interaction: ButtonInteraction) => {
  const userId = interaction.user.id;
  const customId = interaction.customId;

  if (!usersPoints[userId]) {
    await interaction.reply({content:'You are not registered yet. Use */register* to register.', flags: MessageFlags.Ephemeral});
    return;
  }

  // Vérifier si l'utilisateur essaie de parier sur un autre joueur
  if (currentBets[userId] && currentBets[userId].betOn !== customId) {
    await interaction.reply({ content: 'You have already placed a bet on the other player. You cannot bet on both players.', flags: MessageFlags.Ephemeral });
    return;
  }

  // verifier si l'utilisateur a déjà parié
  if (currentBets[userId] && currentBets[userId].betOn === customId) {
    await interaction.reply({ content: 'You have already placed a bet on this player.', flags: MessageFlags.Ephemeral });
    return;
  }

  currentBets[userId] = { amount: 0, betOn: customId as 'player1' | 'player2' };

  const points = usersPoints[userId].points;
  const chosenPlayerName = customId === 'player1' ? player1Name : player2Name;

  if (!interaction.replied) {
    await interaction.reply({
      content: `You have chosen ${chosenPlayerName}.\n\nYou have ${points}${pointsEmoji}\nEnter the amount you wish to bet:`,
      flags: MessageFlags.Ephemeral
    });
  }
};

const handlePoints = async (interaction: CommandInteraction) => {

  loadPoints();

  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({content:'You are not registered yet. Use */register* to register.', flags: MessageFlags.Ephemeral});
    return;
  }

  const userInfo = usersPoints[userId];
  const status = userInfo.isDebilus ? `you are a **Debilus** ${debilus}` : 'bettor';
  await interaction.reply({ content: `**${userInfo.name}**\n\nYou have **${userInfo.points}** ${pointsEmoji}\n\n| **${userInfo.wins} wins** | **${userInfo.losses} losses** |\n\n**Status:** ${status}`, flags: MessageFlags.Ephemeral });
};

const handleClearBets = async (interaction: CommandInteraction) => {
  for (const [userId, bet] of Object.entries(currentBets)) {
    if (usersPoints[userId]) {
      usersPoints[userId].points += bet.amount;
    }
  }

  await savePoints();
  currentBets = {};
  bettingOpen = false;

  await interaction.reply('All bets were void and Gearpoints were refunded.');
};

const handleLeaderboard = async (interaction: CommandInteraction) => {
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

  await interaction.reply(
    `**Ranking of the best bettors:**\n\n\`\`\`Rank   Name                                  Points     Wins      Losses\n${leaderboard}\`\`\``
  );
};

const handleBetsList = async (interaction: CommandInteraction) => {
  let totalPlayer1Bets = 0;
  let totalPlayer2Bets = 0;

  if (player1Name === undefined && player2Name === undefined) {
    await interaction.reply({ content: `no bets, no game ${debilus}`, flags: MessageFlags.Ephemeral });
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

  await interaction.reply(
    `**Bets List:**\n\n\`\`\`Player\t\tName\t\tAmount\n${player1Name}:\n${player1Bets.join('\n') || 'No bets'}\n\n${player2Name}:\n${player2Bets.join('\n') || 'No bets'}\`\`\`\n\n` +
    `Total bet on **${player1Name}**: **${totalPlayer1Bets}** ${pointsEmoji}\n` +
    `Total bet on **${player2Name}**: **${totalPlayer2Bets}** ${pointsEmoji}\n` +
    `Total bet overall: **${totalBets}** ${pointsEmoji}\n\n` +
    `Betting Ratio (${player1Name} / ${player2Name}): **${ratio}**`
  );
};

const handleWin = async (interaction: CommandInteraction, winningPlayer: 'player1' | 'player2') => {
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
    } else {
      loserBetAmount += bet.amount;
    }
  }
  
  if (winnerBetAmount === 0 && loserBetAmount === 0) {
    const message = `No bets, no money ! ${debilus}`;
    await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
    return;
  }  

  if (winnerBetAmount === 0) {
    // Ajouter tous les points dans le placard à debilus
    debilusCloset += totalBetAmount;
    await savePoints(); // Sauvegarder après avoir mis à jour debilusCloset
    const file = new AttachmentBuilder('./images/crashboursier.png');
    const message2 = `Thanks for money, Debilus !\n\nAll GearPoints have been added to the **debilus closet** ! \nTotal GearPoints in debilus closet: **${debilusCloset}** ${pointsEmoji}`;
    await interaction.reply({ content: `The winner is **${winningPlayerName}** ! No bets were placed on the winner. ${message2}`, files: [file] });

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
    await savePoints();
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
    } else {
      // Déduire les points pour les perdants
      usersPoints[userId].losses += 1;
      const betHistory = usersPoints[userId].betHistory;
      betHistory[betHistory.length - 1].result = 'loss';
      usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
    }
  }
  

  await savePoints();
  currentBets = {};
  bettingOpen = false;

  const message = `The winner is **${winningPlayerName}** ! Congratulations to all those who bet on this player, the GearPoints have been redistributed !`;
  const message2 = `The winner is **${winningPlayerName}** ! It's the stock market crash, you had to believe a little more in this player !`;
  const file = new AttachmentBuilder('./images/petitcrashboursier.png');
  if (winnerBetAmount < loserBetAmount) {
    await interaction.reply({ content: message2, files: [file] });
  } else {
    const winFile = new AttachmentBuilder('./images/victoire.png');
    await interaction.reply({ content: message, files: [winFile] });
  }

  player1Name = 'player 1'
  player2Name = 'player 2'
};

const handleDeleteUser = async (interaction: CommandInteraction) => {
  const userIdToDelete = interaction.options.get('userid')?.value as string;
  
  if (userIdToDelete && usersPoints[userIdToDelete]) {
    const userNameToDelete = usersPoints[userIdToDelete].name;
    delete usersPoints[userIdToDelete];
    await savePoints();
    await interaction.reply({ content: `The user **${userNameToDelete}** (${userIdToDelete}) has been deleted.`, flags: MessageFlags.Ephemeral });
  } else {
    await interaction.reply({ content: 'User no found', flags: MessageFlags.Ephemeral });
  }
};

const handleAddPoints = async (interaction: CommandInteraction) => {
  const userOption = interaction.options.get('user');
  const pointsOption = interaction.options.get('points');

  const userId = userOption?.value as string;
  const pointsToAdd = pointsOption?.value as number;

  if (userId == bettyBettId) {
    debilusCloset += pointsToAdd;
    await interaction.reply({ content: `**${pointsToAdd}** points have been added to DebilusCloset.`, flags: MessageFlags.Ephemeral });
    await savePoints();
    return;
  }

  if (!usersPoints[userId]) {
    await interaction.reply({ content: `User with id ${userId} is not registered`, flags: MessageFlags.Ephemeral });
    return;
  }

  usersPoints[userId].points += pointsToAdd;
  usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
  await savePoints();
  await interaction.reply({ content: `**${pointsToAdd}** ${pointsEmoji} Points have been added to **${usersPoints[userId].name}**.`, flags: MessageFlags.Ephemeral });
};

const handleClaim = async (interaction: CommandInteraction) => {
  loadPoints();
  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: 'You are not registered yet. Use `/register` to register.', flags: MessageFlags.Ephemeral });
    return;
  }

  const pointsToClaim = usersPoints[userId].inventory;
  if (pointsToClaim > 0) {
    usersPoints[userId].points += pointsToClaim;
    usersPoints[userId].inventory = 0;
    usersPoints[userId].isDebilus = false; // Mettre à jour le statut debilus
    await savePoints();

    await interaction.reply({ content: `You have claimed **${pointsToClaim}** ${pointsEmoji}.\n\nYou now have **${usersPoints[userId].points}** ${pointsEmoji}`, flags: MessageFlags.Ephemeral });
  } else {
    await interaction.reply({ content: 'You have no points to claim. try again later !', flags: MessageFlags.Ephemeral });
  }
};

const handleInventory = async (interaction: CommandInteraction) => {

  loadPoints();

  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({ content:`You are not registered yet. Use */register* to register.`, flags: MessageFlags.Ephemeral })
    return;
  }
  const inventoryPoints = usersPoints[userId].inventory;
  await interaction.reply({ content: `You have **${inventoryPoints}** ${pointsEmoji} in your Point Vault.`, flags: MessageFlags.Ephemeral })
};

const handleBackup = async (interaction: CommandInteraction) => {
  createDataDebilusDir();

  if (!fs.existsSync('DataDebilus/decrypted_backup.json')) {
    await interaction.reply({ content: 'No decrypted backup found.', flags: MessageFlags.Ephemeral });
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

  await interaction.reply({ content: 'Data from decrypted backup has been encrypted and **saved successfully** !', flags: MessageFlags.Ephemeral });
};

const handleSendDecryptedBackup = async (interaction: CommandInteraction) => {
  createDataDebilusDir();

  if (!fs.existsSync('DataDebilus/decrypted_backup.json')) {
    await interaction.reply({ content: 'No decrypted backup found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const file = new AttachmentBuilder('DataDebilus/decrypted_backup.json');
  await interaction.reply({ content: 'Here is the decrypted backup file.', files: [file], flags: MessageFlags.Ephemeral });
};

const handleAddTournamentParticipant = async (interaction: CommandInteraction) => {
  const userOption = interaction.options.get('user');
  const user = userOption?.user;

  if (user) {
    tournamentParticipants.set(user.id, user.displayName); // Ajouter l'ID et le pseudo à la Map
    await saveTournamentParticipants(); // Appel de la fonction asynchrone de sauvegarde
    await interaction.reply({ content: `${user.displayName} has been added to the tournament.`, flags: MessageFlags.Ephemeral });
  } else {
    await interaction.reply({ content: 'User not found.', flags: MessageFlags.Ephemeral });
  }
};

const handleRemoveTournamentParticipant = async (interaction: CommandInteraction) => {
  const userOption = interaction.options.get('user');
  const user = userOption?.user;

  if (user) {
    tournamentParticipants.delete(user.id);
    usersPoints[user.id].winMatch = 0;
    usersPoints[user.id].loseMatch = 0;
    await saveTournamentParticipants(); // Appel de la fonction asynchrone de sauvegarde
    await savePoints();
    await interaction.reply({ content: `${user.displayName} has been removed from the tournament.`, flags: MessageFlags.Ephemeral });
  } else {
    await interaction.reply({ content: 'User not found.', flags: MessageFlags.Ephemeral });
  }
};

const handleListTournamentParticipants = async (interaction: CommandInteraction) => {
  if (tournamentParticipants.size === 0) {
    await interaction.reply({ content: 'No participants in the tournament.', flags: MessageFlags.Ephemeral });
    return;
  }

  const participantsList = Array.from(tournamentParticipants.entries()).map(([_, username]) => {
    return `Pseudo: ${username}`;
  }).join('\n');

  await interaction.reply({ content: `Tournament Participants:\n${participantsList}`, flags: MessageFlags.Ephemeral });
};

const handleClearTournamentParticipants = async (interaction: CommandInteraction) => {
  tournamentParticipants.forEach((_, userId) => {
    if (usersPoints[userId]) {
      usersPoints[userId].winMatch = 0;
      usersPoints[userId].loseMatch = 0;
    }
  })
  tournamentParticipants.clear(); // Effacer tous les participants
  await saveTournamentParticipants(); // Appel de la fonction asynchrone de sauvegarde
  await savePoints();
  await interaction.reply({ content: 'All tournament participants have been cleared.', flags: MessageFlags.Ephemeral });
};

const handleClaimYesNo = async (interaction: ButtonInteraction) => {
  const userId = interaction.user.id;
  
  if (!usersPoints[userId]) {
    if (!interaction.replied) {
      await interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', flags: MessageFlags.Ephemeral });
    }
    return;
  }

  if (interaction.customId === 'claim_yes') {
    const pointsToClaim = usersPoints[userId].inventory;
    usersPoints[userId].points += pointsToClaim;
    usersPoints[userId].inventory = 0;
    await savePoints();

    if (!interaction.replied) {
      await interaction.update({ content: `You have claimed **${pointsToClaim}** ${pointsEmoji}.\n\nYou now have **${usersPoints[userId].points}** ${pointsEmoji}`, components: [] });
    }
  } else if (interaction.customId === 'claim_no') {
    if (!interaction.replied) {
      await interaction.update({ content: 'You have chosen not to claim your points at this time.', components: [] });
    }
  } else {
    if (!interaction.replied) {
      await interaction.update({ content: 'Invalid selection.', components: [] });
    }
  }
};

const handlePresentation = async (interaction: CommandInteraction) => {
  const part1 = `
Hello ! I'm **Betty Bet**, your betting bot ! You will find all my features and my source code via this link:

https://github.com/SweetDebilus/Betty-Bet?tab=readme-ov-file#betty-bet`;
  await interaction.reply({ content: part1, flags: MessageFlags.Ephemeral });
};

const handleClearMessages = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;
  const user = await client.users.fetch(userId);

  if (!user) {
    await interaction.reply({ content: 'User not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    const dmChannel = await user.createDM();
    const messages = await dmChannel.messages.fetch({ limit: 100 });

    const botMessages = messages.filter(msg => msg.author.id === client.user?.id);

    for (const message of botMessages.values()) {
      await message.delete();
    }

    await interaction.reply({ content: 'All private messages sent by the bot have been cleared.', flags: MessageFlags.Ephemeral });
  } catch (error) {
    log(`Failed to clear messages for user ${userId}: ${error}`);
    await interaction.reply({ content: 'Failed to clear messages.', flags: MessageFlags.Ephemeral });
  }
};

const handleBetHistory = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', flags: MessageFlags.Ephemeral });
    return;
  }

  const betHistory = usersPoints[userId].betHistory;

  if (betHistory.length === 0) {
    await interaction.reply({ content: 'You have no betting history.', flags: MessageFlags.Ephemeral });
    return;
  }

  let historyMessage = 'Your Betting History:\n';

  betHistory.forEach(async (bet, index) => {
    const betInfo = `\n**Bet ${index + 1}:**\nDate: ${bet.date.toLocaleString()}\nBet On: ${bet.betOn}\nAmount: ${bet.amount}${pointsEmoji}\nResult: ${bet.result}\n`;
    if ((historyMessage + betInfo).length > 2000) {
      await interaction.reply({ content: historyMessage, flags: MessageFlags.Ephemeral });
      historyMessage = 'Your Betting History (continued):\n';
    }
    historyMessage += betInfo;
  });

  await interaction.reply({ content: historyMessage, flags: MessageFlags.Ephemeral });
};

const handleStats = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', flags: MessageFlags.Ephemeral });
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

  await interaction.reply({ content: statsMessage, flags: MessageFlags.Ephemeral });
};

const handleGlobalStats = async (interaction: CommandInteraction) => {
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

  await interaction.reply({ content: globalStatsMessage });
};

const handleTransferDebilus = async (interaction: CommandInteraction) => {
  const userOption = interaction.options.get('user');
  const user = userOption?.user;

  if (!user) {
    await interaction.reply({ content: 'User not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const userId = user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: 'The specified user is not registered.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (debilusCloset === 0) {
    await interaction.reply({ content: 'The debilus closet is already empty.', flags: MessageFlags.Ephemeral });
    return;
  }

  // Transfer the points from the debilus closet to the user
  usersPoints[userId].points += debilusCloset;
  const transferredPoints = debilusCloset;
  debilusCloset = 0;

  await savePoints();
  await interaction.reply({ content: `Transferred ${transferredPoints} GearPoints from the debilus closet to ${user.username}. The debilus closet is now empty.`, flags: MessageFlags.Ephemeral });
};

const handleBuyItem = async (interaction: CommandInteraction) => {
  await loadPoints();  // Charger les points depuis le fichier

  const userId = interaction.user.id;
  const itemName = interaction.options.get('itemname', true)?.value as string;
  const quantity = interaction.options.get('quantity', true)?.value as number;

  // Vérifier si l'utilisateur existe
  if (!usersPoints[userId]) {
    await interaction.reply({ content: 'User not found', flags: MessageFlags.Ephemeral });
    return;
  }

  // Vérifier si l'article existe dans la boutique
  if (!store[itemName]) {
    await interaction.reply({ content: 'Item not found', flags: MessageFlags.Ephemeral });
    return;
  }

  const item = store[itemName];
  const totalPrice = item.unitPrice * quantity;

  // Vérifier si l'utilisateur a suffisamment de points
  if (usersPoints[userId].points < totalPrice) {
    await interaction.reply({ content: 'Not enough points', flags: MessageFlags.Ephemeral });
    return;
  }

  // Vérifier si la boutique a suffisamment d'articles en stock
  if (item.quantity < quantity) {
    await interaction.reply({ content: 'Not enough items in stock', flags: MessageFlags.Ephemeral });
    return;
  }

  // Déduire les points de l'utilisateur et mettre à jour l'inventaire
  usersPoints[userId].points -= totalPrice;
  const userInventory = usersPoints[userId].inventoryShop.find(i => i.name === itemName);

  // Mettre à jour la quantité de l'article dans l'inventaire de l'utilisateur
  if (userInventory) {
    userInventory.quantity += quantity;
    debilusCloset += totalPrice;
  } else {
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

  await savePoints();  // Sauvegarder les points dans le fichier

  // Répondre à l'interaction pour confirmer l'achat
  await interaction.reply({ content: `Successfully purchased ${quantity} ${item.name}(s)`, flags: MessageFlags.Ephemeral });
};

const handleAddItemToStore = async (interaction: CommandInteraction) => {
  await loadPoints();

  const itemName = interaction.options.get('itemname', true)?.value as string;
  const quantity = interaction.options.get('quantity', true)?.value as number;
  const unitPrice = interaction.options.get('unitprice', true)?.value as number;

  if (store[itemName]) {
    store[itemName].quantity += quantity;
  } else {
    store[itemName] = {
      name: itemName,
      quantity: quantity,
      unitPrice: unitPrice
    };
  }

  await savePoints()

  await interaction.reply({ content: `Added ${quantity} ${itemName}(s) to the store`, flags: MessageFlags.Ephemeral });
};

const handleListItems = async (interaction: CommandInteraction) => {
  let storeItems = 'Available items in the store:\n\n';
  
  for (const itemName in store) {
    const item = store[itemName];
    storeItems += `${item.name} - *Quantity*: **${item.quantity}** | *Unit Price*: **${item.unitPrice}** ${pointsEmoji}\n`;
  }

  await interaction.reply({ content: storeItems, flags: MessageFlags.Ephemeral });
};

const handleViewPurchaseHistory = async (interaction: CommandInteraction) => {
  const allPurchaseRecords = Object.values(purchaseHistory);

  if (allPurchaseRecords.length === 0) {
    await interaction.reply({ content: 'No purchase history found.', flags: MessageFlags.Ephemeral });
    return;
  }

  // Trier les enregistrements d'achat par nom d'utilisateur
  allPurchaseRecords.sort((a, b) => a.userName.localeCompare(b.userName));
  const historyMessage = allPurchaseRecords.map(record => {
    const date = new Date(record.timestamp);
    const formattedDate = formatDate(date);
    return `*User*: **${record.userName}**\n- *Item*: **${record.itemName}**\n- *Quantity*: **${record.quantity}**\n- *Total Price*: **${record.totalPrice}** ${pointsEmoji}\n- *Date*: **${formattedDate}**\n`;
  }).join('\n');

  await interaction.reply({ content: `Global purchase history:\n\n${historyMessage}`, flags: MessageFlags.Ephemeral });
};

const handleItemsInventory = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;
  let inventoryItemsMessage = `**Item Inventory**:\n`;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', flags: MessageFlags.Ephemeral });
    return;
  }

  const items = usersPoints[userId].inventoryShop;

  if (items.length === 0) {
    await interaction.reply({content:'you have no items in your inventory', flags: MessageFlags.Ephemeral});
    return;
  }

  items.forEach(async (item, index) => {
    const itemInfo = `\n**Item ${index + 1}**:\n- *Name*: **${item.name}**\n- *Quantity*: **${item.quantity}**\n`;
    inventoryItemsMessage += itemInfo;
  });

  await interaction.reply({content: inventoryItemsMessage, flags: MessageFlags.Ephemeral});
}

const handleAddWinMatch = async (interaction: CommandInteraction) => {
  const userOption = interaction.options.get('user');
  const userId = userOption?.value as string;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: `User with id ${userId} is not registered`, flags: MessageFlags.Ephemeral });
    return;
  }

  if (!tournamentParticipants.has(userId)) {
    await interaction.reply({ content: `User ${usersPoints[userId].name} is not participating in the tournament`, flags: MessageFlags.Ephemeral });
    return;
  }

  usersPoints[userId].winMatch += 1;
  await savePoints();
  await interaction.reply({content:`${usersPoints[userId].name} win !`, flags: MessageFlags.Ephemeral});
}

const handleAddLoseMatch = async (interaction: CommandInteraction) => {
  const userOption = interaction.options.get('user');
  const userId = userOption?.value as string;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: `User with id ${userId} is not registered`, flags: MessageFlags.Ephemeral });
    return;
  }

  if (!tournamentParticipants.has(userId)) {
    await interaction.reply({ content: `User ${usersPoints[userId].name} is not participating in the tournament`, flags: MessageFlags.Ephemeral });
    return;
  }

  usersPoints[userId].loseMatch += 1;
  if (usersPoints[userId].loseMatch === 2) {
    await interaction.reply({content: `${usersPoints[userId].name} loses and is eliminated !`});
    await savePoints();
    return
  }
  await savePoints();
  await interaction.reply({content:`${usersPoints[userId].name} loses !`, flags: MessageFlags.Ephemeral})
}

const handleListTournamentParticipantsByRanking = async (interaction: CommandInteraction) => {
  if (tournamentParticipants.size === 0) {
    await interaction.reply({ content: 'No participants in the tournament.', flags: MessageFlags.Ephemeral });
    return;
  }

  // Récupérer les données des participants
  const participants = Array.from(tournamentParticipants.keys()).map(userId => {
    return {
      id: userId,
      name: tournamentParticipants.get(userId),
      wins: usersPoints[userId]?.winMatch || 0,
      losses: usersPoints[userId]?.loseMatch || 0
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

  await interaction.reply({ content: `**Tournament Participants Ranked:**\n\n${rankedList}` });
};

// echange de points entre deux utilisateurs
const handleExchangePoints = async (interaction: CommandInteraction) => {
  const userOption = interaction.options.get('user');
  const user = userOption?.user;
  const pointsOption = interaction.options.get('points');
  const points = pointsOption?.value as number;

  if (!user) {
    await interaction.reply({ content: 'User not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const userId = user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: 'User not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const senderId = interaction.user.id;

  if (!usersPoints[senderId]) {
    await interaction.reply({ content: 'User not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (usersPoints[senderId].points < points) {
    await interaction.reply({ content: 'Not enough points.', flags: MessageFlags.Ephemeral });
    return;
  }

  usersPoints[senderId].points -= points;
  usersPoints[userId].points += points;

  await savePoints();

  await interaction.reply({ content: `Successfully transferred ${points} GearPoints to ${user.username}.`, flags: MessageFlags.Ephemeral });
};

const handleToggleMaintenance = async (interaction: CommandInteraction) => {
  maintenanceMode = !maintenanceMode;

  await interaction.reply({ content: `Maintenance mode has been ${maintenanceMode ? 'enabled' : 'disabled'}.`, flags: MessageFlags.Ephemeral });
}

const handleStopBlackjack = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;
  if (!blackjackGames[userId]) {
    await interaction.reply({ content: 'No active blackjack game found.', flags: MessageFlags.Ephemeral });
    return;
  }
  usersPoints[userId].points += 10; // Rembourser 10 points
  usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
  delete blackjackGames[userId];
  await savePoints();
  await interaction.reply({ content: `You have stopped the game. You have been refunded 10 points.`, flags: MessageFlags.Ephemeral });
  await interaction.followUp({ content: `You can now play again !`, flags: MessageFlags.Ephemeral });
}

client.login(process.env.DISCORD_TOKEN!);