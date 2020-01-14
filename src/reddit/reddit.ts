import Snoowrap from 'snoowrap';
import ConfigManager from '../managers/config_manager';
import Game from '../game';
import Notification from '../notifications/notification';
import NotificationElement from '../notifications/notification_element';
import RedditUserProvider from './reddit_user';
import { sortLimitEnd } from '../util/comparable';
import ProjectManager from '../managers/project_manager';
import Logger from '../logger';

let reddit: Snoowrap;
let isInit: boolean = false;
let isEnabled: boolean = true;

export default class Reddit {
  public static logger = new Logger('Reddit');
  public static init(): void {
    if (isInit) {
      return;
    }
    Reddit.logger.debug('Initializing Reddit API...');
    const redditConfig = ConfigManager.getRedditConfig();
    const { enabled, clientId, clientSecret, refreshToken, userName } = redditConfig;

    if (!enabled) {
      isEnabled = false;
      isInit = true;

      Reddit.logger.debug('Autostart disabled.');
      return;
    }

    // Check for parameters
    const missingParams = [];
    if (!clientId) {
      missingParams.push('clientId');
    }
    if (!clientSecret) {
      missingParams.push('clientSecret');
    }
    if (!refreshToken) {
      missingParams.push('refreshToken');
    }
    if (!userName) {
      missingParams.push('userName');
    }
    if (missingParams.length > 0) {
      Reddit.logger.warn(
        `Missing parameters in 'api_config.json': ${missingParams.join(', ')}` +
          `\n  Disabling reddit updates.`,
      );
      isEnabled = false;
      isInit = true;
      return;
    }

    const userAgent =
      `discord/telegram(${ProjectManager.getEnvironment()}):` +
      `${ProjectManager.getIdentifier()}:v${ProjectManager.getVersionNumber()}` +
      ` (by /u/${userName})`;

    reddit = new Snoowrap({
      clientId,
      clientSecret,
      refreshToken,
      userAgent,
    });
    Reddit.logger.info(`Initialization successful with userAgent '${userAgent}'.`);
    isInit = true;
  }

  public static async getNotifications(
    subreddit: string,
    users: RedditUserProvider[],
    urlFilters: string[],
    game: Game,
    date?: Date,
    limit?: number,
  ): Promise<Notification[]> {
    let notifications: Notification[] = [];

    if (!isInit || !isEnabled) {
      return notifications;
    }

    for (const user of users) {
      // Get all new submissions in the given subreddit
      try {
        Reddit.logger.debug(`Getting posts from /u/${user.name} on /r/${subreddit}...`);
        const allPosts = await reddit.getUser(user.name).getSubmissions();
        const posts = allPosts.filter((submission) =>
          this.isValidSubmission(submission, subreddit, user, date, urlFilters),
        );

        for (const post of posts) {
          // Convert the post into a notification
          const notification = new Notification(new Date(post.created_utc * 1000))
            .withTitle(post.title, post.url)
            .withContent(this.mdFromReddit(post.selftext))
            .withAuthor(
              `/u/${user.name}`,
              `https://www.reddit.com/user/${user.name}`,
              'https://www.redditstatic.com/new-icon.png',
            )
            .withGameDefaults(game);
          notifications.push(notification);
        }
      } catch (error) {
        Reddit.logger.error(`Failed to get notification from Reddit:\n${error}`);
      }
    }

    // Limit the length
    notifications = sortLimitEnd(notifications, limit);

    return notifications;
  }

  /** Determines if the submission is valid. */
  private static isValidSubmission(
    submission: Snoowrap.Submission,
    subreddit: string,
    user: RedditUserProvider,
    date: Date,
    urlFilters: string[],
  ) {
    return (
      this.isNew(submission, date) &&
      this.isCorrectSub(submission, subreddit) &&
      this.isValidTitle(submission, user) &&
      this.isNewSource(submission, urlFilters) &&
      !this.isDeleted(submission)
    );
  }

  /** Checks if the url is already covered by other providers. */
  private static isNewSource(submission: Snoowrap.Submission, urlFilters: string[]): boolean {
    let isNewSource = true;
    for (const filter of urlFilters) {
      const alreadyCovered = new RegExp(filter).test(submission.url);
      if (alreadyCovered) {
        isNewSource = false;
      }
    }
    return isNewSource;
  }

  /** Checks the title to determine if the post is an update. */
  private static isValidTitle(submission: Snoowrap.Submission, user: RedditUserProvider): boolean {
    return user.titleFilter.test(submission.title);
  }

  /** Checks if the submission is new. */
  private static isNew(submission: Snoowrap.Submission, date: Date): boolean {
    const timestamp = new Date(submission.created_utc * 1000);
    return timestamp > date;
  }

  /** Checks if the subreddit is correct. */
  private static isCorrectSub(submission: Snoowrap.Submission, subreddit: string): boolean {
    return submission.subreddit_name_prefixed === `r/${subreddit}`;
  }

  /** Checks if the post has been deleted. */
  private static isDeleted(submission: Snoowrap.Submission): boolean {
    return /^\[removed\]$/.test(submission.selftext);
  }

  private static mdFromReddit(text: string): string {
    let fulltext = '';
    // User links
    fulltext = text.replace(/\/u\/([a-zA-Z0-9]+)/, '[/u/$1](https://reddit.com/user/$1)');
    // Subreddit links
    fulltext = text.replace(/\/r\/([a-zA-Z0-9]+)/, '[/r/$1](https://reddit.com/r/$1)');

    return text;
  }
}
