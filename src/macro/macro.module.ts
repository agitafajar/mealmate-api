import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserProfile } from "../entities/user-profile.entity";
import { MacroController } from "./macro.controller";
import { MacroService } from "./macro.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile])],
  controllers: [MacroController],
  providers: [MacroService],
  exports: [MacroService],
})
export class MacroModule {}
