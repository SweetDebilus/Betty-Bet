import { Client, GatewayIntentBits, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember, GuildMemberRoleManager, CommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const filePath = 'usersPoints.json';
let usersPoints: { [key: string]: { points: number, name: string } } = {};
let currentBets: { [key: string]: { amount: number, betOn: 'player1' | 'player2' } } = {};
let bettingOpen = false;

if (fs.existsSync(filePath)) {
  usersPoints = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

const savePoints = () => {
  fs.writeFileSync(filePath, JSON.stringify(usersPoints, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité
};


client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

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
          type: ApplicationCommandOptionType.String,
          description: 'Name of player 1',
          required: true
        },
        {
          name: 'player2name',
          type: ApplicationCommandOptionType.String,
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
          type: ApplicationCommandOptionType.Integer,
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
          type: ApplicationCommandOptionType.String,
          description: 'ID de l\'utilisateur à supprimer',
          required: true
        }
      ]
    }    
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }

});

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;
    const member = interaction.member as GuildMember;

    if (!member) {
      await interaction.reply('Une erreur est survenue. Impossible de vérifier les rôles de l’utilisateur.');
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

    if (!hasRole('Deamon Punk')) {
      await interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
      return;
    }

    if (!joinedMoreThan7DaysAgo()) {
      await interaction.reply({ content: 'Vous devez être membre du serveur depuis au moins 7 jours pour utiliser cette commande.', ephemeral: true });
      return;
    }

    switch (commandName) {
      case 'register':
        await handleRegister(interaction);
        break;
      case 'placeyourbets':
        if (hasRole('BetManager')) {
          await handlePlaceYourBets(interaction);
        } else {
          await interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
        }
        break;
      case 'points':
        await handlePoints(interaction);
        break;
      case 'clearbets':
        if (hasRole('BetManager')) {
          await handleClearBets(interaction);
        } else {
          await interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
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
            await interaction.reply('Le gagnant doit être 1 ou 2.');
          }
        } else {
          await interaction.reply({content:'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral:true});
        }
        break;
      case 'betslist':
        if (hasRole('BetManager')) {
          await handleBetsList(interaction);
        } else {
          await interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
        }
        break;
      case 'deleteuser':
        if (hasRole('BetManager')) {
          await handleDeleteUser(interaction);
        } else {
          await interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
        }
        break;        
      default:
        await interaction.reply({ content: 'Commande inconnue.', ephemeral: true });
        break;
    }
  } else if (interaction.isButton()) {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
      await interaction.reply({ content: 'Inscrivez-vous d\'abord en utilisant /register.', ephemeral: true });
      return;
    }

    currentBets[userId] = { amount: 0, betOn: interaction.customId as 'player1' | 'player2' };
    await interaction.reply({ content: `Vous avez choisi ${interaction.customId}. Entrez le montant que vous souhaitez parier :`, ephemeral: true });
  }
});

client.on('messageCreate', async message => {
  if (!bettingOpen || message.author.bot) return;

  const userId = message.author.id;
  const currentBet = currentBets[userId];
  if (!currentBet) return;

  const betAmount = parseInt(message.content);
  if (isNaN(betAmount) || betAmount <= 0) {
    await message.reply('Montant du pari invalide. Essayez à nouveau.');
    return;
  }

  if (usersPoints[userId].points < betAmount) {
    await message.reply('Points insuffisants. Essayez un montant inférieur.');
    return;
  }

  usersPoints[userId].points -= betAmount; // Assurez-vous d'accéder à la propriété 'points'
  currentBets[userId].amount = betAmount;
  savePoints();

  const playerName = currentBet.betOn === 'player1' ? 'Joueur 1' : 'Joueur 2';

  await message.reply(`Vous avez parié ${betAmount} points sur ${playerName}.`);
});

const handleRegister = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;
  const member = interaction.member as GuildMember;
  const userName = member.nickname || interaction.user.username;

  if (usersPoints[userId]) {
    await interaction.reply({content:'Vous êtes déjà enregistré.', ephemeral:true});
    return;
  }

  usersPoints[userId] = { points: 100, name: userName };
  savePoints();
  await interaction.reply({content:'Inscription réussie ! Vous avez reçu 100 points.', ephemeral:true});
};

