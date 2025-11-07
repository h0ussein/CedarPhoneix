import Category from '../model/Category.js';
import { uploadToImageKit, deleteFromImageKit } from '../middleware/upload.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// @desc    Get all categories (including inactive) - Admin only
// @route   GET /api/categories/admin/all
// @access  Admin
export const getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Admin
export const createCategory = async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      // Upload to ImageKit cloud storage
      body.image = await uploadToImageKit(req.file, 'categories');
    }
    const category = await Category.create(body);
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
export const updateCategory = async (req, res) => {
  try {
    // Get the existing category to check for old image
    const existingCategory = await Category.findById(req.params.id);
    
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const updates = { ...req.body };
    
    // Convert string booleans to actual booleans (FormData sends strings)
    if (updates.isActive !== undefined) {
      updates.isActive = updates.isActive === 'true' || updates.isActive === true;
    }
    
    if (req.file) {
      // Delete old image from ImageKit if it exists
      if (existingCategory.image) {
        await deleteFromImageKit(existingCategory.image);
      }
      // Upload new image to ImageKit cloud storage
      updates.image = await uploadToImageKit(req.file, 'categories');
    }
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// @desc    Toggle category visibility (hide/show)
// @route   PUT /api/categories/:id/visibility
// @access  Admin
export const toggleCategoryVisibility = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Toggle isActive
    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      data: category,
      message: `Category ${category.isActive ? 'shown' : 'hidden'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling category visibility',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
export const deleteCategory = async (req, res) => {
  try {
    // Find the category first to get the image URL
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Delete image from ImageKit if it exists
    if (category.image) {
      await deleteFromImageKit(category.image);
    }
    
    // Delete the category from database
    await Category.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

