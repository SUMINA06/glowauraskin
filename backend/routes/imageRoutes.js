const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const imageController = require('../controller/imageController');

// Upload image for a product
router.post('/upload', upload.single('image'), imageController.uploadImage);

// Get all images
router.get('/', imageController.getAllImages);

// Get images for a product
router.get('/product/:product_id', imageController.getProductImages);

// Get image by ID
router.get('/:id', imageController.getImageById);

// Update image
router.put('/:id', imageController.updateImage);

// Delete image
router.delete('/:id', imageController.deleteImage);

module.exports = router;
