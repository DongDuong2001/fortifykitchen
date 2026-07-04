import { User, UserRole } from "@fortifykitchen/types";

export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<User>;
}
