import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { IUsersRepository } from "../interfaces/users-repository.interface";
import { USERS_REPOSITORY_TOKEN } from "../constants/users.constants";
import { User } from "@fortifykitchen/types";

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }
}
