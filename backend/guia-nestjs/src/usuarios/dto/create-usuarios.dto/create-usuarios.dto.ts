import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, Matches, IsIn } from 'class-validator';

export class CreateUsuariosDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  nombre: string;

  @IsString({ message: 'El apellido debe ser un texto' })
  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  apellido: string;

  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  correo: string;

  @IsString({ message: 'El nombre de usuario debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  nombre_usuario: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe poseer al menos 8 caracteres' }) // Requisito del PDF
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe poseer al menos una mayúscula y un número', // Requisito del PDF[cite: 3]
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  contrasena: string;

  @IsString({ message: 'La fecha de nacimiento es obligatoria' })
  @IsNotEmpty({ message: 'La fecha de nacimiento no puede estar vacía' })
  fecha_nacimiento: string;

  @IsOptional()
  @IsString({ message: 'La descripción breve debe ser un texto' })
  descripcion_breve?: string;

  @IsOptional()
  @IsString()
  imagenPerfil?: string;

  @IsOptional()
  @IsIn(['usuario', 'administrador'], { message: 'El perfil debe ser usuario o administrador' })
  perfil?: string; // Por defecto será "usuario" en el servicio o esquema
}
