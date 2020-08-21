import FileManager from './file_manager';

/** The available data files. */
export enum DATA {
  'SUBS',
  'UPDATER',
}

/** The data for one subscribing channel. */
export type Subscriber = {
  /** The names of the games the channel subscribed to. */
  gameSubs: string[];
  /** The channel ID. */
  id: string;
  /** The label of the channel. */
  label?: string;
  /** The prefix the channel uses. */
  prefix?: string;
  /** Disabled subscribers won't receive automatic updates. */
  disabled?: boolean;
};

/** The data for the subscribers. */
export type SubscriberData = {
  [index: string]: Subscriber[];
  /** The discord subs. */
  discord: Subscriber[];
  /** The telegram subs. */
  telegram: Subscriber[];
};

/** The data for the updater. */
export type UpdaterData = {
  /** The time of the last update. */
  lastUpdate: string;
  /** The version string of the last dota patch. */
  lastDotaPatch: string;
  /** Timestamp of the last update cycle run */
  healthcheckTimestamp: string;
};

/** The class managing the data files. */
export default class DataManager {
  /** The base path of the config files. */
  public static basePath = 'data/';
  public static ext = '.json';

  /** The file name of the updater config. */
  private static updaterFileName = 'updater_data';
  private static subscriberFileName = 'subscriber_data';

  /** Gets the name of the given file.
   *
   * @param file - The file to get the name of.
   */
  private static getFileName(file: DATA): string {
    switch (file) {
      case DATA.UPDATER:
        return this.updaterFileName + this.ext;
      case DATA.SUBS:
        return this.subscriberFileName + this.ext;
      default:
        throw Error('Unknown config file.');
    }
  }

  /** Parses the given file to a JSON object.
   *
   * @param file - The file to parse.
   */
  private static parseFile(file: DATA): Record<string, unknown> {
    return FileManager.parseFile(this.basePath, this.getFileName(file));
  }

  /** Writes an object to the given file.
   *
   * @param file - The file to write to.
   * @param object - The object to write to the file.
   */
  private static writeObject(file: DATA, object: Record<string, unknown>): void {
    return FileManager.writeObject(this.basePath, this.getFileName(file), object);
  }

  // Data getters and setters

  /** Gets the subscriber data as an object. */
  public static getSubscriberData(): SubscriberData {
    return this.parseFile(DATA.SUBS) as SubscriberData;
  }

  /** Sets the subscriber data. */
  public static setSubscriberData(data: SubscriberData): void {
    this.writeObject(DATA.SUBS, data);
  }

  /** Gets the updater data as an object. */
  public static getUpdaterData(): UpdaterData {
    return this.parseFile(DATA.UPDATER) as UpdaterData;
  }

  /** Sets the updater data. */
  public static setUpdaterData(data: UpdaterData): void {
    this.writeObject(DATA.UPDATER, data);
  }
}
