import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controller/user.controller.js";

const router = Router();

router.route("/login").post(loginUser);
router.route("/register").post(registerUser);

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);


export default router;