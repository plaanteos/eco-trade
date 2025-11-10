// backend/controllers/userController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

class UserController {
  // Registro de usuario
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'Usuario o email ya registrado' 
        });
      }

      // Crear nuevo usuario
      const newUser = new User({
        username,
        email,
        password,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      });

      await newUser.save();

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: newUser._id, 
          username: newUser.username 
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          ecoCoins: newUser.ecoCoins
        },
        token
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error en el registro', 
        error: error.message 
      });
    }
  }

  // Inicio de sesión
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ 
          message: 'Credenciales inválidas' 
        });
      }

      // Verificar contraseña
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ 
          message: 'Credenciales inválidas' 
        });
      }

      // Generar token
      const token = jwt.sign(
        { 
          id: user._id, 
          username: user.username 
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        message: 'Inicio de sesión exitoso',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          ecoCoins: user.ecoCoins,
          sustainabilityScore: user.sustainabilityScore
        },
        token
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error en el inicio de sesión', 
        error: error.message 
      });
    }
  }

  // Obtener perfil de usuario
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .select('-password')
        .populate('productsSold', 'name price');

      if (!user) {
        return res.status(404).json({ 
          message: 'Usuario no encontrado' 
        });
      }

      res.json({
        profile: user,
        statistics: {
          totalEcoCoins: user.ecoCoins,
          sustainabilityScore: user.sustainabilityScore,
          totalProductsSold: user.productsSold.length
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error al obtener perfil', 
        error: error.message 
      });
    }
  }

  // Actualizar perfil
  async updateProfile(req, res) {
    try {
      const { username, profileImage } = req.body;

      const updateData = {};
      if (username) updateData.username = username;
      if (profileImage) updateData.profileImage = profileImage;

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id, 
        updateData, 
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        message: 'Perfil actualizado',
        user: updatedUser
      });
    } catch (error) {
      res.status(400).json({ 
        message: 'Error al actualizar perfil', 
        error: error.message 
      });
    }
  }
}

module.exports = new UserController();