const handlePlaceYourBets = async (interaction: CommandInteraction) => {
  bettingOpen = true;
  currentBets = {};

  const player1Option = interaction.options.get('player1name');
  const player2Option = interaction.options.get('player2name');

  const player1Name = player1Option ? player1Option.value as string : 'Joueur 1';
  const player2Name = player2Option ? player2Option.value as string : 'Joueur 2';

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

  await interaction.reply({ content: `Les paris sont ouverts ! Vous avez 60 secondes pour choisir entre ${player1Name} et ${player2Name}.`, components: [row] });

  setTimeout(async () => {
    bettingOpen = false;
    await interaction.followUp('Les paris sont fermés !');
  }, 60000);
};

const handlePoints = async (interaction: CommandInteraction) => {
  // Recharge les points depuis le fichier
  if (fs.existsSync(filePath)) {
    usersPoints = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  const userId = interaction.user.id;

  if (!usersPoints[userId]) {
    await interaction.reply('Vous n\'êtes pas encore enregistré. Utilisez /register pour vous inscrire.');
    return;
  }

  const userInfo = usersPoints[userId];
  await interaction.reply({ content: `Vous avez ${userInfo.points} points, ${userInfo.name}.`, ephemeral: true });
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

  await interaction.reply('Tous les paris ont été annulés et les points ont été restitués.');
};

const handleLeaderboard = async (interaction: CommandInteraction) => {
  const sortedUsers = Object.entries(usersPoints).sort((a, b) => b[1].points - a[1].points);
  const top10 = sortedUsers.slice(0, 10);
  const leaderboard = top10.map(([userId, userInfo], index) => {
    const user = client.users.cache.get(userId);
    return `${index + 1}. ${user?.tag || userInfo.name} - ${userInfo.points} points`;
  }).join('\n');

  await interaction.reply(`Classement des meilleurs parieurs :\n\n${leaderboard}`);
};

const handleBetsList = async (interaction: CommandInteraction) => {
  const player1Bets = Object.entries(currentBets)
    .filter(([, bet]) => bet.betOn === 'player1')
    .map(([userId, bet]) => `${client.users.cache.get(userId)?.tag || 'Utilisateur inconnu'}: ${bet.amount} points`);

  const player2Bets = Object.entries(currentBets)
    .filter(([, bet]) => bet.betOn === 'player2')
    .map(([userId, bet]) => `${client.users.cache.get(userId)?.tag || 'Utilisateur inconnu'}: ${bet.amount} points`);

  await interaction.reply(`Liste des paris :\n\n**Joueur 1 :**\n${player1Bets.join('\n') || 'Aucun pari'}\n\n**Joueur 2 :**\n${player2Bets.join('\n') || 'Aucun pari'}`);
};

const handleWin = async (interaction: CommandInteraction, winningPlayer: 'player1' | 'player2') => {
  let totalBetAmount = 0;
  let winnerBetAmount = 0;

  for (const bet of Object.values(currentBets)) {
    totalBetAmount += bet.amount;
    if (bet.betOn === winningPlayer) {
      winnerBetAmount += bet.amount;
    }
  }

  if (winnerBetAmount === 0) {
    await interaction.reply('Aucun pari n\'a été placé sur le gagnant.');
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

  await interaction.reply(`Le joueur ${winningPlayer === 'player1' ? 1 : 2} a gagné ! Les points ont été redistribués.`);
};

const handleDeleteUser = async (interaction: CommandInteraction) => {
  const userIdToDelete = interaction.options.get('userid')?.value as string;
  
  if (userIdToDelete && usersPoints[userIdToDelete]) {
    const userNameToDelete = usersPoints[userIdToDelete].name;
    delete usersPoints[userIdToDelete];
    savePoints();
    await interaction.reply({ content: `L'utilisateur ${userNameToDelete} (${userIdToDelete}) a été supprimé.`, ephemeral: true });
  } else {
    await interaction.reply({ content: 'Utilisateur non trouvé.', ephemeral: true });
  }
};

client.login(process.env.DISCORD_TOKEN!);