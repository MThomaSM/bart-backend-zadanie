const fs = require('fs');
const path = require('path');
const slugify = require('slugify');
const readFileAsync = require('../utils/readFileAsync');

exports.get_data = () => {
    const data = fs.readFileSync(path.join(__dirname, '../', "data.json"), 'utf8');
    return JSON.parse(data);
}

exports.save_data = (data) => {
    fs.writeFileSync(path.join(__dirname, '../', "data.json"), JSON.stringify(data));
    return true;
}

exports.getGalleryByName = name => {
    let return_obj = { code: 404, status: 'error', message: `Can't find gallery with name ${name}` };
    this.get_data().galleries.map(element => {
        if(element.name === name)
            return_obj = element;
    });
    return return_obj;
}

exports.getGalleryByPath = path => {
    let return_obj = { code: 404, status: 'error', message: `Can't find gallery with path ${path}` };
    this.get_data().galleries.map(element => {
        if(element.path === path)
            return_obj = element;
    });
    return return_obj;
}

exports.getGalleries = required_rows => {
    const return_obj = { galleries: []};
    this.get_data().galleries.map(element => {
        const one_return_el = {};
        Object.keys(element).forEach(el_row => {
            required_rows.forEach(row => {
                if(el_row == row)
                    one_return_el[row] = element[row];
            });
        });
        return_obj.galleries.push(one_return_el);
    });
    return return_obj;
}

exports.postGallery = name => {
    let new_data = this.get_data();
    const path = slugify(name, { lower: true, strict: true, trim: true })
    new_data.galleries.push({name, path });
    this.save_data(new_data);
    return { name, path };
}

exports.removeGalleryOrPhotoByPath = path => {
    const default_data = this.get_data();
    const data = this.get_data().galleries.filter(element => element.path !== path)
    data.forEach(element => {
        if(!element.images) Object.assign(element, {images: []});
        element.images = element.images.filter(image => image.path !== path)
    })
    if(JSON.stringify(default_data) === JSON.stringify({ galleries: data })){
        return { code: 404, status: 'error', message: `Gallery/photo does not exists` };
    } else {
        this.save_data({ galleries: data });
        return  { code: 200, status: 'success', message: `Gallery/photo was deleted` };;
    }
}


exports.saveGalleryByPath = (path, new_gallery_data) => {
    const data = this.get_data();
    data.galleries.map((element, index) => {
        if(path === element.path){
            data.galleries[index] = new_gallery_data;
        }
    })
    this.save_data(data);
    return true;
}

exports.postPhotosToGallery = (path, images) => {
    const gallery = this.getGalleryByPath(path);
    const uploaded = [];
    if(!gallery.images) Object.assign(gallery, {images: []});
    images.forEach(image => {
        new_image = {
            path: image.filename,
            fullpath: `${path}/${image.filename}`,
            name: image.filename.split('.')[0],
            modified: new Date().toISOString()
        }
        gallery.images.push(new_image);
        uploaded.push(new_image)
    })
    this.saveGalleryByPath(path, gallery);
    return uploaded;
}