import bots from './bots';
import { commands } from './command';
import botLogger from './logger';
import updater from './updater';

/** Registers the bot commands. */
async function registerCommands() {
  for (const command of commands) {
    for (const bot of bots) {
      bot.registerCommand(command);
    }
    botLogger.debug(`Registered command: '${command.label}'.`, 'Main');
  }
  botLogger.info('Registered commands.', 'Main');
}

/** Starts the bots. */
async function startBots() {
  // Start bots
  for (const bot of bots) {
    if (bot.autostart) {
      if (bot.start()) {
        const userName = await bot.getUserName();
        bot.logInfo(`Started bot as @${userName}`);
      } else {
        bot.logWarn('Bot did not start. Did you provide a token in "bot_config.json"?');
      }
    } else {
      bot.logDebug('Autostart disabled.');
    }
  }
}

/** Starts the updater. */
async function startUpdater() {
  if (updater.autostart) {
    updater.start();
    updater.info('Started updater.');
  }
}

/** Registers the commands, starts the bots and the updater. */
async function start() {
  await registerCommands();
  await startBots();
  await startUpdater();
}

start();
