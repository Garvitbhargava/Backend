const Blog =require("../models/blogModel");
const User =require("../models/userModel");
const asynHandler = require ("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbid");
const cloudinaryUploadingImg=require("../utils/cloudinary");
const fs = require("fs");




const createBlog = asynHandler(async (req,res) => {
try{
const newBlog =await Blog.create(req.body);
res.json({
    status: "success",
    newBlog,
});
}catch (error){
    throw new Error(error);
}
});

const updateBlog = asynHandler(async (req,res) => { 
    const { id } = req.params;
    validateMongoDbId(id);
    try{
    const updateBlog =await Blog.findByIdAndUpdate(id, req.body, { 
        new:true,});
    res.json(updateBlog);
    }catch (error){
        throw new Error(error);
    }
    });

    const getBlog = asynHandler(async (req,res) => { 
        const { id } = req.params;
        validateMongoDbId(id);
        try{
        const getBlog =await Blog.findById(id)
        .populate("likes")
        .populate("dislikes");
        await Blog.findByIdAndUpdate(id,{
            $inc : { numViews :1},
        },
        {new:true}
        );
        res.json(getBlog);
        }catch (error){
            throw new Error(error);
        }
        });

        const getAllBlogs = asynHandler(async (req,res) => {
            try{
                const getBlogs =await Blog.find();
                res.json(getBlogs);
            }
            catch(error){
                throw new Error(error);
            }
        });
        
        const deleteBlog = asynHandler(async (req,res) => { 
            const { id } = req.params;
            validateMongoDbId(id);
            try{
            const deleteBlog =await Blog.findByIdAndDelete(id) 
            res.json(deleteBlog);
            }catch (error){
                throw new Error(error);
            }
            });
//liked blog
            const LikeBlog = asynHandler(async (req, res) => {
                const { blogId } = req.body;
                validateMongoDbId(blogId);
              
                // Find the blog which you want to be liked
                const blog = await Blog.findById(blogId);
              
                // Find the login user
                const loginUserId = req?.user?._id;
              
                // Find if the user has liked the blog
                const isLiked = blog?.isLiked;
              
                // Find if the user has disliked the blog
                const alreadyDisliked = blog?.dislikes?.find(
                    (userId) => userId?.tostring() === loginUserId?.tostring()
                );
              
                try {
                  if (alreadyDisliked) {
                    await Blog.findByIdAndUpdate(blogId, {
                      $pull: { dislikes: loginUserId },
                      isDisliked: false,
                    }, { new: true });
                  }
              
                  if (isLiked) {
                    await Blog.findByIdAndUpdate(blogId, {
                      $pull: { Likes: loginUserId },
                      isLiked: false,
                    }, { new: true });
                  } else {
                    await Blog.findByIdAndUpdate(blogId, {
                      $push: { Likes: loginUserId },
                      isLiked: true,
                    }, { new: true });
                  }
              
                  // Fetch and return the updated blog after the modifications
                  const updatedBlog = await Blog.findById(blogId);
                  res.json(updatedBlog);
                } catch (error) {
                  console.error(error);
                  res.status(500).json({ message: 'Internal server error' });
                }
              });

   //dislike blog
   
   const DislikeBlog = asynHandler(async (req, res) => {
    const { blogId } = req.body;
    validateMongoDbId(blogId);
  
    // Find the blog which you want to be liked
    const blog = await Blog.findById(blogId);
  
    // Find the login user
    const loginUserId = req?.user?._id;
  
    // Find if the user has liked the blog
    const isDisliked = blog?.isDisliked;
  
    // Find if the user has disliked the blog
    const alreadyliked = blog?.likes?.find(
        (userId) => userId?.tostring() === loginUserId?.tostring()
    );
  
    try {
      if (alreadyliked) {
        await Blog.findByIdAndUpdate(blogId, {
          $pull: { likes: loginUserId },
          isliked: false,
        }, { new: true });
      }
  
      if (isDisliked) {
        await Blog.findByIdAndUpdate(blogId, {
          $pull: { disLikes: loginUserId },
          isDisliked: false,
        }, { new: true });
      } else {
        await Blog.findByIdAndUpdate(blogId, {
          $push: { dislikes: loginUserId },
          isDisliked: true,
        }, { new: true });
      }
  
      // Fetch and return the updated blog after the modifications
      const updatedBlog = await Blog.findById(blogId);
      res.json(updatedBlog);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const uploadImages = asynHandler(async (req,res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const uploader = (path) => cloudinaryUploadingImg(path, "images");
      const urls = [];
      console.log(req.files,"tyyyyyyyyyyyyyyy");
      const files = req.files;
      for (const file of files) {
        const { path } = file;
        const newpath = await uploader(path);
        console.log(newpath);
        urls.push(newpath);
        fs.unlinkSync(path);
      }console.log(req.files);
      const findBlog = await Blog.findByIdAndUpdate(
        id,
        {
          images: urls.map((file) => {
            return file;
          }),
        },
        {
          new: true,
        }
      );
      res.json(findBlog);
    } catch (error) {
      throw new Error(error);
    }
  });
              

module.exports = { 
    createBlog, 
    updateBlog, 
    getBlog, 
    getAllBlogs,
     deleteBlog,
     LikeBlog,
    DislikeBlog,
  uploadImages};