type ValidationError = {
  field: string;
  message: string | string[];
};

export const formatValidationErrors = (
  errors: ValidationError[]
): Record<string, string> => {
  return errors.reduce(
    (acc, error) => {
      acc[error.field] = error.message;
      return acc;
    },
    {} as Record<string, string>
  );
};
