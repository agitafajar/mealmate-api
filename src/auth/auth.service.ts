import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { UserEntity } from "../entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private jwt: JwtService
  ) {}

  async register(email: string, password: string, fullName: string) {
    const exists = await this.userRepo.findOne({ where: { email } });
    if (exists) throw new UnauthorizedException("Email sudah terdaftar");

    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, passwordHash: hash, fullName });
    await this.userRepo.save(user);

    return this.signToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException("Email atau password salah");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Email atau password salah");

    return this.signToken(user);
  }

  private signToken(user: UserEntity) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
      },
    };
  }
}
