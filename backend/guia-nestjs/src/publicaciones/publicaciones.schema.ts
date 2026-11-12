import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true }) // Crea automáticamente createdAt y updatedAt
export class Publicacion extends Document {
  @Prop({ required: true })
  titulo: string;

  @Prop({ required: true })
  descripcion: string;

  @Prop()
  imagen_publicacion: string; // URL o ruta de la imagen del posteo

  // Vinculación con el esquema de Usuario que ya creaste
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuario: Types.ObjectId | string;

  // Arreglo con los IDs de los usuarios que le dieron "me gusta"
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Usuario' }], default: [] })
  me_gusta: Types.ObjectId[];

  // Baja lógica requerida por la cátedra (true = activo, false = eliminado lógicamente)
  @Prop({ default: true })
  activo: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);