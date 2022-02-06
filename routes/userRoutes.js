const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const User = require('../models/User');
const checkToken = require('../checkToken');
const serverErrorMessage = require('../serverErrorMessage');
const { log } = require('../logger');

router.get('/', checkToken, async (req, res) => {
  const { id, name } = req.query;
  
  if (name) {
    const usersFilteredByName = await User.find({
      name: new RegExp(name, 'g'),
    }).select('-password');

    if (!usersFilteredByName.length) {
      log('Filter users by name', 'Unsuccessful request', `no users with name ${name} or similar`);

      return res.status(404).json({
        message: `Sem usuários existentes com o nome ${name} ou parecido`
      });
    }
    
    log('Filter users by name', `Returned users with name ${name} or similar`);

    return res.status(200).json({
      users: usersFilteredByName
    });
  } else if (id) {
    const userFoundById = await User.findById(id).select('-password');

    if (!userFoundById) {
      log('Find user by ID', 'Unsuccessful request', `no user found with ID ${id}`);

      return res.status(404).json({
        message: 'Produto não encontrado'
      });
    }

    log('Find user by id', `Returned user with ID ${id}`);

    return res.status(200).json({
      user: userFoundById
    });
  }
  try {
    const users = await User.find().select('-password');

    if (!users.length) {
      log('Get all users', 'Unsuccessful request', 'No user found');

      return res.status(404).json({
        message: 'Não há produtos disponíveis no momento.'
      });
    }
    
    log('Get all users', 'Returned all users')

    return res.status(200).json(users);
  } catch (error) {
    log('Get all users', 'Internal server error', error.message);

    return res.status(500).json({
      error: serverErrorMessage
    });
  }
});

router.post('/register', checkToken, async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name) {
    log('Register user', 'Unsuccessful request', 'User name not entered');

    return res.status(400).json({
      message: 'O nome não foi inserido!'
    });
  }
  
  if (!email) {
    log('Register user', 'Unsuccessful request', 'User e-mail not entered');

    return res.status(400).json({
      message: 'O e-mail não foi inserido!'
    });
  }

  if (!password) {
    log('Register user', 'Unsuccessful request', 'User password not entered');

    return res.status(400).json({
      message: 'A senha não foi inserida!'
    });
  }

  if (!confirmPassword) {
    log('Register user', 'Unsuccessful request', 'User password confirmation not entered');

    return res.status(400).json({
      message: 'A senha não foi confirmada!'
    });
  }

  if (password !== confirmPassword) {
    log('Register user', 'Unsuccessful request', "The passwords don't match");

    return res.status(400).json({
      message: 'As senhas não conferem!'
    });
  }

  const userExists = await User.findOne({
    email
  });

  if (userExists) {
    log('Register user', 'Unsuccessful request', `User with e-mail ${email} already exists`);

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

    log('Register user', 'User created successfully');

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!'
    })
  } catch (error) {
    log('Register user', 'Internal server error', error.message);

    return res.status(500).json({
      error: serverErrorMessage
    })
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    log('User log in', 'Unsuccessful request', "User e-mail not entered");

    return res.status(400).json({
      message: 'O e-mail não foi inserido!'
    });
  }

  if (!password) {
    log('User log in', 'Unsuccessful request', "User password not entered");

    return res.status(400).json({
      message: 'A senha não foi inserida!'
    });
  }

  const user = await User.findOne({
    email: email
  });

  if (!user) {
    log('User log in', 'Unsuccessful request', "User not found");

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

    log('User log in', 'User logged in successfully');

    return res
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() + 1800000),
        maxAge: 1800000
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() + 259200000),
        maxAge: 259200000
      })
      .status(200)
      .json({
        message: 'Usuário autenticado com sucesso'
      });
  
  } catch (error) {
    log('User log in', 'Internal server error', error.message);

    return res.status(500).json({
      error: serverErrorMessage
    })
  }
});

router.post('/refreshToken', async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    log('Refresh access token', 'Unsuccessful request', "Refresh token not provided");

    res.status(400).json({
      message: "O token é necessário"
    })
  }

  try {
    const secret = process.env.SECRET;
    const payload = jwt.verify(refreshToken, secret);

    if (payload) {
      const token = jwt.sign({
        id: payload.id
      }, secret, {
        expiresIn: "30m"
      });

      log('Refresh access token', 'Access token refreshed successfully');

      return res
        .cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() + 1800000),
        maxAge: 1800000
        })
        .status(200)
        .json({
          message: 'Access token gerado com sucesso'
        });

    } else {
      log('Refresh access token', 'Unsuccessful request', "Invalid refresh token");

      res.status(401).json({
        message: 'Refresh token inválido'
      });
    }
    
    } catch (error) {
      log('Refresh access token', 'Internal server error', error.message);

      res.status(500).json({
        error: serverErrorMessage
      })
    }
});

router.get('/logout', async (req, res) => {
  try {
    log('User log out', 'User logged out successfully');

    return res
      .clearCookie('accessToken')
      .clearCookie('refreshToken')
      .status(200)
      .json({
        message: 'Desconectado com sucesso'
      });
  } catch (error) {
    log('User log out', 'Internal server error', error.message);

    return res.status(500).json({
      error: serverErrorMessage
    });
  }
});

router.patch('/', checkToken, async (req, res) => {
  const { id } = req.query;
  const { name, email, password } = req.body;

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = {
    name,
    email,
    password: passwordHash
  };

  try { 
    const updatedUser = await User.updateOne({
      _id: id
    }, user);

    if (!updatedUser.matchedCount) {
      log('Update user', 'Unsuccessful request', `No user found with ID ${id}`);

      return res.status(404).json({
        message: 'Usuário não encontrado'
      });
    }

    log('Update user', `The user ${id} has been updated`);

    return res.status(204).end();
  } catch (error) {
    log('Update user', 'Internal server error', error.message)

    return res.status(500).json({
      error: serverErrorMessage
    });
  }
});

router.delete('/', checkToken, async (req, res) => {
  const { id } = req.query;

  const user = await User.findById(id);

  if (!user) {
    log('Delete user', 'Unsuccessful request', `No user found with ID ${id}`)

    return res.status(404).json({
      message: 'Usuário não encontrado'
    });
  }

  try {
    await User.deleteOne({
      _id: id
    });

    log('Delete user', `The user ${id} has been deleted`)

    return res.status(200).json({
      message: "Usuário deletado com sucesso"
    });
  } catch (error) {
    log('Delete user', 'Internal server error', error.message)

    return res.status(500).json({
      error: serverErrorMessage
    });
  }
});

module.exports = router;