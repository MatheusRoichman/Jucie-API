const router = require('express').Router();
const uuid = require('uuid');
const Product = require('../models/Product');
const checkToken = require('../checkToken');
const serverErrorMessage = require('../serverErrorMessage');
const { log } = require('../logger');

router.get('/', async (req, res) => {
  const { id, category } = req.query;
  
  if (category) {
    const productsFilteredByCategory = await Product.find({
      category
    });

    if (!productsFilteredByCategory.length) {
      log('Filter products by category', 'Unsuccessful request', `no products in category ${category}`);

      return res.status(404).json({
        message: "Sem produtos disponíveis nessa categoria."
      });
    }
    
    log('Filter products by category', `Returned products in category ${category}`);

    return res.status(200).json({
      products: productsFilteredByCategory
    });
  } else if (id) {
    const productFoundById = await Product.findById(id);

    if (!productFoundById) {
      log('Find product by ID', 'Unsuccessful request', `no product found with ID ${id}`);

      return res.status(404).json({
        message: 'Produto não encontrado'
      });
    }

    log('Find product by id', `Returned product with ID ${id}`);

    return res.status(200).json({
      product: productFoundById
    });
  }
  try {
    const products = await Product.find();

    if (!products.length) {
      log('Get all products', 'Unsuccessful request', 'No product found');

      return res.status(404).json({
        message: 'Não há produtos disponíveis no momento.'
      });
    }
    
    log('Get all products', 'Returned all products')

    return res.status(200).json(products);
  } catch (error) {
    log('Get all products', 'Internal server error', error.message);

    return res.status(500).json({
      error: serverErrorMessage
    });
  }
});

router.post('/', checkToken, async (req, res) => {
  const { name, price, category, amount, imageUrl } = req.body;
  const product = {
    name,
    price,
    category,
    amount,
    imageUrl,
    _id: uuid.v4()
  };

  if (!product.name) {
    log('Register product', 'Unsuccessful request', 'Product name not entered');

    return res.status(400).json({
      error: 'O nome do produto não foi inserido!'
    });
  }

  if (!product.price) {
    log('Register product', 'Unsuccessful request', 'Product price not entered');

    return res.status(400).json({
      error: 'O preço do produto não foi inserido!'
    });
  }

  if (!product.category) {
    log('Register product', 'Unsuccessful request', 'Product category not entered');

    return res.status(400).json({
      error: 'A categoria do produto não foi inserida!'
    });
  }

  if (!product.amount) {
    log('Register product', 'Unsuccessful request', 'Product amount not entered');

    return res.status(400).json({
      error: 'A quantidade do produto em estoque não foi inserida!'
    });
  }

  if (!product.imageUrl) {
    log('Register product', 'Unsuccessful request', 'Product image URL not entered');

    return res.status(400).json({
      error: 'A imagem do produto não foi inserida!'
    });
  }

  if (!product._id) {
    log('Register product', 'Internal server error', 'Product ID not generated correctly');

    return res.status(500).json({
      error: serverErrorMessage
    });
  }

  try {
    await Product.create(product);

    log('Register product', 'The product has been created');

    return res.status(201).json({
      message: 'Produto cadastrado com sucesso!'
    });
  } catch(error) {
    log('Register product', 'Internal server error', error.message);

    return res.status(500).json({
      error: serverErrorMessage
    })
  }
});

router.patch('/', checkToken, async (req, res) => {
  const { id } = req.query;
  const { name, price, category, amount, imageUrl } = req.body;

  const product = {
    name,
    price,
    category,
    amount,
    imageUrl
  }

  try { 
    const updatedProduct = await Product.updateOne({
      _id: id
    }, product);

    if (!updatedProduct.matchedCount) {
      log('Update product', 'Unsuccessful request', `No product found with ID ${id}`);

      return res.status(404).json({
        message: 'Produto não encontrado'
      });
    }

    log('Update product', `The product ${id} has been updated`);

    return res.status(204).end();
  } catch (error) {
    log('Update product', 'Internal server error', error.message)

    return res.status(500).json({
      error: serverErrorMessage
    });
  }
});

router.delete('/', checkToken, async (req, res) => {
  const { id } = req.query;

  const product = await Product.findById(id);

  if (!product) {
    log('Delete product', 'Unsuccessful request', `No product found with ID ${id}`)

    return res.status(404).json({
      message: 'Produto não encontrado'
    });
  }

  try {
    await Product.deleteOne({
      _id: id
    });

    log('Delete product', `The product ${id} has been deleted`)

    return res.status(200).json({
      message: "Produto deletado com sucesso"
    });
  } catch (error) {
    log('Delete product', 'Internal server error', error.message)

    return res.status(500).json({
      error: serverErrorMessage
    });
  }
});

module.exports = router;