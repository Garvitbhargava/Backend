const req = require("express/lib/request");
const User = require("../models/userModel"); 
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");
const asyncHandler = require("express-async-handler");
const { genrateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbid");
const { genraterefreshToken } = require("../config/refreshtoken");
const crypto = require('crypto');
const jwt = require("jsonwebtoken");

const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const findUser = await User.findOne({ email: email });

    if (!findUser) {
        //create a new user  
        const newUser = User.create(req.body);
        res.json(newUser);
    } else {
        //User already Exists
        throw new Error("User already Exists")
    }
});
//login user
const loginUserCtrl = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    //Check if user exixts or not
    const findUser = await User.findOne({ email });
    if (findUser && (await findUser.isPasswordMatched(password))) {
        const refreshToken = await genraterefreshToken(findUser?.id);
        const updateuser = await User.findByIdAndUpdate(findUser.id, {
            refreshToken: refreshToken,
        },
            { new: true }
        );
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000,
        });
        res.json({
            _id: findUser?._id,
            firstname: findUser?.firstname,
            lastname: findUser?.lastname,
            email: findUser?.email,
            mobile: findUser?.mobile,
            token: genrateToken(findUser?._id),
        });
    } else {
        throw new Error("Invalid Credential");
    }
});

//admin login

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    //Check if user exixts or not
    const findAdmin = await User.findOne({ email });
    if (findAdmin.role !== 'admin') throw new Error("Not Authorised");
    if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
        const refreshToken = await genraterefreshToken(findAdmin?.id);
        const updateuser = await User.findByIdAndUpdate(findAdmin.id, {
            refreshToken: refreshToken,
        },
            { new: true }
        );
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000,
        });
        res.json({
            _id: findAdmin?._id,
            firstname: findAdmin?.firstname,
            lastname: findAdmin?.lastname,
            email: findAdmin?.email,
            mobile: findAdmin?.mobile,
            token: genrateToken(findAdmin?._id),
        });
    } else {
        throw new Error("Invalid Credential");
    }
});
//handel refreeshtoken

const handelrefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    console.log(refreshToken);
    const user = await User.findOne({ refreshToken });
    if (!user) throw new Error('No Refresh token present in db or not matched');
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err || user.id !== decoded.id) {
            throw new Error("There is something wrong with refresh token")
        }
        const accessToken = genrateToken(User?.id)
        res.json({ accessToken });
    });
    res.json(user);

});

//logout Functionality

const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
        });
        return res.sendStatus(204);//forbiden
    }
    await User.findOneAndUpdate(refreshToken, {
        refreshToken: "",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    });
    res.sendStatus(204);//forbiden
});

//Update a user

const updatedUser = asyncHandler(async (req, res) => {
    const { id } = req.user;
    try {
        const updatedUser = await User.findByIdAndUpdate(id, {
            firstname: req?.body?.firstname,
            lastname: req?.body?.lastname,
            email: req?.body?.email,
            mobile: req?.body?.mobile,
        },
            {
                new: true,
            }
        );
        res.json(updatedUser);
    }
    catch (error) {
        throw new Error(error);
    }
});

//save address

const saveAddress = asyncHandler(async (req, res, next) => {
    const { id } = req.user;
    validateMongoDbId(id);
    try {
        const updatedUser = await User.findByIdAndUpdate(id, {
            address: req?.body?.address,
        },
            {
                new: true,
            }
        );
        res.json(updatedUser);
    }
    catch (error) {
        throw new Error(error);
    }

})
//Get all the users

const getallUser = asyncHandler(async (req, res) => {
    try {
        const getUsers = await User.find();
        res.json(getUsers);
    }
    catch (error) {
        throw new Error(error);
    }
});

//Get a single user

const getUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const getUser = await User.findById(id);
        res.json({
            getUser,
        });


    }
    catch (error) {
        throw new Error(error);
    }
});


//delete a user

const deleteaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const deleteaUser = await User.findByIdAndDelete(id);
        res.json({
            deleteaUser,
        });


    }
    catch (error) {
        throw new Error(error);
    }
});

const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const block = User.findByIdAndUpdate(
            id,
            {
                isBlocked: true,
            },
            {
                new: true,
            }
        );
        res.json({
            message: "User Blocked",
        });
    } catch (error) {
        throw new Error(error);
    }
});
const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const unblock = User.findByIdAndUpdate(
            id,
            {
                isBlocked: false,
            },
            {
                new: true,
            }
        );
        res.json({
            message: "User Unblocked",
        });
    } catch (error) {
        throw new Error(error);
    }
});

const updatePassword = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { password } = req.body;
    validateMongoDbId(_id);
    const user = await User.findById(_id);
    if (password) {
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword)
    }
    res.json(user);
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found with this eamil");
    try {
        const token = await user.createPasswordResetToken();
        await user.save();
        const resetURL = `Hi, Please follow this link to reset your Password. This link is valid till 10 min from now.<a 
   href='http://localhost:4000/api/user/reset.password/${token}>click Here</a>`

        const data = {
            to: email,
            text: "hey user",
            subject: "Forgot Password Link",
            html: resetURL,
        };
        sendEmail(data);
        res.json(token);
    }
    catch (error) {
        throw new Error(error);
    }

});

