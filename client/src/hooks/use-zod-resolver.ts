import { useCallback } from "react";
import { z } from "zod";

function useZodResolver<IValidationSchema>(validationSchema: z.ZodType) {
  return useCallback(
    async (data: IValidationSchema) => {
      try {
        const values = validationSchema.parse(data) as IValidationSchema;
        return {
          values,
          errors: {},
        };
      } catch (errors) {
        return {
          values: {},
          errors:
            errors instanceof z.ZodError
              ? errors.issues.reduce(
                  (allErrors, currentError) => ({
                    ...allErrors,
                    [currentError.path.toString()]: {
                      type: currentError.code ?? "validation",
                      message: currentError.message,
                    },
                  }),
                  {}
                )
              : {},
        };
      }
    },
    [validationSchema]
  );
}

export { useZodResolver };
