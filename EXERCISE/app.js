const express = require('express');
const app = express();
const port = 8000;

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let books = [
  { id: 1, title: 'The Alchemist', author: 'Paulo Coelho', year: 1988 },
  { id: 2, title: 'The Prophet', author: 'Kahlil Gibran', year: 1923 },
];

app.get('/books', (req, res) => {
  const { author, year } = req.query;
  let filteredBooks = [...books];

  if (author) {
    filteredBooks = filteredBooks.filter(b => 
      b.author.toLowerCase().includes(author.toLowerCase())
    );
  }

  if (year) {
    filteredBooks = filteredBooks.filter(b => b.year === parseInt(year));
  }

  res.render('books', { books: filteredBooks });
});

app.get('/api/books/:id', (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).send('Book not found');
  res.json(book);
});


app.post('/books', (req, res) => {
  const newBook = {
    id: books.length + 1,
    title: req.body.title,
    author: req.body.author,
    year: parseInt(req.body.year)
  };
  books.push(newBook);
  res.redirect('/books'); 
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});