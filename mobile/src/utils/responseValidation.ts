/**
 * DBC Mobile Response Shape Validation Utility.
 * Validates critical backend response objects before consuming them in domain services.
 * Rejects malformed payload structures with a controlled MobileApiError instead of crashing or generating fake data.
 */

export class ResponseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResponseValidationError';
  }
}

export function validateObjectShape<T extends object>(
  data: unknown,
  requiredKeys: (keyof T)[],
  entityName: string
): T {
  if (data == null || typeof data !== 'object') {
    throw new ResponseValidationError(`Invalid backend payload for ${entityName}: expected an object.`);
  }

  const obj = data as Record<string, any>;
  for (const key of requiredKeys) {
    if (obj[String(key)] === undefined) {
      throw new ResponseValidationError(
        `Invalid backend payload for ${entityName}: missing required property '${String(key)}'.`
      );
    }
  }

  return data as T;
}

export function validateArrayShape<T extends object>(
  data: unknown,
  requiredItemKeys: (keyof T)[],
  entityName: string
): T[] {
  if (!Array.isArray(data)) {
    throw new ResponseValidationError(`Invalid backend payload for ${entityName}: expected an array.`);
  }

  return data.map((item, index) => {
    try {
      return validateObjectShape<T>(item, requiredItemKeys, `${entityName}[${index}]`);
    } catch (err) {
      throw new ResponseValidationError(`Invalid item at index ${index} in ${entityName} list.`);
    }
  });
}
