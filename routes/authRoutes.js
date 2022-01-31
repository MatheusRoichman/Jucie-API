const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const User = require('../models/User');
const checkToken = require('../checkToken');
const serverErrorMessage = require('../serverErrorMessage');

router.post('/register', checkToken, async (req, res) => {
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
    return res.status(409).json({
      message: 'O e-mail já está sendo usado!'
    })
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  try {
    await User.create({
      name,
      email,
      password: passwordHash,
     _id: uuid.v4()
    })
    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!'
    })
  } catch (error) {
    return res.status(500).json({
      error: serverErrorMessage
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
    return res.status(404).json({
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
    const accessToken = jwt.sign({
      id: user._id
    }, secret, {
      expiresIn: "30m"
    });

    const refreshToken = jwt.sign({
      id: user._id
    }, secret, {
      expiresIn: "3d"
    });


    return res
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() + 1800000),
        maxAge: new Date(Date.now() + 1800000)
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() + 259200000),
        maxAge: new Date(Date.now() + 259200000)
      })
      .status(200)
      .json({
        message: 'Usuário autenticado com sucesso'
      });
  
  } catch (error) {
    return res.status(500).json({
      error: serverErrorMessage
    })
  }
});

router.post('refreshToken', async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    res.status(400).json({
      message: "O token é necessário"
    })
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.SECRET);

    if (payload) {
      const token = jwt.sign({
        id: payload.id
      });

      res.status(200).json({
        token
      });
    } else {
      res.status(401).json({
        message: 'Refresh token inválido'
      });
    }
    
    } catch (error) {
      res.status(500).json({
        error: serverErrorMessage
      })
    }
});

router.get('/logout', async (req, res) => {
  try {
    return res
      .clearCookie('accessToken')
      .clearCookie('refreshToken')
      .status(200)
      .json({
        message: 'Desconectado com sucesso'
      });
  } catch (error) {
    return res.status(500).json({
      error: serverErrorMessage
    });
  }
});

module.exports = router;