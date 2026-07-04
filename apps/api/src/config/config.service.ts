import { Injectable } from "@nestjs/common";
import { validateBackendEnv } from "@fortifykitchen/config";

@Injectable()
export class ConfigService {
  private readonly envConfig: ReturnType<typeof validateBackendEnv>;

  constructor() {
    // Validate environments on startup
    this.envConfig = validateBackendEnv(process.env);
  }

  get<K extends keyof ReturnType<typeof validateBackendEnv>>(
    key: K,
  ): ReturnType<typeof validateBackendEnv>[K] {
    return this.envConfig[key];
  }

  get isProduction(): boolean {
    return this.envConfig.NODE_ENV === "production";
  }

  get isDevelopment(): boolean {
    return this.envConfig.NODE_ENV === "development";
  }
}
