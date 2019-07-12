/** Applies a function on every array element.
 *
 * @param array - The array to apply the function to.
 * @param callbackfn - The function to apply to the array elements.
 * @returns The array produced by the map function.
 */
export function mapAsync<T, U>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<U>,
): Promise<U[]> {
  return Promise.all(array.map(callbackfn));
}

/** Filters the given array with an async function
 *
 * @param array - The array to filter.
 * @param callbackfn - The function to filter the array with.
 */
export async function filterAsync<T>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>,
): Promise<T[]> {
  const filterMap = await mapAsync(array, callbackfn);
  return array.filter((value, index) => filterMap[index]);
}

/** Determines whether the given array contains the given element.
 *
 * @param array - The array to search the element in.
 * @param element - The element to search in the array.
 */
export function contains<T>(array: T[], element: T) {
  for (const item of array) {
    if (item === element) {
      return true;
    }
  }
  return false;
}

export class ObjUtil {
  public static keys(object: any): string[] {
    if (!(object instanceof Object)) {
      return [];
    }

    return Object.keys(object);
  }

  public static getInnerObject(object: any, path?: string[]): any {
    if (!path || path.length === 0) {
      return object;
    }

    let targetObject = object;

    for (const key of path) {
      targetObject = targetObject[key];
    }

    return targetObject;
  }

  public static setInnerObject(object: any, toAdd: any, path: string[]): any {
    return this.setInnerObjectHelper(object, toAdd, path);
  }

  private static setInnerObjectHelper(object: any, toAdd: any, path: string[]): any {
    if (!path || path.length === 0) {
      return toAdd;
    }

    if (path.length === 1) {
      const newObject = object;
      newObject[path[0]] = toAdd;
      return newObject;
    }

    const newPath = path;
    const key = newPath.shift();
    const newObject = object;
    newObject[key] = this.setInnerObjectHelper(newObject[key], toAdd, newPath);

    return newObject;
  }
}
