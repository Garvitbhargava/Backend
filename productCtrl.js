const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbid");
const fs = require("fs");
const { cloudinaryUploadImg,cloudinaryDeleteImg } =require("../utils/cloudinary");




const createProduct = asyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const newProduct = await Product.create(req.body);
        res.json(newProduct);
    } catch (error) {
        throw new Error(error);
    }
});


const updateProduct = asyncHandler(async (req, res) => {
    const id = req.params.id; // Corrected parameter extraction
    const tit = req.body.title;
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const updateObject = { title: req.body.title, slug: req.body.slug }; // Updated update object
        const updateProduct = await Product.findOneAndUpdate({ _id: id }, updateObject, {
            new: true,
        });
        console.log(updateProduct);
        res.json(updateProduct);
    } catch (error) {
        throw new Error(error);
    }
});

//delete product
const deleteProduct = asyncHandler(async (req, res) => {
    const id = req.params.id;
    try {
        const deleteProduct = await Product.findOneAndDelete(id)
        res.json(deleteProduct);
    } catch (error) {
        throw new Error(error);
    }
});



const getaProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const findProduct = await Product.findById(id);
        res.json(findProduct);
    }
    catch (error) {
        throw new Error(error);
    }

});

const getAllProduct = asyncHandler(async (req, res) => {
    try {
        //Filtering
        const queryObj = { ...req.query };
        const exculdeFields = ["page", "sort", "limit", "fields"];
        exculdeFields.forEach((el) => delete queryObj[el]);

        let querystr = JSON.stringify(queryObj);
        querystr = querystr.replace(/\b(gte|gt|lte|lt)\b /g, match => `$${match}`);

        let query = Product.find(JSON.parse(querystr));

        //Sorting

        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        //limiting the fields

        if (req.query.fields) {
            const fields = req.query.fields.split(",").join(" ");
            query = query.select(fields);
        } else {
            query = query.select('-__v');
        }

        //pagination 

        const page = req.query.page;
        const limit = req.query.limit;
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);
        if (req.query.page) {
            const productCount = await Product.countDocuments();
            if (skip >= productCount) throw new Error('This Page does not exists');
        }
        console.log(page, limit, skip);
        const products = await query;

        res.json(products);
    } catch (error) {
        throw new Error(error);
    }
});


const addToWishlist = asyncHandler(async (req, res) => {

    const { _id } = req.user;
    const { prodId } = req.body;
    try {
        const user = await User.findById(_id);
        const alreadyAdded = user.wishlist.find(id => id.toString() === prodId);

        if (alreadyAdded) {
            const updatedUser = await User.findByIdAndUpdate(_id, {
                $pull: { wishlist: prodId },
            }, { new: true });

            res.json(updatedUser);
        } else {
            const updatedUser = await User.findByIdAndUpdate(_id, {
                $push: { wishlist: prodId },
            }, { new: true });

            res.json(updatedUser);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const rating = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    const { star, comment, prodId } = req.body;
    try {
        const product = await Product.findById(prodId);
        let alreadyRated = product.ratings.find(
            (used) => used.postedby.toString() === _id.toString()
        );
        if (alreadyRated) {

            const updateRating = await Product.updateOne({
                ratings: { $elemMatch: alreadyRated },
            }, {
                $set: { "ratings.$.star": star, "ratings.$.comment": comment },
            },
                {
                    new: true,
                }
            );
        } else {
            const rateProduct = await Product.findByIdAndUpdate(prodId, {
                $push: {
                    ratings: {
                        star: star,
                        comment: comment,
                        postedby: _id,
                    },
                },
            },
                {
                    new: true,
                });
        }

        const getallratings = await Product.findById(prodId);

        let totalRating = getallratings.ratings.length;

        let ratingsum = getallratings.ratings.map((item) => item.star)
            .reduce((prev, curr) => prev + curr, 0);

        let actualRating = Math.round(ratingsum / totalRating);

        let finalproduct = await Product.findByIdAndUpdate(prodId, {
            totalrating: actualRating,
        },
            {
                new: true
            });
        res.json(finalproduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});

const uploadImages = asyncHandler(async (req, res) => {
    try {
        const uploader = (path) => cloudinaryUploadImg(path, "images");
        console.log(req.urls);
        const urls = [];
        console.log(req.files);
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files were uploaded." });
        }

        for (const file of files) {
            const { path } = file;
            const newpath = await uploader(path);
            console.log("Uploaded:", newpath);
            urls.push(newpath);
            fs.unlinkSync(path);
        }

        const images = urls.map((file) => file);
        res.json(images);
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "An error occurred while uploading images." });
    }
});

const deleteImages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = cloudinaryDeleteImg(id, "images");
        res.json({message: "Deleted"});
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }

});





module.exports = {
    createProduct,
    getaProduct,
    getAllProduct,
    updateProduct,
    deleteProduct,
    addToWishlist,
    rating,
    uploadImages,
    deleteImages
};