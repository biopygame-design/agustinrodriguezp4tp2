import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './usuarios/usuarios.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesModule } from './publicaciones/publicaciones.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://brolyagustin_db_user:npAEbx0tziW7aY9T@cluster0.38azqvj.mongodb.net/redsocial?retryWrites=true&w=majority'),
    UsuariosModule,
    PublicacionesModule // Se importa una sola vez y él ya trae su propio controlador y servicio
  ],
  controllers: [AppController], // Solo dejamos el controlador raíz por defecto
  providers: [AppService],       // Solo dejamos el servicio raíz por defecto
})
export class AppModule {}