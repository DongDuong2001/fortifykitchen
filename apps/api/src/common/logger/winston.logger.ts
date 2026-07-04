import { WinstonModule } from "nest-winston";
import * as winston from "winston";

export const winstonLoggerInstance = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        process.env.NODE_ENV === "production"
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, context, ms }) => {
                return `[Nest] - ${timestamp} ${level} [${context || "System"}] ${message} ${ms}`;
              }),
            ),
      ),
    }),
  ],
});
