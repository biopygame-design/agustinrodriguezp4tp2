import { BadRequestException, Injectable, UnauthorizedException,ForbiddenException,NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Types } from 'mongoose'; // 👈 Faltaba importar Model
import { JwtService } from '@nestjs/jwt'; // 👈 Necesario para generar el token a 15 min
import { Usuario } from '../usuarios/usuario.schema';
import { CreateUsuariosDto } from '../usuarios/dto/create-usuarios.dto/create-usuarios.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
    private readonly jwtService: JwtService, // 👈 Inyectamos el servicio JWT
  ) {}

  async crear(datos: CreateUsuariosDto, imagenUrl?: string) {
    // 🛡️ Capturamos la contraseña sin importar cómo la haya mandado Angular (contrasena o password)
    const passwordPlana = datos.contrasena || (datos as any).password;

    if (!passwordPlana) {
      throw new BadRequestException('La contraseña es obligatoria para el registro');
    }

    // 1. Verificar si el correo o el nombre de usuario ya existen en MongoDB Atlas
    const usuarioExistente = await this.usuarioModel.findOne({
      $or: [
        { correo: datos.correo.trim().toLowerCase() },
        { nombre_usuario: datos.nombre_usuario.trim().toLowerCase() }
      ]
    });

    if (usuarioExistente) {
      throw new BadRequestException('El correo o el nombre de usuario ya están registrados');
    }

    // 2. Encriptar la contraseña con bcrypt usando la variable validada
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordPlana, salt);

    // 3. Crear y guardar el nuevo usuario
    const nuevoUsuario = new this.usuarioModel({
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      correo: datos.correo.trim().toLowerCase(),
      nombre_usuario: datos.nombre_usuario.trim().toLowerCase(),
      contrasena: hashedPassword, // Guardamos el hash correctamente
      fecha_nacimiento: datos.fecha_nacimiento,
      descripcion_breve: datos.descripcion_breve || '',
      imagenPerfil: imagenUrl || datos.imagenPerfil || '',
      rol: 'usuario',
    });

    await nuevoUsuario.save();

    const usuarioObj = nuevoUsuario.toObject();
    const { contrasena, ...resto } = usuarioObj;

    // 🔑 Generar token JWT de 15 minutos al registrarse
    const payload = { 
      sub: resto._id, 
      correo: resto.correo, 
      nombre_usuario: resto.nombre_usuario,
      rol: resto.rol || 'usuario' 
    };
    const token = await this.jwtService.signAsync(payload, { expiresIn: '3m' });

    return { 
      mensaje: 'Usuario creado con éxito', 
      token, // 👈 Se entrega el token que pide el enunciado
      usuario: resto 
    };
  }
  async crearDesdeAdmin(
  adminId: string,
  datos: CreateUsuariosDto,
  imagenUrl?: string
) {
  // Verificamos que quien realiza la operación sea administrador
  await this.verificarAdmin(adminId);

  const passwordPlana =
    datos.contrasena || (datos as any).password;

  if (!passwordPlana) {
    throw new BadRequestException(
      'La contraseña es obligatoria'
    );
  }

  if (!['usuario', 'admin'].includes(datos.rol || 'usuario')) {
    throw new BadRequestException('Rol no válido');
  }

  // Comprobar si ya existe el correo o nombre de usuario
  const usuarioExistente = await this.usuarioModel.findOne({
    $or: [
      { correo: datos.correo.trim().toLowerCase() },
      { nombre_usuario: datos.nombre_usuario.trim().toLowerCase() }
    ]
  });

  if (usuarioExistente) {
    throw new BadRequestException(
      'El correo o nombre de usuario ya están registrados'
    );
  }

  // Encriptar contraseña
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(passwordPlana, salt);

  // Crear usuario con el rol elegido por el administrador
  const nuevoUsuario = new this.usuarioModel({
    nombre: datos.nombre.trim(),
    apellido: datos.apellido.trim(),
    correo: datos.correo.trim().toLowerCase(),
    nombre_usuario: datos.nombre_usuario.trim().toLowerCase(),
    contrasena: hashedPassword,
    fecha_nacimiento: datos.fecha_nacimiento,
    descripcion_breve: datos.descripcion_breve || '',
    imagenPerfil: imagenUrl || '',
    rol: datos.rol || 'usuario',
    activo: true
  });

  await nuevoUsuario.save();

  const usuarioObj = nuevoUsuario.toObject();
  const { contrasena, ...usuarioSinPassword } = usuarioObj;

  return {
    mensaje: 'Usuario creado correctamente',
    usuario: usuarioSinPassword
  };
}

  async login(identificador: string, contrasenaPlana: string) {
    // 🛡️ Validación preventiva por si algún campo llega vacío o undefined
    if (!identificador || !contrasenaPlana) {
      throw new BadRequestException('El correo/usuario y la contraseña son obligatorios');
    }

    // 1. Buscar el usuario permitiendo ingresar tanto el correo como el nombre de usuario
    const usuario = await this.usuarioModel.findOne({ 
      $or: [
        { correo: identificador.trim().toLowerCase() },
        { nombre_usuario: identificador.trim().toLowerCase() }
      ]
    });
    
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (usuario.activo === false) {
  throw new ForbiddenException(
    'Tu cuenta está deshabilitada. Contactá a un administrador.'
  );
}

    // 2. Comparar la contraseña ingresada con el hash de bcrypt
    const esPasswordValida = await bcrypt.compare(contrasenaPlana, usuario.contrasena);
    if (!esPasswordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Retornar todos los datos del usuario requerido por la cátedra (excluyendo la contraseña)
    const usuarioObj = usuario.toObject();
    const { contrasena, ...resto } = usuarioObj;

    // 🔑 Generar el token JWT con vigencia estricta de 15 minutos exigida por la cátedra
    const payload = { 
      sub: resto._id, 
      correo: resto.correo, 
      nombre_usuario: resto.nombre_usuario,
      rol: resto.rol|| 'usuario' 
    };
    const token = await this.jwtService.signAsync(payload, { expiresIn: '3m' });

    return {
      mensaje: 'Login exitoso',
      token, // 👈 El token que el frontend guardará localmente
      usuario: resto,
    };
  }

  // 🔄 Método para refrescar el token (emite uno nuevo con otros 15 minutos de vigencia)
  async refrescarToken(usuarioPayload: any) {
    const payload = { 
      sub: usuarioPayload.sub, 
      correo: usuarioPayload.correo, 
      nombre_usuario: usuarioPayload.nombre_usuario,
      rol: usuarioPayload.rol 
    };
    
    const nuevoToken = await this.jwtService.signAsync(payload, { expiresIn: '15m' });
    return { token: nuevoToken };
  }

async actualizarPerfil(userId: string, datos: any, imagen?: string) {
  const usuario = await this.usuarioModel.findById(userId);

  if (!usuario) {
    throw new BadRequestException('Usuario no encontrado');
  }

  // Campos que el usuario puede modificar
  const camposPermitidos = [
    'nombre',
    'apellido',
    'correo',
    'nombre_usuario',
    'fecha_nacimiento',
    'descripcion_breve'
  ];

  for (const campo of camposPermitidos) {
    if (datos[campo] !== undefined) {
      const valor = datos[campo];

      if (typeof valor === 'string') {
        (usuario as any)[campo] =
          ['correo', 'nombre_usuario'].includes(campo)
            ? valor.trim().toLowerCase()
            : valor.trim();
      }
    }
  }

  // Comprobar que el correo y el usuario no pertenezcan a otra cuenta
  const existente = await this.usuarioModel.findOne({
    _id: { $ne: usuario._id },
    $or: [
      { correo: usuario.correo },
      { nombre_usuario: usuario.nombre_usuario }
    ]
  });

  if (existente) {
    throw new BadRequestException(
      'El correo o nombre de usuario ya está registrado'
    );
  }

  // Actualizar foto si se recibió una nueva
  if (imagen) {
    usuario.imagenPerfil = imagen;
  }

  await usuario.save();

  // Nunca devolver la contraseña
  const usuarioObj = usuario.toObject();
  const { contrasena, ...usuarioSinPassword } = usuarioObj;

  return {
    mensaje: 'Perfil actualizado correctamente',
    usuario: usuarioSinPassword
  };
}
private async verificarAdmin(usuarioId: string) {
  if (!Types.ObjectId.isValid(usuarioId)) {
    throw new UnauthorizedException('Usuario inválido');
  }

  const usuario = await this.usuarioModel.findById(usuarioId);

  if (!usuario || usuario.rol !== 'admin') {
    throw new ForbiddenException(
      'No tenés permisos de administrador'
    );
  }

  return usuario;
}

// Listar usuarios
async listarUsuarios(adminId: string) {
  await this.verificarAdmin(adminId);

  return await this.usuarioModel
    .find()
    .select('-contrasena')
    .sort({ nombre: 1 });
}

// Cambiar el rol de otro usuario
async cambiarRol(
  adminId: string,
  usuarioId: string,
  rol: string
) {
  await this.verificarAdmin(adminId);

  if (!Types.ObjectId.isValid(usuarioId)) {
    throw new BadRequestException('ID de usuario inválido');
  }

  if (!['usuario', 'admin'].includes(rol)) {
    throw new BadRequestException('Rol no válido');
  }

  if (adminId === usuarioId) {
    throw new BadRequestException(
      'No podés modificar tu propio rol desde este panel'
    );
  }

  const usuario = await this.usuarioModel.findById(usuarioId);

  if (!usuario) {
    throw new NotFoundException('Usuario no encontrado');
  }

  if (usuario.rol === 'admin' && rol === 'usuario') {
    const cantidadAdmins = await this.usuarioModel.countDocuments({
      rol: 'admin'
    });

    if (cantidadAdmins <= 1) {
      throw new BadRequestException(
        'No podés quitar el rol al último administrador'
      );
    }
  }

  usuario.rol = rol;
  await usuario.save();

  return {
    mensaje: 'Rol actualizado correctamente',
    usuario: {
      _id: usuario._id,
      nombre: usuario.nombre,
      nombre_usuario: usuario.nombre_usuario,
      rol: usuario.rol
    }
  };
}
// Deshabilitar usuario (baja lógica)
async deshabilitarUsuario(adminId: string, usuarioId: string) {
  await this.verificarAdmin(adminId);

  if (!Types.ObjectId.isValid(usuarioId)) {
    throw new BadRequestException('ID de usuario inválido');
  }

  if (adminId === usuarioId) {
    throw new BadRequestException(
      'No podés deshabilitar tu propia cuenta'
    );
  }

  const usuario = await this.usuarioModel.findById(usuarioId);

  if (!usuario) {
    throw new NotFoundException('Usuario no encontrado');
  }

  if (usuario.activo === false) {
    throw new BadRequestException('El usuario ya está deshabilitado');
  }

  // Evitar deshabilitar al último administrador activo
  if (usuario.rol === 'admin') {
    const cantidadAdminsActivos = await this.usuarioModel.countDocuments({
      rol: 'admin',
      activo: { $ne: false }
    });

    if (cantidadAdminsActivos <= 1) {
      throw new BadRequestException(
        'No podés deshabilitar al último administrador'
      );
    }
  }

  usuario.activo = false;
  await usuario.save();

  return {
    mensaje: 'Usuario deshabilitado correctamente',
    usuario: {
      _id: usuario._id,
      nombre: usuario.nombre,
      nombre_usuario: usuario.nombre_usuario,
      rol: usuario.rol,
      activo: usuario.activo
    }
  };
}

// Reactivar usuario
async activarUsuario(adminId: string, usuarioId: string) {
  await this.verificarAdmin(adminId);

  if (!Types.ObjectId.isValid(usuarioId)) {
    throw new BadRequestException('ID de usuario inválido');
  }

  const usuario = await this.usuarioModel.findById(usuarioId);

  if (!usuario) {
    throw new NotFoundException('Usuario no encontrado');
  }

  if (usuario.activo !== false) {
    throw new BadRequestException('El usuario ya está habilitado');
  }

  usuario.activo = true;
  await usuario.save();

  return {
    mensaje: 'Usuario reactivado correctamente',
    usuario: {
      _id: usuario._id,
      nombre: usuario.nombre,
      nombre_usuario: usuario.nombre_usuario,
      rol: usuario.rol,
      activo: usuario.activo
    }
  };
}

}