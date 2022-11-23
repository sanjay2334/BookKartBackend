const Books = require('../Model/Book.model');

async function createBook(req,res){
    try{
        const book = new Books({
            name:req.body.name,
            Author:req.body.Author,
            description:req.body.description,
            genre:req.body.genre,
            releasedDate:req.body.releasedDate
        })
        const resu = await book.save();
        res.status(200).json({message:"Book created successfully",data : resu});
        console.log("doneeee😁");
    }catch(err){
        console.log(err);
    }
}

async function getAllBooks(req,res){
    try{
        const books = await Books.find();
        res.status(200).json({message:"Books fetched successfully",data : books});
    }catch(err){
    console.log(err);
    }
}

async function getBookById(req,res){
    const {id} = req.params;
    try{
        const book = await Books.findById(id);
        res.status(200).json({message:"Book fetched successfully",data : book});
    }catch(err){
        console.log(err);
    }
}

async function deleteBook(req,res){
    const {id} = req.params;
    try{
        const book = await Books.findByIdAndDelete(id);
        res.status(200).json({message:"Book deleted successfully",data : book});
    }catch(err){
        console.log(err);
    }
}

module.exports = {
    createBook,
    getAllBooks,
    getBookById,
    deleteBook
}