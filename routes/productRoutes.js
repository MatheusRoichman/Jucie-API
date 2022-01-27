const router = require('express').Router();
const uuid = require('uuid');
const Product = require('../models/Product');
const checkToken = require('../checkToken');

router.get('/', async (req, res) => {
  const products = await Product.find();

  return res.status(200).json(products);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findOne({
      _id: id
    });

    if (!product) {
      return res.status(200).json({
        message: 'Produto não encontrado'
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({
      error
    });
  } 
});

router.post('/', checkToken, async (req, res) => {
  const { name, price, category, imageUrl } = req.body;
  const product = {
    name,
    price,
    category,
    imageUrl,
    _id: uuid.v4()
  };

  if (!product.name) {
    return res.status(400).json({
      error: 'O nome do produto não foi inserido!'
    });
  }

  if (!product.price) {
    return res.status(400).json({
      error: 'O nome do produto não foi inserido!'
    });
  }

  if (!product.category) {
    return res.status(400).json({
      error: 'A categoria do produto não foi inserida!'
    });
  }

  if (!product.imageUrl) {
    return res.status(400).json({
      error: 'A imagem do produto não foi inserida!'
    });
  }

  if (!product._id) {
    return res.status(500).json({
      error: 'Erro ao cadastrar o produto. Tente novamente.'
    });
  }

  try {
    await Product.create(product);
[]
    return res.status(201).json({
      message: 'Produto cadastrado com sucesso!'
    });
  } catch(error) {
    return res.status(500).json({
      error
    })
  }
});

router.patch('/:id', checkToken, async (req, res) => {
  const { id } = req.params;
  const { name, price, category, imageUrl } = req.body;

  const product = {
    name,
    price,
    category,
    imageUrl
  }

  try {
    const updatedProduct = await Product.updateOne({
      _id: id
    }, product);

    if (!updatedProduct.matchedCount) {
      return res.status(200).json({
        message: 'Produto não encontrado'
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({
      error
    });
  }
});

router.delete('/:id', checkToken, async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOne({
    _id: id
  });

  if (!product) {
    return res.status(200).json({
      message: 'Produto não encontrado'
    });
  }

  try {
    await Product.deleteOne({
      _id: id
    });

    return res.status(200).json({
      message: "Produto deletado com sucesso"
    });
  } catch (error) {
    return res.status(500).json({
      error
    });
  }
})

module.exports = router;