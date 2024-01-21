import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken};
    } catch (error) {
        console.log(error);
        throw new APIError(500, "Something went wrong while generating access and refresh Tokens");
    }
}

const registerUser = asyncHandler( async (req, res) => {
    const {name, email, password} = req?.body;

    if(!name || !email || !password){
        throw new APIError(400, "All fileds are required!");
    }

    const isUserExists = await User.findOne({email: email});

    if(isUserExists){
        throw new APIError(400, "User exists with same email!");
    }

    const user = await User.create({
        name: name,
        email: email,
        password: password
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    res.status(201).json(
        new APIResponse(201, createdUser, "User registered successfully!")
    );
});


const loginUser = asyncHandler (async (req, res) => {
    const {email, password} = req?.body;

    if(!email || !password){
        throw new APIError(400, "All fields are required!");
    }

    const user = await User.findOne({email});

    if(!user){
        throw  new APIError(401, "User does not exists!");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new APIError(401, "Invalid user password!!");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    
    const options = {
        //secure true -> only server can modify the cookies not client (i.e. from frontend)
        httpOnly: true,
        secure: true
   };

     res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(
          new APIResponse(
               200,
               {
                    // we need to pass token explicitly so that user can save it local storage or in mobile apps(no set cookies concept there)
                    user: loggedInUser,
                    accessToken,
                    refreshToken
               },
               "User logged in successfully!"
          )
     );

});

 const logoutUser = asyncHandler ( async (req, res) => {
    const userId = req.user._id;
    
    await User.findByIdAndUpdate(userId,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }  
    );

    const options = {
        httpOnly: true,
        secure: true
    };
    
    res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new APIResponse(201, {}, "User logged out successfully!")
    );

});


const refreshAccessToken = asyncHandler ( async (req, res) => {
    // for mobile apps refreshToken from req.body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
         throw new APIError(401, "Unauthorized request!")
    }

    try {
              // verifying the incomingToken
              const decodedToken = jwt.verify(
                   incomingRefreshToken, 
                   process.env.REFRESH_TOKEN_SECRET
              );

              // console.log("decodedToken: ", decodedToken);
         
              const user = await User.findById(decodedToken?._id);
         
              // getting saved refresh token from user details
              if(!user){
                   throw new APIError(401, "Invalid refresh token")
              }
          
              if(incomingRefreshToken !== user?.refreshToken){
                   throw new APIError(401, "Refresh token has expired or used!")
              }
         
              const options = {
                   httpOnly: true,
                   secure: true
              };
         
              const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    
              return res
                   .status(200)
                   .cookie("accessToken", accessToken, options)
                   .cookie("refreshToken", refreshToken, options)
                   .json(
                        new APIResponse(
                                  200, 
                                  {
                                       accessToken,
                                       refreshToken
                                  },
                                  "Access token refreshed successfully!"
                             )
                   )
    } catch (error) {
         console.log(error?.message || "Invalid refresh token");
    }
});


export {registerUser, loginUser, logoutUser, refreshAccessToken};