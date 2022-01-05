const express = require('express');
const galleryApiController = require('../controllers/api/galleryApiController');
const router = express.Router();
module.exports = router;

router
        .route('/gallery/:path?')
        .get(galleryApiController.gallery.get)
        .post(galleryApiController.uploadPhoto, galleryApiController.gallery.post)
        .delete(galleryApiController.gallery.delete)

router
        .get('/images/:dismension/:path', galleryApiController.gallery.thumbnailGet)