import { ZodError } from "zod";
import { ErrorDetail } from "./response";

export function formatZodError(error: ZodError): ErrorDetail[] {
  return error.issues.map(issue => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}
