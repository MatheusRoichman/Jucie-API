const jwt = require('jsonwebtoken');

const checkToken = (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(401).json({
      message: 'Acesso negado!'
    });
  }

  try {
    const secret = process.env.SECRET;

    jwt.verify(accessToken, secret);

    return next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido!'
    })
  }
};

module.exports = checkToken;