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

  
}