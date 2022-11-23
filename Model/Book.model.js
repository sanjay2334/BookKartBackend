const mongoose = require('mongoose');
const Schema =  mongoose.Schema;

const BookSchema = Schema({
    name:{
        type:String,
        required:true
    },
    Author:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    genre:{
        type:String,
        required:true
    },
    // image:{
    //     type:String,
    //     required:true
    // },
    releasedDate:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    isTaken:{
        type:Boolean,
        default:false
    }
})

const Books = mongoose.model('Book',BookSchema);

module.exports = Books;