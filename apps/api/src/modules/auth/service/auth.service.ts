import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { SignupDto } from "../dto/signup.dto";
import { LoginDto } from "../dto/login.dto";
import { AuthResponseDto } from "../dto/auth-response.dto";
import * as argon2 from "argon2";
import { UserRole } from "@fortifykitchen/types";

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const existingUser = await this.db.client.user.findUnique({
      where: { email: signupDto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await argon2.hash(signupDto.password);

    // Create User and Customer profile atomically in a transaction
    const user = await this.db.client.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: signupDto.email,
          firstName: signupDto.firstName,
          lastName: signupDto.lastName,
          passwordHash,
          role: "CUSTOMER" as UserRole,
          isActive: true,
        },
      });

      await tx.customer.create({
        data: {
          userId: newUser.id,
          phone: signupDto.phone,
          address: signupDto.address,
          city: signupDto.city,
          postalCode: signupDto.postalCode,
        },
      });

      return newUser;
    });

    const accessToken = this.generateToken(user.id, user.email, user.role as UserRole);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.db.client.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const accessToken = this.generateToken(user.id, user.email, user.role as UserRole);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  private generateToken(id: string, email: string, role: UserRole): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
    const payload = Buffer.from(
      JSON.stringify({
        id,
        email,
        role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days expiration
      }),
    ).toString("base64");
    const signature = Buffer.from("dummy-signature").toString("base64");
    return `${header}.${payload}.${signature}`;
  }
}
