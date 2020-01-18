import EscapeRegex from 'escape-string-regexp';
import BotClient from '../bots/bot';
import User, { UserPermission } from '../user';
import Channel from '../channel';
import Message from '../message';

export default class Command {
  /** The label of the command. */
  public label: string;
  /** The description of the command. */
  public description: string;
  /** The label of the command trigger. Displayed in the help-command. */
  public triggerLabel: string;
  /** The RegExp string triggering the command. */
  public trigger: string;
  /** The callback function executing the command. */
  public callback: (bot: BotClient, message: Message, match: RegExpMatchArray) => void;
  /** Whether the command should use the bot prefix. */
  public hasPrefix: boolean;
  /** The permission required to execute the command. */
  public permission: UserPermission;

  /** Create a new command.
   *
   * @param {string} label - The label of the command.
   * @param {string} description - The description of the command.
   * @param {string} triggerLabel - The label of the command trigger. Displayed in the help-command.
   * @param {string} trigger - The RegExp string triggering the command.
   * @param {Function} callback - The callback function executing the command.
   * @param {UserPermission} permission - The permission required to execute the command.
   * @param {boolean} hasPrefix - Whether the command should use the bot prefix. Default is true.
   */
  constructor(
    label: string,
    description: string,
    triggerLabel: string,
    trigger: string,
    callback: (bot: BotClient, message: Message, match: RegExpMatchArray) => void,
    permission?: UserPermission,
    hasPrefix?: boolean,
  ) {
    this.label = label;
    this.description = description;
    this.triggerLabel = triggerLabel;
    this.trigger = trigger;
    this.callback = callback;
    this.permission = permission != null ? permission : UserPermission.USER;
    this.hasPrefix = hasPrefix != null ? hasPrefix : true;
  }
  /** Tries to execute the command on the given channel.
   *
   * @param bot - The BotClient to execute the command on.
   * @param channel - The channel to execute the command on.
   * @param user - The user trying to execute the command.
   * @param match - The RegExp match of the command trigger.
   */
  public async execute(
    bot: BotClient,
    message: Message,
    match: RegExpMatchArray,
  ): Promise<boolean> {
    // Check if the user has the required permission to execute the command.
    if (await message.user.hasPermission(message.channel, this.permission)) {
      this.callback(bot, message, match);
      const time = Date.now() - message.timestamp.valueOf();
      bot.logger.debug(`Command '${this.label}' executed in ${time} ms.`);
      return true;
    }
    bot.logger.debug(`Command: ${this.label}: Insufficient permissions.`);
    bot.sendMessage(
      message.channel,
      `You need the permission '${this.permission}' on this server to execute this command!`,
    );
    return false;
  }

  /** Gets the RegExp used to trigger the command
   *
   * @param client - The BotChannel to trigger the command on.
   */
  public async getRegExp(channel: Channel) {
    const bot = channel.client;
    const userTag = EscapeRegex(await bot.getUserTag());
    const channelPrefix = EscapeRegex(channel.getPrefix());
    const prefix = this.hasPrefix
      ? `^\\s*((${userTag})|((${channelPrefix})(\\s*${userTag})?)|((${bot.prefix})\\s*(${userTag})))\\s*`
      : '';

    const regexString = prefix + this.trigger;
    return new RegExp(regexString);
  }

  /** Gets the complete trigger label in the given channel, e.g. '/subscribe'
   *
   * @param channel - The channel to get the trigger label in.
   * @returns The complete trigger label, e.g. '/subscribe'
   */
  public getTriggerLabel(channel: Channel): string {
    const prefixString = this.hasPrefix ? channel.getPrefix() : '';
    return prefixString + this.triggerLabel;
  }
}
