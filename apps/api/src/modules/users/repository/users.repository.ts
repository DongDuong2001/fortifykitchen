import { Injectable } from "@nestjs/common";
import { IUsersRepository } from "../interfaces/users-repository.interface";
import { DatabaseService } from "../../../database/database.service";
import { User, UserRole } from "@fortifykitchen/types";

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.db.client.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db.client.user.findUnique({ where: { email } });
    if (!user) return null;
    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  async create(data: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<User> {
    const user = await this.db.client.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash: data.passwordHash,
        role: data.role,
      },
    });
    return {
      ...user,
      role: user.role as UserRole,
    };
  }
}
