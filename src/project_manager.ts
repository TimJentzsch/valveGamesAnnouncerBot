import FileManager from './file_manager';

export type project_info = {
  name: string,
  version: string,
  description: string,
  author: string,
  license: string,
  homepage: string,
};

export default class ProjectManager {
  public static fileName = 'package.json';

  /** Gets the info about this project. */
  public static getProjectInfo(): project_info {
    return FileManager.parseFile('', this.fileName);
  }

  /** Gets the version number of this project. */
  public static getVersionNumber(): string {
    return this.getProjectInfo().version;
  }

  /** Gets the URL of this project. */
  public static getURL(): string {
    return this.getProjectInfo().homepage;
  }

  /** Gets the identifier of this project. */
  public static getIdentifier(): string {
    // Remove https prefix
    return this.getURL().replace(/^https:\/\//, '');
  }

  /** Gets the environment the bot is running in (prod/dev). */
  public static getEnvironment(): string {
    return process.env.NODE_ENV || 'dev';
  }
}
