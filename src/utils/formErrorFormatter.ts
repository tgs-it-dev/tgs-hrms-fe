type ValidationError = {
  field: string;
  message: string | string[];
};

export const formatValidationErrors = (
  errors: ValidationError[]
): Record<string, string> => {
  return errors.reduce(
    (acc, error) => {
      const firstMessage = Array.isArray(error.message)
        ? error.message[0]
        : error.message;

      acc[error.field] = firstMessage ?? '';

      return acc;
    },
    {} as Record<string, string>
  );
};
