type NestJSErrors = Record<string, string[]>;
type StandardErrors = Array<{ field: string; message: string | string[] }>;

/**
 * Type guard to check if the error is of StandardErrors shape.
 */
export const isStandardErrors = (errors: unknown): errors is StandardErrors => {
  if (!Array.isArray(errors)) return false;
  return errors.every(e => {
    if (e === null || typeof e !== 'object') return false;
    const obj = e as Record<string, unknown>;
    return (
      'field' in obj &&
      typeof obj.field === 'string' &&
      'message' in obj &&
      (typeof obj.message === 'string' ||
        (Array.isArray(obj.message) &&
          obj.message.every((m: unknown) => typeof m === 'string')))
    );
  });
};

/**
 * Type guard to check if the error is of NestJSErrors shape.
 */
export const isNestJSErrors = (errors: unknown): errors is NestJSErrors => {
  if (errors === null || typeof errors !== 'object' || Array.isArray(errors)) {
    return false;
  }
  const obj = errors as Record<string, unknown>;
  return (
    Object.keys(obj).length > 0 &&
    Object.values(obj).every(
      v => Array.isArray(v) && v.every((m: unknown) => typeof m === 'string')
    )
  );
};

export const formatValidationErrors = (
  errors: NestJSErrors | StandardErrors | undefined | null
): Record<string, string> => {
  if (!errors) return {};

  if (isStandardErrors(errors)) {
    return errors.reduce(
      (acc, e) => {
        acc[e.field] = Array.isArray(e.message)
          ? (e.message[0] ?? '')
          : e.message;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  if (isNestJSErrors(errors)) {
    return Object.fromEntries(
      Object.entries(errors).map(([k, v]) => [k, v[0] ?? ''])
    );
  }

  // Safe fallback for Record<string, string> or other object shapes
  // if (typeof errors === 'object' && !Array.isArray(errors)) {
  //   const obj = errors as Record<string, unknown>;
  //   const fallbackEntries = Object.entries(obj).map(([k, v]) => {
  //     if (typeof v === 'string') {
  //       return [k, v];
  //     }
  //     if (Array.isArray(v) && typeof v[0] === 'string') {
  //       return [k, v[0]];
  //     }
  //     return [k, ''];
  //   });
  //   return Object.fromEntries(fallbackEntries);
  // }
  console.error('Unknown validation error format:', errors);

  return {};
};
