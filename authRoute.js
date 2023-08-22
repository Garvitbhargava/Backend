const express = require("express");
const { createUser,
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
    getwishlist,
    getWishlist,
    saveAddress,
    userCart,
    getUserCart,
    emptyCart,
    applyCoupon,
    createOrder,
    getOrders,
    updateOrderStatus,
} = require("../controller/userCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();
createUser
router.post("/register", createUser);
router.post("/forgot-password-token",forgotPasswordToken);

router.put("/reset-password/:token",resetPassword);
router.put("/order/update-order/:id",authMiddleware,isAdmin,updateOrderStatus);

router.put("/password", authMiddleware,updatePassword);

router.post("/login", loginUserCtrl);
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware,userCart);
router.post("/cart/applycoupon",authMiddleware,applyCoupon);
router.post("/cart/cash-order",authMiddleware,createOrder)

router.get('/all-Users', getallUser);
router.get("/get-orders",authMiddleware,getOrders);
router.get("/refresh", handelrefreshToken);
router.get("/logout",logout);
router.get('/wishlist', authMiddleware,getWishlist);
router.get('/cart', authMiddleware,getUserCart);
router.get('/:id', authMiddleware,isAdmin, getUser);
router.delete("/empty",authMiddleware,emptyCart);
router.delete("/:id", deleteaUser);

router.put("/edit-user", authMiddleware, updatedUser);
router.put("/save-address", authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);
module.exports = router;