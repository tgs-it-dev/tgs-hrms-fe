type NestJSErrors = Record<string, string[]>;
type StandardErrors = Array<{ field: string; message: string | string[] }>;

export const formatValidationErrors = (
  errors: NestJSErrors | StandardErrors | undefined | null
): Record<string, string> => {
  if (!errors) return {};
  if (Array.isArray(errors)) {
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
  return Object.fromEntries(
    Object.entries(errors).map(([k, v]) => [k, v[0] ?? ''])
  );
};
