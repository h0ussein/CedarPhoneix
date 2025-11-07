import Product from '../model/Product.js';
import { uploadToImageKit, deleteFromImageKit } from '../middleware/upload.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    
    // Build query
    let query = {};
    
    // Filter out hidden products for non-admin users
    if (!req.user || req.user.role !== 'admin') {
      query.isHidden = false;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      // Use regex for partial matching (like autocomplete)
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Build sort
    let sortOption = {};
    if (sort === 'price-asc') sortOption.price = 1;
    else if (sort === 'price-desc') sortOption.price = -1;
    else if (sort === 'name') sortOption.name = 1;
    else sortOption.createdAt = -1;
    
    // Execute query with pagination
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Get total count for pagination
    const count = await Product.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug description')
      .populate('relatedProducts', 'name price imageUrl category stock isHidden');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Hide product from non-admin users if it's hidden
    if (product.isHidden && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Filter out hidden related products for non-admin users
    if (product.relatedProducts && (!req.user || req.user.role !== 'admin')) {
      product.relatedProducts = product.relatedProducts.filter(rp => !rp.isHidden);
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Admin
export const createProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      // Upload to ImageKit cloud storage
      body.imageUrl = await uploadToImageKit(req.file, 'products');
    }
    // Convert numeric fields from FormData strings to numbers
    if (body.price !== undefined) {
      body.price = parseFloat(body.price) || 0;
    }
    if (body.stock !== undefined) {
      body.stock = parseInt(body.stock, 10) || 0;
    }
    if (body.discountPercent !== undefined) {
      body.discountPercent = parseFloat(body.discountPercent) || 0;
    }
    // Parse JSON fields from FormData
    if (typeof body.sizes === 'string') {
      try {
        body.sizes = JSON.parse(body.sizes);
      } catch (e) {
        body.sizes = [];
      }
    }
    if (typeof body.colors === 'string') {
      try {
        body.colors = JSON.parse(body.colors);
      } catch (e) {
        body.colors = [];
      }
    }
    if (typeof body.dimensions === 'string') {
      try {
        body.dimensions = JSON.parse(body.dimensions);
      } catch (e) {
        body.dimensions = {};
      }
    }
    const product = await Product.create(body);
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
export const updateProduct = async (req, res) => {
  try {
    // Get the existing product to check for old image
    const existingProduct = await Product.findById(req.params.id);
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updates = { ...req.body };
    if (req.file) {
      // Delete old image from ImageKit if it exists
      if (existingProduct.imageUrl) {
        await deleteFromImageKit(existingProduct.imageUrl);
      }
      // Upload new image to ImageKit cloud storage
      updates.imageUrl = await uploadToImageKit(req.file, 'products');
    }
    // Convert numeric fields from FormData strings to numbers
    if (updates.price !== undefined) {
      updates.price = parseFloat(updates.price) || 0;
    }
    if (updates.stock !== undefined) {
      updates.stock = parseInt(updates.stock, 10) || 0;
    }
    if (updates.discountPercent !== undefined) {
      updates.discountPercent = parseFloat(updates.discountPercent) || 0;
    }
    // Parse JSON fields from FormData
    if (typeof updates.sizes === 'string') {
      try {
        updates.sizes = JSON.parse(updates.sizes);
      } catch (e) {
        updates.sizes = [];
      }
    }
    if (typeof updates.colors === 'string') {
      try {
        updates.colors = JSON.parse(updates.colors);
      } catch (e) {
        updates.colors = [];
      }
    }
    if (typeof updates.dimensions === 'string') {
      try {
        updates.dimensions = JSON.parse(updates.dimensions);
      } catch (e) {
        updates.dimensions = {};
      }
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
export const deleteProduct = async (req, res) => {
  try {
    // Find the product first to get the image URL
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete image from ImageKit if it exists
    if (product.imageUrl) {
      await deleteFromImageKit(product.imageUrl);
    }
    
    // Delete the product from database
    await Product.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res) => {
  try {
    const query = { featured: true };
    
    // Filter out hidden products for non-admin users
    if (!req.user || req.user.role !== 'admin') {
      query.isHidden = false;
    }
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .limit(8);
    
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
};

// @desc    Update featured products (bulk update)
// @route   PUT /api/products/featured/update
// @access  Admin
export const updateFeaturedProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'productIds must be an array'
      });
    }

    // First, set all products to not featured
    await Product.updateMany({}, { featured: false });

    // Then, set selected products to featured
    if (productIds.length > 0) {
      const result = await Product.updateMany(
        { _id: { $in: productIds } },
        { featured: true }
      );

      // Verify all products exist
      const existingProducts = await Product.find({ _id: { $in: productIds } });
      if (existingProducts.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some product IDs are invalid'
        });
      }
    }

    // Get updated featured products
    const featuredProducts = await Product.find({ featured: true })
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Featured products updated successfully',
      data: featuredProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating featured products',
      error: error.message
    });
  }
};

// @desc    Update related products for a product
// @route   PUT /api/products/:id/related
// @access  Admin
export const updateRelatedProducts = async (req, res) => {
  try {
    const { relatedProductIds } = req.body;

    if (!Array.isArray(relatedProductIds)) {
      return res.status(400).json({
        success: false,
        message: 'relatedProductIds must be an array'
      });
    }

    // Verify the main product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify all related product IDs are valid and not the same as the main product
    const validRelatedIds = relatedProductIds.filter(id => id !== req.params.id);
    
    if (validRelatedIds.length > 0) {
      const existingProducts = await Product.find({ _id: { $in: validRelatedIds } });
      if (existingProducts.length !== validRelatedIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some related product IDs are invalid'
        });
      }
    }

    // Update the product's related products
    product.relatedProducts = validRelatedIds;
    await product.save();

    // Populate related products for response
    const updatedProduct = await Product.findById(req.params.id)
      .populate('relatedProducts', 'name price imageUrl category stock');

    res.status(200).json({
      success: true,
      message: 'Related products updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating related products',
      error: error.message
    });
  }
};

// @desc    Toggle product visibility (hide/show)
// @route   PUT /api/products/:id/visibility
// @access  Admin
export const toggleProductVisibility = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Toggle isHidden
    product.isHidden = !product.isHidden;
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
      message: `Product ${product.isHidden ? 'hidden' : 'shown'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling product visibility',
      error: error.message
    });
  }
};

