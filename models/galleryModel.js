const fs = require('fs');
const path = require('path');
const slugify = require('slugify');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const saveFile = util.promisify(fs.writeFile);

exports.get_data = async() => {
    const data = await readFile(path.join(__dirname, '../', "data.json"), 'utf8');
    return JSON.parse(data);
}

exports.save_data = async data => {
    await saveFile(path.join(__dirname, '../', "data.json"), JSON.stringify(data));
    return true;
}

exports.getGalleryByName = async name => {
    let return_obj = { code: 404, status: 'error', message: `Can't find gallery with name ${name}` };
    const data = await this.get_data();
    data.galleries.map(element => {
        if(element.name === name)
            return_obj = element;
    });
    return return_obj;
}

exports.getGalleryByPath = async path => {
    let return_obj = { code: 404, status: 'error', message: `Can't find gallery with path ${path}` };
    const data = await this.get_data();
    data.galleries.map(element => {
        if(element.path === path)
            return_obj = element;
    });
    return return_obj;
}

exports.getGalleries = async required_rows => {
    const return_obj = { galleries: []};
    const data = await this.get_data();
    data.galleries.map(element => {
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

exports.postGallery = async name => {
    let new_data = await this.get_data();
    const path = slugify(name, { lower: true, strict: true, trim: true })
    new_data.galleries.push({name, path });
    await this.save_data(new_data);
    return { name, path };
}

exports.removeGalleryOrPhotoByPath = async path => {
    const default_data = await this.get_data();
    let data = await this.get_data();
    data = data.galleries.filter(element => element.path !== path)
    if(JSON.stringify(default_data) === JSON.stringify({ galleries: data })){
        data.forEach(element => {
            if(!element.images) Object.assign(element, {images: []});
            element.images.forEach(image => {
                if(image.path === path){
                    fs.unlink(`./public/images/${image.fullpath}`, (err) => { err && console.log(err) });
                }
            })
            element.images = element.images.filter(image => image.path !== path)
        })
    } else {
        fs.rm(`./public/images/${path}`, { recursive: true, force: true }, (err) => { err && console.log(err) });
    }

    if(JSON.stringify(default_data) === JSON.stringify({ galleries: data })){
        return { code: 404, status: 'error', message: `Gallery/photo does not exists` };
    } else {
        await this.save_data({ galleries: data });
        return  { code: 200, status: 'success', message: `Gallery/photo was deleted` };;
    }
}


exports.saveGalleryByPath = async (path, new_gallery_data) => {
    const data = await this.get_data();
    data.galleries.map((element, index) => {
        if(path === element.path){
            data.galleries[index] = new_gallery_data;
        }
    })
    await this.save_data(data);
    return true;
}

exports.postPhotosToGallery = async (path, images) => {
    const gallery = await this.getGalleryByPath(path);
    if(gallery.code === 404) return gallery;
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
    await this.saveGalleryByPath(path, gallery);
    return uploaded;
}