import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario } from '../usuarios/usuario.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    JwtModule.register({
      global: true,
      secret: 'TU_CLAVE_SECRETA_SUPER_SEGURA', // Debe coincidir con la del AuthGuard
      signOptions: { expiresIn: '15m' }, // 👈 Los 15 minutos exigidos por la cátedra
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
