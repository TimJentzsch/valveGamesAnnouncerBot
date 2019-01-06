import Winston from 'winston';
import { BotChannel } from './channel';
import { getSubscribers, setSubscribers } from './data';
import { Game } from './game';
import { BotNotification } from './notification';

abstract class BotClient {
  /** The internal name of the bot. */
  public name: string;
  /** The human-readable label of the bot. */
  public label: string;
  /** The prefix to use for commands. */
  public prefix: string;

  /** The logger used for the bot. */
  private logger: Winston.Logger;

  /** Creates a new BotClient.
   *
   * @param  {string} name - The internal name of the bot.
   * @param  {string} label - The human-readable label of the bot.
   * @param  {string} prefix - The prefix to use for commands.
   */
  constructor(name: string, label: string, prefix: string) {
    this.name = name;
    this.label = label;
    this.prefix = prefix;

    // Create logger
    const loggerFormat = Winston.format.printf((log) => {
      return `${log.timestamp} [${this.label}] ${log.level.toUpperCase()}: \t${log.message}`;
    });

    const alignedWithColorsAndTime = Winston.format.combine(
      Winston.format.colorize(),
      Winston.format.timestamp(),
      Winston.format.printf((info) => {
        const { timestamp, level, message, ...args } = info;

        const ts = timestamp.slice(0, 19).replace('T', ' ');
        const obj = Object.keys(args).length ? JSON.stringify(args, null, 2) : '';
        return `${ts} [${this.label}]\t ${level}:\t ${message} ${obj}`;
      }),
    );

    this.logger = Winston.createLogger({
      format: alignedWithColorsAndTime,
      level: 'debug',
      transports: [new Winston.transports.Console()],
    });
  }

  /** Register a bot command.
   *
   * @param  {RegExp} reg - The regular expression triggering the command.
   * @param  {(channel:BotChannel,match:RegExpMatchArray)=>void} callback - The function handling the command.
   * @returns void
   */
  public abstract registerCommand(reg: RegExp, callback: (channel: BotChannel, match: RegExpMatchArray) => void): void;
  /** Start the bot.
   *
   * @returns True, if the start was successful, else false.
   */
  public abstract async start(): Promise<boolean>;
  /** Stop the bot.
   *
   * @returns void
   */
  public abstract stop(): void;

  /** Add a channel supscription to a game.
   *
   * @param  {BotChannel} channel - The channel to subscribe to the game.
   * @param  {Game} game - The game to subscribe to.
   * @returns True, if the subscription was successful, else false.
   */
  public addSubscriber(channel: BotChannel, game: Game): boolean {
    const subscribers = getSubscribers();
    const gameSubs = subscribers[this.name][game.name];

    // Check if channel is already subscribed to this client
    for (const sub of gameSubs) {
      if (channel.isEqual(sub)) {
        return false;
      }
    }

    // Save changes
    gameSubs.push(channel.toJSON());
    subscribers[this.name][game.name] = gameSubs;
    setSubscribers(subscribers);

    return true;
  }

  /** Remove a channel subscription from a game.
   *
   * @param  {BotChannel} channel - The channel to unsubscribe from the game.
   * @param  {Game} game - The game to unsubscribe from.
   * @returns True, if the unsubscription was successful, else false.
   */
  public removeSubscriber(channel: BotChannel, game: Game): boolean {
    const subscribers = getSubscribers();
    const gameSubs: string[] = subscribers[this.name][game.name];

    // Check if channel is already subscribed to this client
    let hasSubbed = false;
    for (let i = 0; i < gameSubs.length; i++) {
      if (channel.isEqual(gameSubs[i])) {
        gameSubs.splice(i, 1);
        this.logDebug(`Index ${i}, Subs: ${gameSubs}`);
        hasSubbed = true;
        break;
      }
    }

    if (!hasSubbed) {
      return false;
    }

    // Save changes
    subscribers[this.name][game.name] = gameSubs;
    setSubscribers(subscribers);

    return true;
  }

  /** Sends a message to a channel.
   *
   * @param  {BotChannel} channel - The channel to message.
   * @param  {string|BotNotification} message - The message to send to the channel.
   * @returns void
   */
  public abstract sendMessageToChannel(channel: BotChannel, message: string | BotNotification): boolean;

  /** Sends a message to all subscribers of a game.
   *
   * @param  {Game} game - The game to notify the subscribers of.
   * @param  {string|BotNotification} message - The message to send to the subscribers.
   * @returns void
   */
  public sendMessageToGameSubs(game: Game, message: string | BotNotification): void {
    // TODO: Implement
  }

  /** Sends a message to all subscribers.
   *
   * @param  {string|BotNotification} message - The message to send to the subscribers.
   * @returns void
   */
  public sendMessageToAllSubs(message: string | BotNotification): void {
    // TODO: Implement
  }

  /** Logs a debug message.
   *
   * @param  {string} msg - The message to debug-log.
   * @returns void
   */
  public logDebug(msg: string): void {
    this.logger.debug(msg);
  }

  /** Logs an info message.
   *
   * @param  {string} msg - The message to info-log.
   * @returns void
   */
  public logInfo(msg: string): void {
    this.logger.info(msg);
  }

  /** Logs a warning message.
   *
   * @param  {string} msg - The message to warn-log.
   * @returns void
   */
  public logWarn(msg: string): void {
    this.logger.warn(msg);
  }

  /** Logs an error message.
   *
   * @param  {string} msg - The message to error-log.
   * @returns void
   */
  public logError(msg: string): void {
    this.logger.error(msg);
  }
}

export { BotClient };