import { Client, GatewayIntentBits, REST, Routes, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, GuildMember, GuildMemberRoleManager, CommandInteraction, ApplicationCommandOptionType, TextChannel, ButtonInteraction, Message, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import schedule from 'node-schedule';
dotenv.config();
import crypto from 'crypto';

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

const filePath = 'usersPoints.json';
let debilusCloset = 0;
let player1Name: string;
let player2Name: string;
let usersPoints: { [key: string]: { points: number, name: string, wins: number, losses: number, isDebilus: boolean, inventory: number, notificationsEnabled: boolean, betHistory: { betOn: string, amount: number, result: string, date: Date  }[] }} = {};
let currentBets: { [key: string]: { amount: number, betOn: 'player1' | 'player2' } } = {};
let bettingOpen = false;
let tournamentParticipants: Map<string, string> = new Map();
let lastUpdateTime = new Date();
let activeGuessGames: { [key: string]: string } = {}; // Canal ID -> Utilisateur ID

const fs1 = require('fs');
const logFile = process.env.PATHLOG!;

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
      lastUpdateTime: lastUpdateTime.toISOString()
    };
    fs.writeFileSync('DataDebilus/decrypted_backup.json', JSON.stringify(data, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité
  } catch (error) {
    log(`Error saving points: ${error}`)
  }
};

interface TournamentParticipant {
  userId: string;
  userName: string;
}

const saveTournamentParticipants = async () => {
  const participantsArray = Array.from(tournamentParticipants);
  fs.writeFileSync('DataDebilus/tournamentParticipants.json', JSON.stringify(participantsArray, null, 2));
};

const loadTournamentParticipants = async () => {
  if (fs.existsSync('DataDebilus/tournamentParticipants.json')) {
    const participantsArray: TournamentParticipant[] = JSON.parse(fs.readFileSync('DataDebilus/tournamentParticipants.json', 'utf-8'));
    tournamentParticipants = new Map(participantsArray.map(participant => [participant.userId, participant.userName]));
  }
};

// Appeler loadTournamentParticipants lors du démarrage
loadTournamentParticipants();

