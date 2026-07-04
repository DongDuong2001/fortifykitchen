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
      this.logger.error("Unhandled Exception Occurred:", exception);
      if (exception instanceof Error) {
        message = exception.message;
      }
    }

    response.status(status).json({
      success: false,
      message,
      errors,
    });
  }
}
