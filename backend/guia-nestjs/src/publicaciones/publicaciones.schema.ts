import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// 1. Definimos la estructura del Subdocumento de Comentario
@Schema({ timestamps: true })
export class ComentarioSubdocumento {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuario: Types.ObjectId;

  @Prop({ required: true })
  texto: string;

  @Prop({ default: false })
  editado: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(ComentarioSubdocumento);

// 2. Esquema principal de la Publicación
@Schema({ timestamps: true }) // Crea automáticamente createdAt y updatedAt
export class Publicacion extends Document {
  @Prop({ required: true })
  titulo: string;

  @Prop({ required: true })
  descripcion: string;

  @Prop()
  imagen_publicacion: string; // Nombre o ruta de la imagen del posteo

  // Vinculación con el esquema de Usuario
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuario: Types.ObjectId | string;

  // Arreglo con los IDs de los usuarios que le dieron "me gusta"
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Usuario' }], default: [] })
  me_gusta: Types.ObjectId[];

  // Baja lógica requerida por la cátedra (true = activo, false = eliminado lógicamente)
  @Prop({ default: true })
  activo: boolean;

  // 👇 Array con los comentarios estructurados como subdocumentos
  @Prop({ type: [ComentarioSchema], default: [] })
  comentarios: ComentarioSubdocumento[];
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);