const loadPoints = async () => {
  if (fs.existsSync(filePath)) {
    try {
      const encryptedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const decryptedData = JSON.parse(decrypt(encryptedData));
      usersPoints = decryptedData.usersPoints || {};
      debilusCloset = decryptedData.debilusCloset || 0;
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
      usersPoints[userId].inventory = Math.min(usersPoints[userId].inventory + cyclesPassed, 15);

      if (usersPoints[userId].inventory === 10) {
        await sendNotification(userId, 10); // Notification à 10 points
      } else if (usersPoints[userId].inventory === 15) {
        await sendNotification(userId, 15); // Notification à 15 points
      }
    }
  }
  if (now.getHours() < 12) {
    lastUpdateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else {
    lastUpdateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }
  savePoints();
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
    .setDescription('Start a betting period') 
    .addStringOption(option => option.setName('player1name') 
    .setDescription('Name of player 1') 
    .setRequired(true)) 
    .addStringOption(option => option.setName('player2name') 
    .setDescription('Name of player 2') 
    .setRequired(true)), 
  new SlashCommandBuilder() 
    .setName('addpoints') 
    .setDescription('Add points to a user') 
    .addUserOption(option => option.setName('user') 
    .setDescription('User to add points to') 
    .setRequired(true)) 
    .addIntegerOption(option => option.setName('points') 
    .setDescription('Number of points to add') 
    .setRequired(true)), 
  new SlashCommandBuilder() 
    .setName('points') 
    .setDescription('Check your points'), 
  new SlashCommandBuilder() 
    .setName('inventory') 
    .setDescription('Check your inventory'), 
  new SlashCommandBuilder() 
    .setName('claim') 
    .setDescription('Claim your points from inventory'),
  new SlashCommandBuilder() 
    .setName('clearbets') 
    .setDescription('Clear all bets in case of issues'), 
  new SlashCommandBuilder() 
    .setName('leaderboard') 
    .setDescription('Show leaderboard of top betters'),
  new SlashCommandBuilder() 
    .setName('win') 
    .setDescription('Declare the winner and redistribute points') 
    .addIntegerOption(option => option.setName('winner') 
    .setDescription('The winning player (1 or 2)') 
    .setRequired(true)), 
  new SlashCommandBuilder() 
    .setName('betslist') 
    .setDescription('See the list of players who bet on player 1 and player 2'), 
  new SlashCommandBuilder() 
    .setName('deleteuser') 
    .setDescription('Delete a registered user') 
    .addStringOption(option => option.setName('userid') 
    .setDescription('ID of the user to delete') 
    .setRequired(true)), 
  new SlashCommandBuilder() 
    .setName('backup') 
    .setDescription('Encrypt and save data from decrypted backup'), 
  new SlashCommandBuilder() 
    .setName('sendbackup') 
    .setDescription('Send the decrypted backup file'), 
  new SlashCommandBuilder() 
    .setName('addtournamentparticipant') 
    .setDescription('Add a participant to the tournament') 
    .addUserOption(option => option.setName('user') 
    .setDescription('The user to add to the tournament') 
    .setRequired(true)), 
  new SlashCommandBuilder() 
    .setName('removetournamentparticipant') 
    .setDescription('Remove a participant from the tournament') 
    .addUserOption(option => option.setName('user') 
    .setDescription('The user to remove from the tournament') 
    .setRequired(true)), 
  new SlashCommandBuilder() 
    .setName('listtournamentparticipants') 
    .setDescription('List all participants in the tournament'),
  new SlashCommandBuilder() 
    .setName('cleartournamentparticipants') 
    .setDescription('Clear the list of tournament participants'), 
  new SlashCommandBuilder() 
    .setName('presentation') 
    .setDescription('Present Betty Bet and its functions'), 
  new SlashCommandBuilder() 
    .setName('togglenotifications') 
    .setDescription('Toggle notifications for inventory points'), 
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
    .setDescription('View global betting statistics'), 
  new SlashCommandBuilder() 
    .setName('guess') 
    .setDescription('Play a guessing game! Try to guess the number between 1 and 10000 in 40sec.'), 
  new SlashCommandBuilder() 
    .setName('transferdebilus') 
    .setDescription('Transfer all GearPoints from the debilus closet to a specific user and empty the closet.') 
    .addUserOption(option => option.setName('user') 
    .setDescription('User to transfer the GearPoints to') 
    .setRequired(true)) 
  ]; 
  
const commandData = commands.map(command => command.toJSON()); 

client.once('ready', async () => {
  log(`Logged in as ${client.user?.tag}!`);

  loadPoints();

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
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    if (!joinedMoreThan7DaysAgo()) {
      await interaction.reply({ content: 'You must have been a member of the server for at least 7 days to use this command.', ephemeral: true });
      return;
    }

    switch (commandName) {
      case 'register':
        await handleRegister(interaction);
        break;
      case 'addtournamentparticipant':
        if (hasRole('BetManager')) {
        await handleAddTournamentParticipant(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        break;
      case 'removetournamentparticipant':
        if (hasRole('BetManager')) {
          await handleRemoveTournamentParticipant(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        break;
      case 'listtournamentparticipants':
        if (hasRole('BetManager')) {
          await handleListTournamentParticipants(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        break;
      case 'cleartournamentparticipants':
        if (hasRole('BetManager')) {
          await handleClearTournamentParticipants(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        break;        
      case 'placeyourbets':
        if (hasRole('BetManager')) {
          await handlePlaceYourBets(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        break;
      case 'points':
        await handlePoints(interaction);
        break;
      case 'clearbets':
        if (hasRole('BetManager')) {
          await handleClearBets(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        break;
      case 'leaderboard':
        await handleLeaderboard(interaction);
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
          await interaction.reply({content:'You do not have permission to use this command.', ephemeral:true});
        }
        break;
      case 'betslist':
        if (hasRole('BetManager')) {
          await handleBetsList(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        break;
      case 'deleteuser':
        if (hasRole('BetManager')) {
          await handleDeleteUser(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        break;
      case 'addpoints':
        if (hasRole('BetManager')) {
          await handleAddPoints(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        break;
      case 'claim':
        await handleClaim(interaction);
        break;
      case 'inventory':
        await handleInventory(interaction);
        break;   
      case 'backup':
        if (hasRole('BetManager')) {
          await handleBackup(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        break;  
      case 'sendbackup':
        if (hasRole('BetManager')) {
          await handleSendDecryptedBackup(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
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
        await handleBetHistory(interaction);
        break;
      case 'stats':
        await handleStats(interaction);
        break;
      case 'globalstats':
        await handleGlobalStats(interaction);
        break;
      case 'guess':
        await handleGuess(interaction);
        break
      case 'transferdebilus':
        if (hasRole('BetManager')) {
          await handleTransferDebilus(interaction);
        } else {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
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
  } else if (interaction.isButton()) {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
      await interaction.reply({ content: 'Please register first using /register.', ephemeral: true });
      return;
    }

    if (interaction.customId.startsWith('claim_')) {
      await handleClaimYesNo(interaction as ButtonInteraction);
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

  const betAmount = parseInt(message.content);

  if (isNaN(betAmount) || betAmount <= 0) {
    const reply = await message.reply('Invalid bet amount. Please try again.');
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
  const chosenPlayerName = currentBet.betOn === 'player1' ? player1Name : player2Name;
  const lastBet = betHistory[betHistory.length - 1];

  if (lastBet && lastBet.result === 'pending' && lastBet.betOn === chosenPlayerName) {
    lastBet.amount += betAmount;
  } else {
    betHistory.push({
      betOn: chosenPlayerName,
      amount: betAmount,
      result: 'pending',
      date: new Date()
    });
  }

  savePoints();

  // Ajouter une réaction au message de l'utilisateur
  await message.react('✅'); // Remplace '✅' par l'emoji que tu préfères
});

const handleRegister = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;
  const member = interaction.member as GuildMember;
  const userName = member.nickname || interaction.user.displayName;

  if (usersPoints[userId]) {
    await interaction.reply({content:`You are already registered.\n\n\n*Debilus* ${debilus}`, ephemeral:true});
    return;
  }

  usersPoints[userId] = { points: 100, name: userName, wins:0, losses:0, isDebilus:false, inventory:0, notificationsEnabled: false, betHistory: [] };
  savePoints();
  await interaction.reply({content:`Registration successful!\n\nYou have received **100 ${pointsEmoji}** !!!\n\n **Optional**: This bot integrates a notification system, you can activate it by doing the command \`/togglenotification\` and Betty Bet will send you a DM when you reach 10 points in your inventory.`, ephemeral:true});

};

const handleToggleNotifications = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({content:'You are not registered yet. Use `/register` to sign up.', ephemeral: true});
    return;
  }

  usersPoints[userId].notificationsEnabled = !usersPoints[userId].notificationsEnabled;
  savePoints();
  await interaction.reply({content:`Notifications have been ${usersPoints[userId].notificationsEnabled ? 'enabled' : 'disabled'}.`, ephemeral: true});
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
        .setLabel(player1Name)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('player2')
        .setLabel(player2Name)
        .setStyle(ButtonStyle.Primary),
    );

  await interaction.reply({ content: `**the bets are open !!!\n\n**You have **60 seconds** to choose between **${player1Name}** and **${player2Name}**.`, components: [row] });

  const channel = interaction.channel as TextChannel;
  if (channel) {
    channel.send(`${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}`);
  }

  setTimeout(async () => {
    bettingOpen = false;
    await interaction.followUp('**Bets are closed !**');
    if (channel) {
      channel.send(`${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}`);
      channel.send('*Thanks for money !*');
    }
  }, 60000);
};

const handleBetSelection = async (interaction: ButtonInteraction) => {
  const userId = interaction.user.id;
  const customId = interaction.customId;

  // Vérifier si l'utilisateur essaie de parier sur un autre joueur
  if (currentBets[userId] && currentBets[userId].betOn !== customId) {
    await interaction.reply({ content: 'You have already placed a bet on the other player. You cannot bet on both players.', ephemeral: true });
    return;
  }

  currentBets[userId] = { amount: 0, betOn: customId as 'player1' | 'player2' };

  const points = usersPoints[userId].points;
  const chosenPlayerName = customId === 'player1' ? player1Name : player2Name;

  if (!interaction.replied) {
    await interaction.reply({
      content: `You have chosen ${chosenPlayerName}.\n\nYou have ${points}${pointsEmoji}\nEnter the amount you wish to bet:`,
      ephemeral: true
    });
  }
};

const handlePoints = async (interaction: CommandInteraction) => {

  loadPoints();

  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({content:'You are not registered yet. Use */register* to register.', ephemeral: true});
    return;
  }

  const userInfo = usersPoints[userId];
  const status = userInfo.isDebilus ? `you are a **Debilus** ${debilus}` : 'bettor';
  await interaction.reply({ content: `**${userInfo.name}**\n\nYou have **${userInfo.points}** ${pointsEmoji}\n\n| **${userInfo.wins} wins** | **${userInfo.losses} losses** |\n\n**Status:** ${status}`, ephemeral: true });
};

const handleClearBets = async (interaction: CommandInteraction) => {
  for (const [userId, bet] of Object.entries(currentBets)) {
    if (usersPoints[userId]) {
      usersPoints[userId].points += bet.amount; // Assurez-vous que 'points' est bien un nombre
    }
  }

  savePoints();
  currentBets = {};
  bettingOpen = false;

  await interaction.reply('All bets were void and Gearpoints were refunded.');
};

const handleLeaderboard = async (interaction: CommandInteraction) => {

  loadPoints();

  const sortedUsers = Object.entries(usersPoints).sort((a, b) => b[1].points - a[1].points);
  const top10 = sortedUsers.slice(0, 10);
  const leaderboard = top10.map(([userId, userInfo], index) => {
    const user = client.users.cache.get(userId);
    return `${index + 1}. ${user?.displayName || userInfo.name} - ${userInfo.points} ${pointsEmoji}`;
  }).join('\n');

  await interaction.reply(`Ranking of the best bettors :\n\n${leaderboard}`);
};

const handleBetsList = async (interaction: CommandInteraction) => {
  let totalPlayer1Bets = 0;
  let totalPlayer2Bets = 0;

  const player1Bets = Object.entries(currentBets)
    .filter(([, bet]) => bet.betOn === 'player1')
    .map(([userId, bet]) => {
      totalPlayer1Bets += bet.amount;
      return `${client.users.cache.get(userId)?.tag || 'Unknown User'}: ${bet.amount} ${pointsEmoji}`;
    });

  const player2Bets = Object.entries(currentBets)
    .filter(([, bet]) => bet.betOn === 'player2')
    .map(([userId, bet]) => {
      totalPlayer2Bets += bet.amount;
      return `${client.users.cache.get(userId)?.tag || 'Unknown User'}: ${bet.amount} ${pointsEmoji}`;
    });

  const totalBets = totalPlayer1Bets + totalPlayer2Bets;
  const ratio = totalPlayer2Bets === 0 ? 'N/A' : (totalPlayer1Bets / totalPlayer2Bets).toFixed(2);

  await interaction.reply(`Bets List:\n\n**Player 1:**\n${player1Bets.join('\n') || 'No bets'}\n\n**Player 2:**\n${player2Bets.join('\n') || 'No bets'}\n\n**Total points bet on Player 1:** ${totalPlayer1Bets} ${pointsEmoji}\n**Total GearPoints bet on Player 2:** ${totalPlayer2Bets} ${pointsEmoji}\n**Total GearPoints bet overall:** ${totalBets} ${pointsEmoji}\n\n**Betting Ratio (Player 1 / Player 2):** ${ratio}`);
};

const handleWin = async (interaction: CommandInteraction, winningPlayer: 'player1' | 'player2') => {
  let totalBetAmount = 0;
  let winnerBetAmount = 0;
  let loserBetAmount = 0;
  const winningPlayerName = winningPlayer === 'player1' ? player1Name : player2Name;

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
    await interaction.reply({ content: message, ephemeral: true });
    return;
  }  

  if (winnerBetAmount === 0) {
    // Ajouter tous les points dans le placard à debilus
    debilusCloset += totalBetAmount;
    savePoints(); // Sauvegarder après avoir mis à jour debilusCloset
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
    } else {
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
    savePoints();
    await interaction.reply({ content: `The user **${userNameToDelete}** (${userIdToDelete}) has been deleted.`, ephemeral: true });
  } else {
    await interaction.reply({ content: 'User no found', ephemeral: true });
  }
};

const handleAddPoints = async (interaction: CommandInteraction) => {
  const userOption = interaction.options.get('user');
  const pointsOption = interaction.options.get('points');

  const userId = userOption?.value as string;
  const pointsToAdd = pointsOption?.value as number;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: `User with id ${userId} is not registered`, ephemeral: true });
    return;
  }

  usersPoints[userId].points += pointsToAdd;
  usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
  savePoints();
  await interaction.reply({ content: `**${pointsToAdd}** ${pointsEmoji} Points have been added to **${usersPoints[userId].name}**.`, ephemeral: true });
};

const handleClaim = async (interaction: CommandInteraction) => {
  loadPoints();
  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: 'You are not registered yet. Use `/register` to register.', ephemeral: true });
    return;
  }

  const pointsToClaim = usersPoints[userId].inventory;
  if (pointsToClaim > 0) {
    usersPoints[userId].points += pointsToClaim;
    usersPoints[userId].inventory = 0;
    usersPoints[userId].isDebilus = false; // Mettre à jour le statut debilus
    savePoints();

    await interaction.reply({ content: `You have claimed **${pointsToClaim}** ${pointsEmoji}.\n\nYou now have **${usersPoints[userId].points}** ${pointsEmoji}`, ephemeral: true });
  } else {
    await interaction.reply({ content: 'You have no points to claim. try again later !', ephemeral: true });
  }
};

const handleInventory = async (interaction: CommandInteraction) => {

  loadPoints();

  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({ content:`You are not registered yet. Use */register* to register.`, ephemeral: true })
    return;
  }
  const inventoryPoints = usersPoints[userId].inventory;
  await interaction.reply({ content: `You have **${inventoryPoints}** ${pointsEmoji} in your inventory.`, ephemeral: true })
};

const handleBackup = async (interaction: CommandInteraction) => {
  createDataDebilusDir();

  if (!fs.existsSync('DataDebilus/decrypted_backup.json')) {
    await interaction.reply({ content: 'No decrypted backup found.', ephemeral: true });
    return;
  }

  const decryptedData = JSON.parse(fs.readFileSync('DataDebilus/decrypted_backup.json', 'utf-8'));
  const encryptedData = encrypt(JSON.stringify(decryptedData));

  fs.writeFileSync(filePath, JSON.stringify(encryptedData, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité

  // Mettre à jour les variables locales après la sauvegarde
  usersPoints = decryptedData.usersPoints;
  debilusCloset = decryptedData.debilusCloset;
  lastUpdateTime = new Date(decryptedData.lastUpdateTime);

  await interaction.reply({ content: 'Data from decrypted backup has been encrypted and **saved successfully** !', ephemeral: true });
};

const handleSendDecryptedBackup = async (interaction: CommandInteraction) => {
  createDataDebilusDir();

  if (!fs.existsSync('DataDebilus/decrypted_backup.json')) {
    await interaction.reply({ content: 'No decrypted backup found.', ephemeral: true });
    return;
  }

  const file = new AttachmentBuilder('DataDebilus/decrypted_backup.json');
  await interaction.reply({ content: 'Here is the decrypted backup file.', files: [file], ephemeral: true });
};

const handleAddTournamentParticipant = async (interaction: CommandInteraction) => {
  const userOption = interaction.options.get('user');
  const user = userOption?.user;

  if (user) {
    tournamentParticipants.set(user.id, user.displayName); // Ajouter l'ID et le pseudo à la Map
    saveTournamentParticipants();
    await interaction.reply({ content: `${user.displayName} has been added to the tournament.`, ephemeral: true });
  } else {
    await interaction.reply({ content: 'User not found.', ephemeral: true });
  }
};

const handleRemoveTournamentParticipant = async (interaction: CommandInteraction) => {
  const userOption = interaction.options.get('user');
  const user = userOption?.user;

  if (user) {
    tournamentParticipants.delete(user.id);
    saveTournamentParticipants();
    await interaction.reply({ content: `${user.displayName} has been removed from the tournament.`, ephemeral: true });
  } else {
    await interaction.reply({ content: 'User not found.', ephemeral: true });
  }
};

const handleListTournamentParticipants = async (interaction: CommandInteraction) => {
  if (tournamentParticipants.size === 0) {
    await interaction.reply({ content: 'No participants in the tournament.', ephemeral: true });
    return;
  }

  const participantsList = Array.from(tournamentParticipants.entries()).map(([id, username]) => {
    return `ID: ${id}, Pseudo: ${username}`;
  }).join('\n');

  await interaction.reply({ content: `Tournament Participants:\n${participantsList}`, ephemeral: true });
};

const handleClearTournamentParticipants = async (interaction: CommandInteraction) => {
  tournamentParticipants.clear(); // Effacer tous les participants
  saveTournamentParticipants(); // Sauvegarder l'état vide
  await interaction.reply({ content: 'All tournament participants have been cleared.', ephemeral: true });
};

const handleClaimYesNo = async (interaction: ButtonInteraction) => {
  const userId = interaction.user.id;
  
  if (!usersPoints[userId]) {
    if (!interaction.replied) {
      await interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', ephemeral: true });
    }
    return;
  }

  if (interaction.customId === 'claim_yes') {
    const pointsToClaim = usersPoints[userId].inventory;
    usersPoints[userId].points += pointsToClaim;
    usersPoints[userId].inventory = 0;
    savePoints();

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
  await interaction.reply({ content: part1, ephemeral: true });
  await interaction.followUp({ content: part2, ephemeral: true });
  await interaction.followUp({ content: part3, ephemeral: true });
};

const handleClearMessages = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;
  const user = await client.users.fetch(userId);

  if (!user) {
    await interaction.reply({ content: 'User not found.', ephemeral: true });
    return;
  }

  try {
    const dmChannel = await user.createDM();
    const messages = await dmChannel.messages.fetch({ limit: 100 });

    const botMessages = messages.filter(msg => msg.author.id === client.user?.id);

    for (const message of botMessages.values()) {
      await message.delete();
    }

    await interaction.reply({ content: 'All private messages sent by the bot have been cleared.', ephemeral: true });
  } catch (error) {
    log(`Failed to clear messages for user ${userId}: ${error}`);
    await interaction.reply({ content: 'Failed to clear messages.', ephemeral: true });
  }
};

const handleBetHistory = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', ephemeral: true });
    return;
  }

  const betHistory = usersPoints[userId].betHistory;

  if (betHistory.length === 0) {
    await interaction.reply({ content: 'You have no betting history.', ephemeral: true });
    return;
  }

  let historyMessage = 'Your Betting History:\n';

  betHistory.forEach(async (bet, index) => {
    const betInfo = `\n**Bet ${index + 1}:**\nDate: ${bet.date.toLocaleString()}\nBet On: ${bet.betOn}\nAmount: ${bet.amount}${pointsEmoji}\nResult: ${bet.result}\n`;
    if ((historyMessage + betInfo).length > 2000) {
      await interaction.reply({ content: historyMessage, ephemeral: true });
      historyMessage = 'Your Betting History (continued):\n';
    }
    historyMessage += betInfo;
  });

  if (historyMessage.length > 0) {
    await interaction.reply({ content: historyMessage, ephemeral: true });
  }
};

const handleStats = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', ephemeral: true });
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

  await interaction.reply({ content: statsMessage, ephemeral: true });
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

- ${debcoins} **Total Points**: ${totalPoints} ${pointsEmoji}
- 🏆 **Total Wins**: ${totalWins}
- 😢 **Total Losses**: ${totalLosses}
- 🎲 **Total Bets**: ${totalBets}
- 📈 **Global Win Percentage**: ${winPercentage}%
- 📉 **Global Loss Percentage**: ${lossPercentage}%
  `;

  await interaction.reply({ content: globalStatsMessage });
};

const handleGuess = async (interaction: CommandInteraction) => {
  const allowedChannelId = process.env.CHANNEL!; // Remplacez par l'ID de votre canal #Betty-Bet-Game
  const channelId = interaction.channelId;

  if (channelId !== allowedChannelId) {
    const reply = await interaction.reply({ content: 'This command can only be used in the #Betty-Bet-Game channel.', ephemeral: true });
    setTimeout(() => reply.delete(), 3000 );
    return;
  }

  const userId = interaction.user.id;
  if (!usersPoints[userId]) {
    const reply = await interaction.reply({ content: 'You are not registered yet. Use `/register` to sign up.', ephemeral: true });
    setTimeout(() => reply.delete(), 3000 );
    return;
  }

  if (activeGuessGames[channelId]) {
    const reply = await interaction.reply({ content: 'A guessing game is already in progress in this channel. Please wait for it to finish.', ephemeral: true });
    setTimeout(() => reply.delete(), 3000 );
    return;
  }

  activeGuessGames[channelId] = userId; // Marquer le jeu comme actif

  const numberToGuess = Math.floor(Math.random() * 10000) + 1;
  await interaction.reply({ content: 'Guess a number between 1 and 10000!' });

  const channel = interaction.channel;
  if (!channel || !(channel instanceof TextChannel)) {
    await interaction.followUp({ content: 'Unable to start the guessing game as the channel is not available or is not a text channel.', ephemeral: true });
    delete activeGuessGames[channelId]; // Nettoyer l'état en cas d'erreur
    return;
  }

  const filter = (response: Message) => {
    return !isNaN(Number(response.content)) && response.author.id === userId;
  };

  const messagesToDelete: Message[] = [];

  const collector = channel.createMessageCollector({ filter, time: 40000 });

  collector.on('collect', async (response: Message) => {
    const guess = Number(response.content);
    messagesToDelete.push(response);

    if (guess === numberToGuess) {
      usersPoints[userId].points += 5; // Gagner 5 GearPoints en cas de succès
      savePoints();
      await response.reply({ content: `Congratulations! You guessed the correct number: ${numberToGuess}. You have won 5 GearPoints.` });
      collector.stop('guessed correctly');
    } else if (guess < numberToGuess) {
      const reply = await response.reply({ content: 'Higher!' });
      messagesToDelete.push(reply);
    } else {
      const reply = await response.reply({ content: 'Lower!' });
      messagesToDelete.push(reply);
    }
  });

  collector.on('end', (collected, reason) => {
    if (reason !== 'guessed correctly') {
      const pointsLost = Math.min(10, usersPoints[userId].points); // Nombre de points à perdre
      usersPoints[userId].points -= pointsLost; // Perdre les points
      debilusCloset += pointsLost; // Ajouter les points perdus au debilus closet
      usersPoints[userId].isDebilus = usersPoints[userId].points <= 0
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
};

const handleTransferDebilus = async (interaction: CommandInteraction) => {
  const userOption = interaction.options.get('user');
  const user = userOption?.user;

  if (!user) {
    await interaction.reply({ content: 'User not found.', ephemeral: true });
    return;
  }

  const userId = user.id;

  if (!usersPoints[userId]) {
    await interaction.reply({ content: 'The specified user is not registered.', ephemeral: true });
    return;
  }

  if (debilusCloset === 0) {
    await interaction.reply({ content: 'The debilus closet is already empty.', ephemeral: true });
    return;
  }

  // Transfer the points from the debilus closet to the user
  usersPoints[userId].points += debilusCloset;
  const transferredPoints = debilusCloset;
  debilusCloset = 0;

  savePoints();
  await interaction.reply({ content: `Transferred ${transferredPoints} GearPoints from the debilus closet to ${user.username}. The debilus closet is now empty.`, ephemeral: true });
};

client.login(process.env.DISCORD_TOKEN!);
