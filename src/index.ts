import { Client, GatewayIntentBits, REST, Routes, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, GuildMember, GuildMemberRoleManager, CommandInteraction, ApplicationCommandOptionType, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import schedule from 'node-schedule';
dotenv.config();
import crypto from 'crypto';

const algorithm = process.env.ALGO!;
const secretKey = Buffer.from(process.env.KEY!, 'hex');

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

const saveDecryptedBackup = () => {
  const data = {
    usersPoints,
    debilusCloset,
    lastUpdateTime: lastUpdateTime.toISOString()
  };
  fs.writeFileSync('decrypted_backup.json', JSON.stringify(data, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité
};


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const pointsEmoji = '<a:GearPoint:1300144849688723486>'; // Use your emoji ID here
const betyEmoji = '<:Bety:1300151295180537978>';
const debilus = '<:debilus:1300218189703024670>';

const filePath = 'usersPoints.json';
let debilusCloset = 0;
let usersPoints: { [key: string]: { points: number, name: string, wins: number, losses: number, isDebilus: boolean, inventory: number } } = {};
let currentBets: { [key: string]: { amount: number, betOn: 'player1' | 'player2' } } = {};
let bettingOpen = false;
let lastUpdateTime = new Date();

const loadPoints = () => {
  if (fs.existsSync(filePath)) {
    try {
      const encryptedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const decryptedData = JSON.parse(decrypt(encryptedData));
      usersPoints = decryptedData.usersPoints || {};
      debilusCloset = decryptedData.debilusCloset || 0;
      lastUpdateTime = new Date(decryptedData.lastUpdateTime || Date.now());
    } catch (error) {
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
  for (const userId in usersPoints) {
    if (usersPoints[userId].inventory < 15) {
      usersPoints[userId].inventory += 1;
    }
  }
  savePoints();
};

// Planifier la tâche pour qu'elle s'exécute à des heures fixes (12:00 AM et 12:00 PM)
schedule.scheduleJob('0 0 * * *', addPointsToInventory); // Exécute tous les jours à minuit
schedule.scheduleJob('0 12 * * *', addPointsToInventory); // Exécute tous les jours à midi

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  loadPoints();

  addPointsToInventory()

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
      description: 'See the list of players who bet on player 1 and player 2'
    },
    {
      name: 'deleteuser',
      description: 'Delete a registered user',
      options: [
        {
          name: 'userid',
          type: ApplicationCommandOptionType.String,
          description: 'ID of the user to delete',
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
          type: ApplicationCommandOptionType.User,
          description: 'User to add points to',
          required: true
        },
        {
          name: 'points',
          type: ApplicationCommandOptionType.Integer,
          description: 'Number of points to add',
          required: true
        }
      ]
    },
    {
      name: 'claim',
      description: 'Claim your points from inventory'
    },
    {
      name: 'inventory',
      description: 'Check your inventory'
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
      name: 'presentation',
      description: 'Present Betty Bet and its functions'
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

    if (!hasRole('Dæmon Punk')) {
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
      case 'presentation':
        await handlePresentation(interaction);
        break;     
      default:
        await interaction.reply({ content: 'Unknown command.', ephemeral: true });
        break;
    }
  } else if (interaction.isButton()) {
    const userId = interaction.user.id;
    if (!usersPoints[userId]) {
      await interaction.reply({ content: 'You are not registered yet. Use **/register** to register.', ephemeral: true });
      return;
    }
    currentBets[userId] = { amount: 0, betOn: interaction.customId as 'player1' | 'player2' };
    const points = usersPoints[userId].points
    await interaction.reply({ content: `You have chosen ${interaction.customId}.\n\nYou have ${points}${pointsEmoji}\nEnter the amount you wish to bet:`, ephemeral: true });
  }
});

client.on('messageCreate', async message => {
  if (!bettingOpen || message.author.bot) return;

  const userId = message.author.id;
  const currentBet = currentBets[userId];
  if (!currentBet) return;

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

  usersPoints[userId].points -= betAmount; // Assurez-vous d'accéder à la propriété 'points'
  currentBets[userId].amount = betAmount;
  savePoints();

  // Ajouter une réaction au message de l'utilisateur
  await message.react('✅'); // Remplace '👍' par l'emoji que tu préfères
});


const handleRegister = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;
  const member = interaction.member as GuildMember;
  const userName = member.nickname || interaction.user.username;

  if (usersPoints[userId]) {
    await interaction.reply({content:`You are already registered.\n\n\n*Debilus* ${debilus}`, ephemeral:true});
    return;
  }

  usersPoints[userId] = { points: 100, name: userName, wins:0, losses:0, isDebilus:false, inventory:0 };
  savePoints();
  await interaction.reply({content:`Registration successful!\n\nYou have received **100 ${pointsEmoji}** !!!`, ephemeral:true});
};

const handlePlaceYourBets = async (interaction: CommandInteraction) => {
  bettingOpen = true;
  currentBets = {};

  const player1Option = interaction.options.get('player1name');
  const player2Option = interaction.options.get('player2name');

  const player1Name = player1Option ? player1Option.value as string : 'Player 1';
  const player2Name = player2Option ? player2Option.value as string : 'Player 2';

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

  await interaction.reply('All bets were void and points were refunded.');
};

const handleLeaderboard = async (interaction: CommandInteraction) => {

  loadPoints();

  const sortedUsers = Object.entries(usersPoints).sort((a, b) => b[1].points - a[1].points);
  const top10 = sortedUsers.slice(0, 10);
  const leaderboard = top10.map(([userId, userInfo], index) => {
    const user = client.users.cache.get(userId);
    return `${index + 1}. ${user?.tag || userInfo.name} - ${userInfo.points} ${pointsEmoji} Points`;
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

  await interaction.reply(`Bets List:\n\n**Player 1:**\n${player1Bets.join('\n') || 'No bets'}\n\n**Player 2:**\n${player2Bets.join('\n') || 'No bets'}\n\n**Total points bet on Player 1:** ${totalPlayer1Bets} ${pointsEmoji}\n**Total points bet on Player 2:** ${totalPlayer2Bets} ${pointsEmoji}\n**Total points bet overall:** ${totalBets} ${pointsEmoji}\n\n**Betting Ratio (Player 1 / Player 2):** ${ratio}`);
};

const handleWin = async (interaction: CommandInteraction, winningPlayer: 'player1' | 'player2') => {
  let totalBetAmount = 0;
  let winnerBetAmount = 0;
  let loserBetAmount = 0;
  const winningPlayerName = winningPlayer === 'player1' ? 'Player 1' : 'Player 2';

  for (const bet of Object.values(currentBets)) {
    totalBetAmount += bet.amount;
    if (bet.betOn === winningPlayer) {
      winnerBetAmount += bet.amount;
    } else {
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
    debilusCloset += totalBetAmount;
    savePoints(); // Sauvegarder après avoir mis à jour debilusCloset
    const file = new AttachmentBuilder('./images/crashboursier.png');
    const message2 = `Thanks for the money, Debilus! All points have been added to the debilus closet. Total points ${pointsEmoji} in debilus closet: ${debilusCloset}`;
    await interaction.reply({ content: `No bets were placed on the winner. ${message2}`, files: [file] });
    return;
  }

  const winningsRatio = totalBetAmount / winnerBetAmount;

  for (const [userId, bet] of Object.entries(currentBets)) {
    if (bet.betOn === winningPlayer) {
      usersPoints[userId].points += Math.floor(bet.amount * winningsRatio);
      usersPoints[userId].wins += 1; // Incrémenter le nombre de victoires
    } else {
      usersPoints[userId].losses += 1; // Incrémenter le nombre de défaites
      if (usersPoints[userId].points === 0) {
        usersPoints[userId].isDebilus = true; // Envoyer au placard à debilus
      }
    }
  }

  savePoints();
  currentBets = {};
  bettingOpen = false;

  const message = `The winner is ${winningPlayerName}! Points have been redistributed.`;
  const message2 = `The winner is ${winningPlayerName}! It's the stock market crash!`;
  const file = new AttachmentBuilder('./images/petitcrashboursier.png');

  if (winnerBetAmount < loserBetAmount) {
    await interaction.reply({ content: message2, files: [file] });
  } else {
    const winFile = new AttachmentBuilder('./images/victoire.png');
    await interaction.reply({ content: message, files: [winFile] });
  }
};

const handleDeleteUser = async (interaction: CommandInteraction) => {
  const userIdToDelete = interaction.options.get('userid')?.value as string;
  
  if (userIdToDelete && usersPoints[userIdToDelete]) {
    const userNameToDelete = usersPoints[userIdToDelete].name;
    delete usersPoints[userIdToDelete];
    savePoints();
    await interaction.reply({ content: `The user ${userNameToDelete} (${userIdToDelete}) has been deleted.`, ephemeral: true });
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
  await interaction.reply({ content: `${pointsToAdd} ${pointsEmoji} Points have been added to ${usersPoints[userId].name}.`, ephemeral: true });
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
    await interaction.reply({ content: 'You have no points to claim.', ephemeral: true });
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
  if (!fs.existsSync('decrypted_backup.json')) {
    await interaction.reply({ content: 'No decrypted backup found.', ephemeral: true });
    return;
  }

  const decryptedData = JSON.parse(fs.readFileSync('decrypted_backup.json', 'utf-8'));
  const encryptedData = encrypt(JSON.stringify(decryptedData));
  
  fs.writeFileSync(filePath, JSON.stringify(encryptedData, null, 2)); // Ajout de l'indentation pour une meilleure lisibilité
  await interaction.reply({ content: 'Data from decrypted backup has been encrypted and saved successfully.', ephemeral: true });
};

const handleSendDecryptedBackup = async (interaction: CommandInteraction) => {
  if (!fs.existsSync('decrypted_backup.json')) {
    await interaction.reply({ content: 'No decrypted backup found.', ephemeral: true });
    return;
  }

  const file = new AttachmentBuilder('decrypted_backup.json');
  await interaction.reply({ content: 'Here is the decrypted backup file.', files: [file], ephemeral: true });
};

const handlePresentation = async (interaction: CommandInteraction) => {
  const presentation = `
Hi, I'm Betty Bet, your betting bot! Here’s what I can do:
  - **Register**: Use \`/register\` to sign up and get your initial points.
- **Place Your Bets**: Start a betting period with \`/placeyourbets\`, and choose between two players. **(BetManager only)**
  BetManager uses this command to start betting, bettors can choose who they want to bet on and the bet amount
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
  await interaction.reply({ content: presentation, ephemeral: true });
};


client.login(process.env.DISCORD_TOKEN!);