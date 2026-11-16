import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose'; // 👈 Faltaba importar Model
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
      perfil: datos.perfil || 'usuario',
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
    const token = await this.jwtService.signAsync(payload, { expiresIn: '2m' });

    return { 
      mensaje: 'Usuario creado con éxito', 
      token, // 👈 Se entrega el token que pide el enunciado
      usuario: resto 
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
    const token = await this.jwtService.signAsync(payload, { expiresIn: '2m' });

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
    
    const nuevoToken = await this.jwtService.signAsync(payload, { expiresIn: '2m' });
    return { token: nuevoToken };
  }
}