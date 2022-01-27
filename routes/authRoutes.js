const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name) {
    return res.status(400).json({
      message: 'O nome não foi inserido!'
    });
  }
  
  if (!email) {
    return res.status(400).json({
      message: 'O e-mail não foi inserido!'
    });
  }

  if (!password) {
    return res.status(400).json({
      message: 'A senha não foi inserida!'
    });
  }

  if (!confirmPassword) {
    return res.status(400).json({
      message: 'A senha não foi confirmada!'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      message: 'As senhas não conferem!'
    });
  }

  const userExists = await User.findOne({
    email: email
  });

  if (userExists) {
    return res.status(200).json({
      message: 'O e-mail já está sendo usado!'
    })
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email,
    password: passwordHash
  });

  try {
    await user.save();
    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!'
    })
  } catch (error) {
    return res.status(500).json({
      error
    })
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      message: 'O e-mail não foi inserido!'
    });
  }

  if (!password) {
    return res.status(400).json({
      message: 'A senha não foi inserida!'
    });
  }

  const user = await User.findOne({
    email: email
  });

  if (!user) {
    return res.status(200).json({
      message: 'Usuário não encontrado'
    });
  }

  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(401).json({
      message: 'Senha inválida'
    });
  }

  try {
    const secret = process.env.SECRET;
    const token = jwt.sign({
      id: user._id
    }, secret, {
      expiresIn: "1800s"
    });

    return res.status(200).json({
      message: 'Usuário autenticado com sucesso',
      token
    });
  } catch (error) {
    return res.status(500).json({
      error
    })
  }
});

module.exports = router;