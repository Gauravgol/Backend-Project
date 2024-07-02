import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateUserDetails, updateAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import {upload} from '../middleware/multer.middleware.js'
import { verifyJWT } from "../middleware/auth.middleware.js";
import multer from "multer";

const router=Router()

router.route('/register').post(
upload.fields([
{
    name:"avatar",
    maxCount:1
},
{
    name:"coverImage",
    maxCount:1
}
]),
registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("update-account").patch(verifyJWT,updateUserDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)
router.patch("/cover-image" ,verifyJWT,upload.single("coverimage"),updateUserCoverImage)

router.get("/c/:username",verifyJWT,getUserChannelProfile)
router.get("/history",verifyJWT,getWatchHistory)

export default router