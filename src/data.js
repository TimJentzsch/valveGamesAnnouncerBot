const fs = require('fs');

/** @description Reads the content of the specified file.
 *
 * @param {string} path - The file path to the file.
 * @returns {string} The content of the file.
 */
function readFile(path) {
  return fs.readFileSync(path, 'utf8');
}

/** @description Writes the specified content to the specified file.
 *
 * @param {string} path - The file path to the file.
 * @param {string} content - The string to write to the file.
 */
function writeFile(path, content) {
  fs.writeFileSync(path, content);
}

/** @description Returns the JS object representation of the specified JSON file.
 *
 * @param {string} path - The file path to the JSON file.
 */
function readJSON(path) {
  return JSON.parse(readFile(path));
}

/** @description Writes the specified JS object to the specified JSON file.
 *
 * @param {string} path - The path to the JSON file.
 * @param {Object} obj - The JS object to write to the JSON file.
 */
function writeJSON(path, obj) {
  writeFile(path, JSON.stringify(obj, null, 2));
}

/** @description Get the path of important files.
 *
 * @param {string} file - The file to get the path from.
 * @returns {string} The path of the file.
 */
function getFilePath(file) {
  const basePath = 'src/data';

  switch (file) {
    case 'subscribers':
      return `${basePath}/subscribers.json`;
    case 'bot_config':
      return `${basePath}/bot_config.json`;
    case 'data_config':
      return `${basePath}/data_config.json`;
    default:
      throw new SyntaxError('Unexpected file.');
  }
}

/** @description Get the bot_config.json file as a JS object. */
function getBotConfig() {
  return readJSON(getFilePath('bot_config'));
}

/** @description Get the data_conig.json file as a JS object. */
function getDataConfig() {
  return readJSON(getFilePath('data_config'));
}

/** @description Get the name of a game by an alias.
 *
 * @param  {string} alias - The alias to convert to a game name.
 * @returns {string} The name of the game or ''.
 */
function getGameName(alias) {
  const { games } = getDataConfig();
  // Ignore capitalization
  const lowerAlias = alias.trim().toLocaleLowerCase();

  let gameName = '';

  // Iterate through all available games
  games.forEach((game) => {
    // Look for the alias in the game
    if (game.aliases.includes(lowerAlias)) {
      gameName = game.name;
    }
  });

  return gameName;
}

/** @description Get the title of a game.
 *
 * @param  {string} alias - An alias of the game.
 * @returns {string} The title of the game or ''.
 */
function getGameTitle(alias) {
  const gameName = getGameName(alias);
  let { games } = getDataConfig();

  let gameTitle = '';

  // Look for the game name
  games = games.filter(game => (game.name === gameName));

  // Get the title of the game
  if (games) {
    gameTitle = games[0].title;
  }

  return gameTitle;
}

function getSubscribers() {
  return readJSON(getFilePath('subscribers'));
}

/** @description Add a chat to the subscriptions.
 *
 * @param  {number} chatId - The ID of the chat to be subscribed.
 * @param {string} type - The type of the chat.
 * @param {string} client - The name of the client. 'telegram' or 'discord'.
 * @param {string} game - The name of the game to subscribe to. 'dota' or 'artifact'.
 * @returns {boolean} False, if the chat was already subscribed, else true.
 */
function addSubscriber(chatId, type, client, game) {
  const subscribers = getSubscribers();
  const gameSubscribers = subscribers[client][game];

  // Check if the chat is already subscribed
  for (let i = 0; i < gameSubscribers.length; i += 1) {
    if (gameSubscribers[i].id === chatId) {
      return false;
    }
  }

  // Add chat to subscription list
  gameSubscribers.push({ id: chatId, type });
  // Save changes
  subscribers[client][game] = gameSubscribers;
  writeJSON(getFilePath('subscribers'), subscribers);
  return true;
}

/** @description Remove a chat from the subscriptions.
 *
 * @param  {number} chatId - The Id of the chat to be unsubscribed.
 * @param {string} type - The type of the chat.
 * @param {string} client - The name of the client. 'telegram' or 'discord'.
 * @param {string} game - The name of the game to unsubscribe from. 'dota' or 'artifact'.
 * @returns {boolean} False, if the chat wasn't subscribed, else true.
 */
function removeSubscriber(chatId, type, client, game) {
  const subscribers = getSubscribers();
  const gameSubscribers = subscribers[client][game];

  // Check if the chat is already subscribed
  for (let i = 0; i < gameSubscribers.length; i += 1) {
    if (gameSubscribers[i].id === chatId) {
      // Unsubscribe chat
      gameSubscribers.splice(i, 1);
      // Save changes
      writeJSON(getFilePath('subscribers'), subscribers);
      return true;
    }
  }

  // Chat isn't subscribed
  return false;
}

function getSubscribersByGameAndClient(client, alias) {
  const subscribers = getSubscribers();
  return subscribers[client][alias];
}

/** @description Get an array of all game names.
 *
 * @returns {string[]} An array of all game names.
 */
function getAllGameNames() {
  const { games } = getDataConfig();
  const gameNames = [];

  games.forEach((game) => {
    // Add the name of the game to the array
    gameNames.push(game.name);
  });

  return gameNames;
}

/** @description Get an array of all game titles.
 *
 * @returns {string[]} An array of all game titles.
 */
function getAllGameTitles() {
  const { games } = getDataConfig();
  const gameTitles = [];

  games.forEach((game) => {
    // Add the name of the game to the array
    gameTitles.push(game.title);
  });

  return gameTitles;
}

// Export the functions
module.exports = {
  getBotConfig,
  getDataConfig,
  getGameName,
  getAllGameNames,
  getGameTitle,
  getAllGameTitles,
  getFilePath,
  addSubscriber,
  removeSubscriber,
  getSubscribers,
  getSubscribersByGameAndClient,
  writeJSON,
  readJSON,
};