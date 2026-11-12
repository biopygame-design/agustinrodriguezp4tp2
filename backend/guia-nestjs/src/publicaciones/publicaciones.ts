export interface Publicacion {
  id: string;
  contenido: string;
  autor: string;
}

export type CrearPublicacionDto = Omit<Publicacion, 'id'>;
export type ActualizarPublicacionDto = Partial<CrearPublicacionDto>;