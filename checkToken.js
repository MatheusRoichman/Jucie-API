const jwt = require('jsonwebtoken');

const checkToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Acesso negado!'
    });
  }

  try {
    const secret = process.env.SECRET;

    jwt.verify(token, secret);

    return next();
  } catch (error) {
    return res.status(400).json({
      message: 'Token inválido!'
    })
  }
};

module.exports = checkToken;