const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const User = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpiers: { $gt: Date.now() },
    });
    if (!user) throw new Error("Token Exoired, Please try again later");
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiers = undefined;
    await user.save();
    res.json(user);
});

const getWishlist = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        const findUser = await User.findById(_id).populate("wishlist");
        res.json(findUser);

    } catch (error) {
        throw new Error(error)
    }
});

const userCart = asyncHandler(async (req, res) => {
    
    const { cart } = req.body;
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
      let products = [];
      const user = await User.findById(_id);
      // check if user already have product in cart
      const alreadyExistCart = await Cart.findOneAndDelete({ orderby: user._id });
      if (alreadyExistCart) {
        alreadyExistCart.remove();
      }
      for (let i = 0; i < cart.length; i++) {
        let object = {};
        object.product = cart[i]._id;
        object.count = cart[i].count;
        object.color = cart[i].color;
        let getPrice = await Product.findById(cart[i]._id).select("price").exec();
        object.price = getPrice.price;
        products.push(object);
      }
      let cartTotal = 0;
      for (let i = 0; i < products.length; i++) {
        cartTotal = cartTotal + products[i].price * products[i].count;
      }
      let newCart = await new Cart({
        products,
        cartTotal,
        orderby: user?._id,
      }).save();
      res.json(newCart);
    } catch (error) {
      throw new Error(error);
    }
  });
  
  const getUserCart = asyncHandler(async (req,res) => {
    const { _id } = req.user;
validateMongoDbId(_id) 
try{
const cart =await Cart.findOne({ orderby: _id }).populate(
    "products.product",
    "_id title price totalAfterDiscount"
    );
res.json(cart);
}catch (error){
    throw new Error(error);
}
});

const emptyCart = asyncHandler(async (req,res) => {
    const { _id }= req.user;
    validateMongoDbId(_id);
    try{
  const user =await User.findOne({ _id });
  const cart= await Cart.findOneAndRemove({ orderby: user._id });
  res.json(cart);
    }catch (error){
        throw new Error(error);
    }
});

const applyCoupon = asyncHandler(async (req, res) =>{
 const { coupon } = req.body ;
 const { _id } = req.user;
 validateMongoDbId(_id);
 const validCoupon = await Coupon.findOne({ name: coupon});
if(validCoupon === null ){
    throw new Error("Invalid Coupon");
} 
const user = await User.findOne({ _id });
let { product ,cartTotal } =await Cart.findOne({  orderby: user._id, }).populate("products.product");
let totalAfterDiscount = ( cartTotal - (cartTotal * validCoupon.discount)/100).toFixed(2);
await Cart.findOneAndUpdate({  orderby: user._id},
    {totalAfterDiscount},
    {new:true}
    );
    res.json(totalAfterDiscount)
});

const createOrder = asyncHandler(async (req, res) => {
    const { COD, couponApplied } = req.body;
    const { _id } = req.user;
    validateMongoDbId(_id);

    try {
        if (!COD) {
            throw new Error("Create cash order failed");
        }

        validateMongoDbId(_id);

        const user = await User.findById(_id); // Use findById to retrieve a user by ID

        const userCart = await Cart.findOne({ orderby: user._id });
        let finalAmount = 0;

        if (couponApplied && userCart.totalAfterDiscount) {
            finalAmount = userCart.totalAfterDiscount;
        } else {
            finalAmount = userCart.cartTotal;
        }

        let newOrder = await new Order({
            products: userCart.products,
            productIntent: {
                id: uniqid(),
                method: "COD",
                amount: finalAmount,
                status: "Cash On Delivery",
                created: Date.now(),
                currency: "usd",
            },
            orderby: user._id,
            orderStatus: "Cash on Delivery",
        }).save();

        const updateOperations = userCart.products.map((item) => {
            return {
                updateOne: {
                    filter: { _id: item.product._id },
                    update: { $inc: { quantity: -item.count, sold: +item.count } },
                },
            };
        });

        const updateResult = await Product.bulkWrite(updateOperations, {});

        res.json({ message: "Success" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
});

const getOrders = asyncHandler(async(req,res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
try{
const userorders= await Order.findOne({ orderby :_id }).populate("products.product").exec();
res.json(userorders);
}catch (error){
    throw new Error(error);
}
});

const updateOrderStatus=asyncHandler(async(req,res) =>{
const {status} =req.body;
const { id }=req.params;
validateMongoDbId(id);
try{
    const updateOrderStatus = await Order.findByIdAndUpdate(id,
        {orderStatus: status,
        paymentIntent:{
            status:status,
        } },
        {
            new:true
        });
        res.json(updateOrderStatus); 
}catch(error){
    throw new Error(error)
}
});



module.exports = {
    createUser,
    loginUserCtrl,
    getallUser,
    getUser,
    deleteaUser,
    updatedUser,
    blockUser,
    unblockUser,
    handelrefreshToken,
    logout,
    updatePassword,
    forgotPasswordToken,
    resetPassword,
    loginAdmin,
    getWishlist,
    saveAddress,
    userCart,
    getUserCart,
    emptyCart,
    applyCoupon,
    createOrder,
    getOrders,
    updateOrderStatus,

};
