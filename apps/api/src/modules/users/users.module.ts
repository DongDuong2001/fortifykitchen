import { Module } from "@nestjs/common";
import { UsersController } from "./controller/users.controller";
import { UsersService } from "./service/users.service";
import { UsersRepository } from "./repository/users.repository";
import { USERS_REPOSITORY_TOKEN } from "./constants/users.constants";

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY_TOKEN,
      useClass: UsersRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
