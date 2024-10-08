import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler( async (req, res) =>{
    // get user details from frontend 
    // validation - not empty
    // check if user already exists : check using username and email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return res
    const {fullname, email, username, password} = req.body;
    // console.log("email:", email);

    if(
        [fullname, email, username, password].some((field) => 
            field?.trim() ==="")
    ){
        throw new ApiError(400, "Please fill all fields");
    }

    const existeduser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existeduser){
        throw new ApiError(409, "Username or email already exists")
    }
    // console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Please upload an avatar")
    }

    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Please upload an avatar")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-passowrd -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the User")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})

export { registerUser }