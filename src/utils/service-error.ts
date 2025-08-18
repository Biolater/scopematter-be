import { ServiceErrorCode } from "./service-error-codes";

export class ServiceError extends Error {
  public code: ServiceErrorCode;

  constructor(code: ServiceErrorCode, message?: string) {
    super(message || code);
    this.code = code;
  }
}
