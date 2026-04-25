const axios = require('axios');

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';

async function getBookByIsbn(isbn) {
  if (!isbn) return null;

  try {
    const response = await axios.get(GOOGLE_BOOKS_BASE, {
      params: {
        q: `isbn:${isbn}`,
        maxResults: 1
      },
      timeout: 8000
    });

    const items = response.data?.items;
    if (!Array.isArray(items) || items.length === 0) return null;

    const book = items[0];
    const saleInfo = book.saleInfo || {};
    const volumeInfo = book.volumeInfo || {};

    return {
      isbn: isbn,
      saleability: saleInfo.saleability || 'NOT_FOR_SALE',
      price: saleInfo.listPrice ? saleInfo.listPrice.amount : null,
      currency: saleInfo.listPrice ? saleInfo.listPrice.currencyCode : null,
      categories: Array.isArray(volumeInfo.categories) ? volumeInfo.categories.slice(0, 2).join(', ') : null,
      previewLink: volumeInfo.previewLink || null,
      googleRating: volumeInfo.averageRating || null
    };
  } catch (err) {
    console.warn(`Google Books lookup failed for ISBN ${isbn}:`, err.message);
    return null;
  }
}

async function getBooksByIsbns(isbns) {
  const results = await Promise.all(isbns.map(isbn => getBookByIsbn(isbn)));
  return results.filter(r => r !== null);
}

module.exports = { getBookByIsbn, getBooksByIsbns };
