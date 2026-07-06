import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = "Internal Server Error";
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      const resContent = exception.getResponse();
      if (typeof resContent === "string") {
        message = resContent;
      } else if (typeof resContent === "object" && resContent !== null) {
        const obj = resContent as Record<string, any>;
        message = obj.message || message;
        if (Array.isArray(obj.message)) {
          errors = obj.message;
          message = "Validation failed";
        }
      }
    } else {
      // Not every thrown value is an Error instance — the Cloudinary SDK in
      // particular sometimes rejects with a plain object (e.g. {message,
      // http_code}). String(exception) on those just prints the useless
      // "[object Object]", so fall back to JSON.stringify to actually see
      // what's in it.
      const detail =
        exception instanceof Error
          ? exception.stack
          : (() => {
              try {
                return JSON.stringify(exception);
              } catch {
                return String(exception);
              }
            })();
      this.logger.error(`Unhandled Exception Occurred: ${detail}`);
      if (exception instanceof Error) {
        message = exception.message;
      } else if (exception && typeof exception === "object" && typeof (exception as any).message === "string") {
        message = (exception as any).message;
      }
    }

    response.status(status).json({
      success: false,
      message,
      errors,
    });
  }
}
