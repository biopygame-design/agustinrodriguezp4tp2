import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Usuario extends Document {
  @Prop({ required: true })
  nombre: string;

  @Prop()
  apellido: string; // 👈 Agregado para el apellido

  @Prop({ required: true, unique: true })
  correo: string;

  @Prop({ required: true, unique: true })
  nombre_usuario: string; // 👈 Agregado para el @nombre_usuario

  @Prop({ required: true })
  contrasena: string;

  @Prop()
  fecha_nacimiento: string; // 👈 O fechaNacimiento (ajústalo según cómo lo guardes en el DTO)

  @Prop()
  descripcion_breve: string; // 👈 ¡ESTE ES EL QUE FALTABA para el "Acerca de mí"!

  @Prop()
  imagenPerfil: string;
  
  @Prop({ default: 'usuario' }) // 👈 Agregado para controlar los permisos de admin
  rol: string;
}



export const UsuarioSchema = SchemaFactory.createForClass(Usuario);