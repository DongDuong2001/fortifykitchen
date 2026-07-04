import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from root first
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { ConfigService } from "./config/config.service";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { winstonLoggerInstance } from "./common/logger/winston.logger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLoggerInstance,
  });

  const configService = app.get(ConfigService);

  // Security Middlewares
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: true, // In production, replace with specific domains
    credentials: true,
  });

  // Global Pipelines & Filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle("FortifyKitchen REST API")
    .setDescription(
      "Enterprise Backend REST API for Food Ordering & Subscription System",
    )
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = configService.get("PORT");
  await app.listen(port);
  winstonLoggerInstance.log(
    `🚀 Application is running on: http://localhost:${port}/docs`,
    "Bootstrap",
  );
}

bootstrap();
