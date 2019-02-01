import DiscordAPI, { DMChannel, GroupDMChannel, TextBasedChannel, TextChannel } from 'discord.js';
import { BotClient } from './bot';
import BotChannel from './channel';
import { getBotConfig } from './data';
import BotNotification from './notification';

export default class DiscordBot extends BotClient {
  private bot: DiscordAPI.Client;
  private token: string;

  constructor(prefix: string, token: string) {
    super('discord', 'Discord', prefix);

    // Set up the bot
    this.token = token;
    this.bot = new DiscordAPI.Client();
  }

  public registerCommand(reg: RegExp, callback: (channel: BotChannel, match: RegExpExecArray) => void): void {
    this.bot.on('message', (message) => {
      // Run regex on the msg
      const regMatch = reg.exec(message.toString());
      // If the regex matched, execute the handler function
      if (regMatch) {
        callback(new BotChannel(message.channel.id), regMatch);
      }
    });
  }
  public async start(): Promise<boolean> {
    if (this.token) {
      this.bot.login(this.token);
      this.isRunning = true;
      return true;
    } else {
      return false;
    }
  }
  public stop(): void {
    this.bot.destroy();
    this.isRunning = false;
  }
  public sendMessageToChannel(channel: BotChannel, message: string | BotNotification): boolean {
    if (typeof message === 'string') {
      // Parse markdown
      message = this.msgFromMarkdown(message, false);
      const botChannels = this.bot.channels;
      const discordChannel = botChannels.get(channel.id);

      if (!discordChannel) {
        return false;
      }

      // Cast to the specific channel and send the message
      if (discordChannel instanceof DMChannel) {
        discordChannel.send(message);
        return true;
      } else if (discordChannel instanceof TextChannel) {
        discordChannel.send(message);
        return true;
      } else if (discordChannel instanceof GroupDMChannel) {
        discordChannel.send(message);
        return true;
      } else {
        return false;
      }
    } else {
      // Parse markdown
      const text = `${this.msgFromMarkdown(message.text, false)}\n${message.link}`;
      const embed = this.embedFromNotification(message);

      const botChannels = this.bot.channels;
      const discordChannel = botChannels.get(channel.id);

      if (!discordChannel) {
        return false;
      }

      // Cast to the specific channel and send the message
      if (discordChannel instanceof DMChannel) {
        discordChannel.send({ embed });
        return true;
      } else if (discordChannel instanceof TextChannel) {
        discordChannel.send({ embed });
        return true;
      } else if (discordChannel instanceof GroupDMChannel) {
        discordChannel.send({ embed });
        return true;
      } else {
        return false;
      }
    }
  }
  public embedFromNotification(notification: BotNotification): DiscordAPI.RichEmbed {
    const embed = new DiscordAPI.RichEmbed();
    if (notification.title) {
      embed.setTitle(notification.title);
    }
    if (notification.author) {
      embed.setAuthor(notification.author);
    }
    if (notification.color) {
      embed.setColor(notification.color);
    }
    if (notification.description) {
      embed.setDescription(notification.description);
    }
    if (notification.footer) {
      embed.setFooter(notification.footer);
    }
    if (notification.image) {
      embed.setImage(notification.image);
    }
    if (notification.thumbnail) {
      embed.setThumbnail(notification.thumbnail);
    }
    if (notification.timestamp) {
      embed.setTimestamp(notification.timestamp);
    }
    if (notification.link) {
      embed.setURL(notification.link);
    }
    return embed;
  }

  public msgFromMarkdown(markdown: string, isEmbed: boolean): string {
    if (!isEmbed) {
      // Short links are not supported outside of embeds
      markdown = markdown.replace(/\[(.*)\]\((.*)\)/, '$1 ($2)');
    }

    // Linewise formatting
    const lineArray = markdown.split('\n');
    for (let i = 0; i < lineArray.length; i++) {
      // Lists
      lineArray[i] = lineArray[i].replace(/^\s*\*\s+/, '- ');
    }

    let newMarkdown = '';
    for (const line of lineArray) {
      newMarkdown += line + '\n';
    }

    return newMarkdown;
  }
}

// Discord Bot
const { prefix: discordPrefix, token: discordToken } = getBotConfig().discord;
const discordBot = new DiscordBot(discordPrefix, discordToken);

export { DiscordBot, discordBot };