import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';
import { Publicacion, PublicacionSchema } from './publicaciones.schema';
import { Usuario, UsuarioSchema } from '../usuarios/usuario.schema'; // 👈 1. Importa el esquema de usuario (ajusta la ruta según dónde esté tu módulo de usuarios)

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Usuario.name, schema: UsuarioSchema }, // 👈 2. Regístralo aquí junto al otro modelo
    ]),
  ],
  controllers: [PublicacionesController],
  providers: [PublicacionesService],
})
export class PublicacionesModule {}