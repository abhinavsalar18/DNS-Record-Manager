import mongoose, { MongooseError } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true
        },

        password: {
            type: String,
            required: true
        },

        refreshToken:{
            type: String
        }
    }
);

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
})
// metjod for checking whether password is correct or not
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password);
}


userSchema.methods.generateAccessToken = function () {
    try {
        const accessToken = jwt.sign(
            {
                _id: this._id,
                email: this.email,
                name: this.name
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        );

        return accessToken
    } catch (error) {
         console.log("Error while geerating access token! ", error);
    }
};

userSchema.methods.generateRefreshToken = function () {
    try {
        const refreshToken = jwt.sign(
            {
                _id: this._id
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        );

        return refreshToken;
    } catch (error) {
        console.log("Error while generating refresh token! ", error);
    }
    return null;
};

export const User = mongoose.model('User', userSchema);