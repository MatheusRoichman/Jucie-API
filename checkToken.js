const jwt = require('jsonwebtoken');
const { log } = require('./logger');
const serverErrorMessage = require('./serverErrorMessage');

const checkToken = (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    log('Access token check', 'Unsuccessful', 'Access denied');

    return res.status(401).json({
      message: 'Acesso negado!'
    });
  }

  try {
    const secret = process.env.SECRET;

    jwt.verify(accessToken, secret);

    return next();
  } catch (error) {
    if(error instanceof jwt.TokenExpiredError) {
      log('Access token check', 'Unsuccessful', 'Expired token');

      return res.status(401).json({
        error: 'Token expirado!'
      })
    } else {
      log('Access token check', 'Internal server error', error.message);

      return res.status(500).json({
        error
      })
    }
    
  }
};

module.exports = checkToken;