# Betty Bet

   Betty Bet is a Discord bot designed to manage bets and games within your server. It offers a variety of commands to place bets, check statistics, organize tournaments, and much more.

## Features

- **/register**: Register to get initial GearPoints and start betting.
- **/points**: Check your current GearPoints and status.
- **/pointvault**: Check the GearPoints in your Point Vault.
- **/claim**: Claim GearPoints from your Point Vault to add them to your balance.
- **/bethistory**: View your betting history.
- **/stats**: View your detailed statistics.
- **/globalstats**: View global betting statistics.
- **/togglenotifications**: Toggle notifications for inventory GearPoints.
- **/clearmessages**: Clear all private messages sent by the bot.
- **/presentation**: Present Betty Bet and its features.
- **/blackjack**: Pay 10 points and play with Betty Bet in a game of blackjack, if you win you win double, if you lose the 10 points are gone and added to the Debilus Closet.
- **/stopblackjack**: to stop a gaming session in the event of a problem and be reimbursed for the 10 points wagered.
- **/highlow**: Play a game of High-Low. You need to have at least 40 points to play.
- **/stophighlow**: Stop the current game of High-Low and refund your 40 points.
- **/exchange**: exchange points with another user
- **/buyitem**: Buy an item in Betty Bet's shop with your GearPoints.
  - **Options**:
    - `itemname`: Name of item.
    - `quantity`: The number of items you want to buy.
- **/listitems**: view items for sale in the store.
- **/myitems**: view items in your inventory.

### Commands reserved for **BetManager** roles:

- **/placeyourbets**: Start a betting period between two players.
  - **Options**:
    - `player1name`: Name of player 1.
    - `player2name`: Name of player 2.
- **/addpoints**: Add GearPoints to a specific user.
  - **Options**:
    - `user`: User to add GearPoints to.
    - `points`: Number of GearPoints to add.
- **/clearbets**: Clear all bets in case of issues and refund GearPoints.
- **/win**: Declare the winner and redistribute GearPoints.
  - **Option**:
    - `winner`: The winning player. (1 or 2)
- **/betslist**: See the list of bets placed on each player.
- **/deleteuser**: Delete a registered user.
  - **Option**:
    - `userid`: ID of the user to delete.
- **/backup**: Encrypt and save data from decrypted backup.
- **/leaderboard**: Show the leaderboard of top betters.
- **/sendbackup**: Send the decrypted backup file.
- **/addtournamentparticipant**: Add a user to the tournament participant list.
  - **Option**:
    - `user`: User to add.
- **/removetournamentparticipant**: Remove a user from the tournament participant list.
  - **Option**:
    - `user`: User to remove.
- **/listtournamentparticipants**: List all tournament participants.
- **/addwinmatch**: adds 1 winning point to a user. (the user must be registered and be in the list of participants in the tournament)
  - **Option**:
    - `user`: Winning user
- **/addlosematch**: adds 1 lossing point to a user. (the user must be registered and be in the list of participants in the tournament)
  - **Option**:
    - `user`: Losing user.
- **/cleartournamentparticipants**: Clear the list of tournament participants.
- **/transferdebilus**: Transfer all GearPoints from the debilus closet to a specific user and empty the closet.
  - **Options**:
    - `user`: User to transfer the GearPoints to.
- **/additem**: Add an item to Betty Bet's shop.
  - **Option**:
    - `itemname`: Name of item.
    - `quantity`: The number of items you want to add.
    - `unitprice`: Enter the price of the item per unit.
- **/tournamentranking**: view the ranking of the tournament participants.
- **/purchasehistory**: View purchase history in the store

## Additional Features

- **Automatic Points System**: Points are added to your Point Vault at fixed times every day (12:00 AM and 12:00 PM Local Time), up to a maximum of 15 points. You can claim these points using the `/claim` command.
- **Debilus Closet**: Every point lost is sent to the Debilus Closet. 
      
## Installation

1. **Install Node.js**:
   First, make sure Node.jsis installed on your machine. Node.jsis a runtime environment for JavaScript that allows you to run your bot. You can download and install it from [nodejs.org](https://nodejs.org/).

2. **Clone this repository to your local machine**:
   To download the source code of this project to your computer, open your terminal (or command prompt) and run the following commands:
   ```sh
   git clone https://github.com/SweetDebilus/betty-bet.git
   cd betty-bet
   ```
   The first command downloads the project, and the second command places you in the project directory.
   
3. **Install the required dependencies**:
   Once you're in the project directory, you need to install all the libraries and modules the project needs to work. Run the following command in your terminal:
   ```sh
   npm install
   ```
   This command reads the `package.json` file and installs all the listed dependencies.
   
4. **Configure the environment variables**:
   Environment variables are sensitive and specific to your setup that you don't want to include directly in your code. To configure these variables, create a file called `.env` at the root of the project (the same directory where package.json is located) and add the following lines with your own values:
   ```sh
   DISCORD_TOKEN=your-discord-bot-token
   ALGO=your-encryption-algorithm
   KEY=your-secret-key
   POINTS=emoji-id
   BETTY=emoji-id
   DEBILUS=emoji-id
   DEBCOIN=emoji-id
   ROLE=your-role-for-users-in-discord
   CHANNEL=your-channel-id-for-the-game
   PATHLOG=path/to/your/log/file.log
   BETTYID=Betty-Bet-Id
   RESTRICTED=true/false
   ```
   Replace each `emoji-id` and `your...` with the appropriate values for your bot.

5. **Start the bot**:
   Finally, to launch your bot, run the following command in your terminal:
   ```sh
   node dist/index.js
   ```
   This command starts your bot by running the index.js file located in the dist directory.

## Usage

   Once the bot is running, invite it to your Discord server and use the commands to start betting and playing. Make sure you have the appropriate roles to use the commands reserved for BetManagers.

   *Please note, this bot meets a specific need and certain features are not suitable for everyone.*

## License

   This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## Conclusion

   This README provides a comprehensive overview of Betty Bet, its features, and how to install and use it. If you need more details or additional modifications, let me know!
