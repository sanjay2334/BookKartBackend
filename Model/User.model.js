//user schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    booksTaken:{
        type:Array,
        default:[]
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    Otp:{
        type:String,
        default:''
    },
    validTill:{
        type:Date,
        default:Date.now() + 3600000
    },
    isAuth:{
        type:Boolean,
        default:false
    }
})

const Users = mongoose.model('Users',UserSchema);
module.exports = Users;