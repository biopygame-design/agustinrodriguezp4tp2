import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario } from './usuario.schema';
import { CreateUsuariosDto } from './dto/create-usuarios.dto/create-usuarios.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
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
      perfil: datos.perfil || 'usuario',
    });

    await nuevoUsuario.save();

    const usuarioObj = nuevoUsuario.toObject();
    const { contrasena, ...resto } = usuarioObj;

    return { 
      mensaje: 'Usuario creado con éxito', 
      usuario: resto 
    };
  }

  async listar() {
    const usuarios = await this.usuarioModel.find().exec();
    return usuarios.map((user) => {
      const obj = user.toObject();
      const { contrasena, ...resto } = obj;
      return resto;
    });
  }

  async buscar(id: string) {
    const usuario = await this.usuarioModel.findById(id).exec();
    if (!usuario) {
      throw new NotFoundException(`No existe el usuario con ID ${id}`);
    }
    const obj = usuario.toObject();
    const { contrasena, ...resto } = obj;
    return resto;
  }

  async eliminar(id: string) {
    const eliminado = await this.usuarioModel.findByIdAndDelete(id).exec();
    if (!eliminado) {
      throw new NotFoundException(`No existe el usuario con ID ${id}`);
    }
    return { mensaje: `Usuario ${id} eliminado` };
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

    // 2. Comparar la contraseña ingresada con el hash de bcrypt
    const esPasswordValida = await bcrypt.compare(contrasenaPlana, usuario.contrasena);
    if (!esPasswordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Retornar todos los datos del usuario requerido por la cátedra (excluyendo la contraseña)
    const usuarioObj = usuario.toObject();
    const { contrasena, ...resto } = usuarioObj;

    return {
      mensaje: 'Login exitoso',
      usuario: resto,
    };
  }
}