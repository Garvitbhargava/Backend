
const express= require("express");
const { authMiddleware,isAdmin } =require("../middlewares/authMiddleware");
const { create } = require("../models/userModel");
const { createBlog, 
    updateBlog,
     getBlog,
      getAllBlogs, 
      deleteBlog, 
      LikeBlog, 
      DislikeBlog } = require("../controller/blogCtrl");
const { blogImgResize, uploadPhoto } = require("../middlewares/uploadImages");
const { uploadImages } = require("../controller/blogCtrl");
const router = express.Router();


router.post('/',authMiddleware,isAdmin,createBlog);
router.put("/upload/:id",authMiddleware,
isAdmin,
uploadPhoto.array("images",2),
blogImgResize,
uploadImages);
router.put('/Likes',authMiddleware,LikeBlog);
router.put('/dislikes',authMiddleware,DislikeBlog);
router.put('/:id',authMiddleware,isAdmin,updateBlog);
router.get('/:id',getBlog);
router.get('/',getAllBlogs);
router.delete('/:id',authMiddleware,isAdmin,deleteBlog);


module.exports = router;