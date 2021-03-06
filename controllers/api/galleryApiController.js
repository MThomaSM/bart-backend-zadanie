const fs = require('fs');
const path = require('path');
const catchAsync = require('../../utils/catchAsync');
const Gallery = require('../../models/galleryModel');
const Ajv = require("ajv")
const multer = require('multer');
const imageThumbnail = require('image-thumbnail');

const ajv = new Ajv()

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = `./public/images/${req.params.path}`
        fs.mkdirSync(path, { recursive: true })
        cb(null, path)
    },
    filename: (req, file, cb) => {
        const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const ext = file.mimetype.split('/')[1];
        cb(null, `${req.params.path}-${Date.now()}-${randomNumber(1, 1000)}.${ext}`)
    }
})

const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null, true);
    } else {
        cb(new Error("Not an image"), false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadPhoto = upload.array('photos', 20);

exports.gallery = {
    get: catchAsync(async(req, res, next) => {
        const { path } = req.params;
        const fields = req.query.fields ? req.query.fields.split(',') : ["name", "path"]
        let return_data = {}
        if(path){
            const data = await Gallery.getGalleryByPath(path);
            return_data = { gallery: { path: data.path, name: data.name }, images: data.images };
        } else {
            return_data = await Gallery.getGalleries(fields);
        }
        res.status(200).json(return_data);
    }),
    post: catchAsync(async(req, res, next) => {
        if(!req.params.path){
            const { name } = req.body;
            const validate = ajv.compile({
                "title": "New gallery insert schema",
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "minLength": 1
                    }
                },
                "required": ["name"],
                "additionalProperties": false
            })
            const valid = validate(req.body);
            const name_check = await Gallery.getGalleryByName(name);
            if(valid === false){
                return res.status(400).json({ code: 400, payload: validate.errors, name: "IVALID_SCHEMA", message: `Invalid request. The request doesn't conform to the schema.` })
            }
            if(name_check.code !== 404){
                return res.status(409).json({ code: 409, status: 'error', message: `Gallery with this name already exists` })
            }
            if(req.body.name.includes('/')){
                return res.status(409).json({ code: 409, status: 'error', message: `Gallery name can't contain a slash` })
            }
            return res.status(201).json(await Gallery.postGallery(req.body.name));
        } else {
            const uploaded = await Gallery.postPhotosToGallery(req.params.path, req.files);
            return res.status(201).json({ uploaded });
        }
    }),
    delete: catchAsync(async(req, res, next) => {
        return res.status(200).json(await Gallery.removeGalleryOrPhotoByPath(req.params.path));
    }),
    thumbnailGet: catchAsync(async(req, res, next) => {
        const { dismension, path } = req.params;
        const [ w,h ] = dismension.split("x");
        const data = await Gallery.get_data();
        let fullPath = "";
        data.galleries.forEach(element => {
            if(element.images && element.images.length > 0) {
                element.images.forEach(image => {
                    if(image.path === path){
                        fullPath = image.fullpath;
                    }
                })
            }
        })
        const thumbnail = await imageThumbnail(`./public/images/${fullPath}`, { width: parseInt(w), height: parseInt(h), fit: "fill" });
        const img = Buffer.from(thumbnail);
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        })
        res.end(img); 
    })
}
