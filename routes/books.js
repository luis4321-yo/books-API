const express = require('express');
const router = express.Router();
const openLibrary = require('../services/openLibrary');
const googleBooks = require('../services/googleBooks');
const rateLimiter = require('../services/rateLimiter');

function classifyBook(book) {
  const rating = book.rating;
  const price = book.price;

  if (rating === null && price === null) return 'Insufficient Data';
  if (rating !== null && rating >= 4.0 && price !== null && price < 15) return 'High Value';
  if (rating !== null && rating >= 4.0) return 'Highly Rated';
  if (price !== null && price < 10) return 'Budget Pick';
  if (rating !== null && rating < 3.0) return 'Mixed Reviews';
  return 'Standard';
}

function formatPrice(price, currency) {
  if (price === null || price === undefined) return 'Not for sale';
  return `${currency || 'USD'} ${price.toFixed(2)}`;
}

router.get('/', (req, res) => {
  res.render('index', { query: '' });
});

router.get('/search', rateLimiter({ windowMs: 60_000, maxRequests: 20 }), async (req, res) => {
  const query = (req.query.q || '').trim();

  if (!query) {
    return res.render('index', { query: '' });
  }

  try {
    const books = await openLibrary.searchBooks(query, 10);

    if (books.length === 0) {
      return res.render('results', {
        query,
        books: [],
        empty: true
      });
    }

    const isbns = books.map(b => b.isbn).filter(Boolean);
    const priceData = await googleBooks.getBooksByIsbns(isbns);

    const priceMap = new Map(priceData.map(p => [p.isbn, p]));

    const merged = books.map(book => {
      const priceInfo = book.isbn ? priceMap.get(book.isbn) : null;

      const combined = {
        title: book.title,
        authors: book.authors,
        firstPublishedYear: book.firstPublishedYear,
        pageCount: book.pageCount,
        rating: book.rating,
        ratingsCount: book.ratingsCount,
        coverUrl: book.coverUrl,
        price: priceInfo?.price ?? null,
        currency: priceInfo?.currency ?? null,
        saleability: priceInfo?.saleability ?? 'UNKNOWN',
        categories: priceInfo?.categories ?? null,
        previewLink: priceInfo?.previewLink ?? null
      };

      combined.classification = classifyBook(combined);
      combined.priceDisplay = formatPrice(combined.price, combined.currency);
      combined.available = combined.saleability === 'FOR_SALE';

      return combined;
    });

    res.render('results', {
      query,
      books: merged,
      empty: false
    });

  } catch (err) {
    console.error('Search error:', err.message);

    let userMessage = 'Something went wrong while searching. Please try again.';

    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      userMessage = 'The book service took too long to respond. Please try again.';
    } else if (err.response?.status === 429) {
      userMessage = 'The book service is rate limiting us. Please wait a moment.';
    } else if (err.response?.status >= 500) {
      userMessage = 'The book service is temporarily unavailable.';
    } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      userMessage = 'Could not connect to the book service. Check your network.';
    }

    res.status(500).render('error', {
      message: userMessage,
      canRetry: true,
      query
    });
  }
});

module.exports = router;
