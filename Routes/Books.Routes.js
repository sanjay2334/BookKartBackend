const routes = require('express');
const router = routes.Router();
const {
    createBook,
    getAllBooks,
    getBookById,
    deleteBook
} = require('../Controller/Books.controller') 

router.post('/create',createBook);
router.get('/getAll',getAllBooks);
router.get('/getOne/:id',getBookById);
router.delete('/delete/:id',deleteBook);

module.exports = router