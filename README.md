# Betty Bet

Betty Bet is a Discord bot designed to manage bets and games within your server. It offers a variety of commands to place bets, check statistics, organize tournaments, and much more.

## Features

- **/register**: Register to get initial GearPoints and start betting.
- **/points**: Check your current GearPoints and status.
- **/inventory**: Check the GearPoints in your inventory.
- **/claim**: Claim GearPoints from your inventory to add them to your balance.
- **/leaderboard**: Show the leaderboard of top betters.
- **/bethistory**: View your betting history.
- **/stats**: View your detailed statistics.
- **/globalstats**: View global betting statistics.
- **/togglenotifications**: Toggle notifications for inventory GearPoints.
- **/clearmessages**: Clear all private messages sent by the bot.
- **/presentation**: Present Betty Bet and its features.
- **/guess**: Play a guessing game! Guess a number between 1 and 10000. Win 5 GearPoints if you guess correctly, lose 10 GearPoints if you guess wrong.
- **/buyitem**: Buy an item in Betty Bet's shop with your GearPoints.
  - **Options**:
    - `itemname`: Name of item
    - `quantity`: The number of items you want to buy
- **/listitems**: view items for sale in the store.

### Commands reserved for **BetManager** roles:

- **/placeyourbets**: Start a betting period between two players.
  - **Options**:
    - `player1name`: Name of player 1
    - `player2name`: Name of player 2
- **/addpoints**: Add GearPoints to a specific user.
  - **Options**:
    - `user`: User to add GearPoints to
    - `points`: Number of GearPoints to add
- **/clearbets**: Clear all bets in case of issues and refund GearPoints.
- **/win**: Declare the winner and redistribute GearPoints.
  - **Options**:
    - `winner`: The winning player (1 or 2)
- **/betslist**: See the list of bets placed on each player.
- **/deleteuser**: Delete a registered user.
  - **Options**:
    - `userid`: ID of the user to delete
- **/backup**: Encrypt and save data from decrypted backup.
- **/sendbackup**: Send the decrypted backup file.
- **/addtournamentparticipant**: Add a user to the tournament participant list.
  - **Options**:
    - `user`: User to add
- **/removetournamentparticipant**: Remove a user from the tournament participant list.
  - **Options**:
    - `user`: User to remove
- **/listtournamentparticipants**: List all tournament participants.
- **/cleartournamentparticipants**: Clear the list of tournament participants.
- **/transferdebilus**: Transfer all GearPoints from the debilus closet to a specific user and empty the closet.
  - **Options**:
    - `user`: User to transfer the GearPoints to
- **/additem**: Add an item to Betty Bet's shop
  - **Option**:
    - `itemname`: Name of item
    - `quantity`: The number of items you want to add
    - `unitprice`: enter the price of the item per unit
      
## Installation

1. **Install Node.js**:
   Make sure Node.js is installed on your machine. You can download and install it from [nodejs.org](https://nodejs.org/).

2. **Clone this repository** to your local machine.
```sh
   git clone https://github.com/SweetDebilus/betty-bet.git
   cd betty-bet
```
3. Install the required dependencies.
```sh
   npm install
```
4. Configure the environment variables by creating a .env file at the root of the project and adding the following values:
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
```
5. Start the bot.
```sh
   node dist/index.js
```

## Usage

Once the bot is running, invite it to your Discord server and use the commands to start betting and playing. Make sure you have the appropriate roles to use the commands reserved for BetManagers.

*Please note, this bot meets a specific need and certain features are not suitable for everyone.*

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## Conclusion

This README provides a comprehensive overview of Betty Bet, its features, and how to install and use it. If you need more details or additional modifications, let me know!
