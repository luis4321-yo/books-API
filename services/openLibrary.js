const axios = require('axios');

const OPEN_LIBRARY_BASE = 'https://openlibrary.org';

async function searchBooks(query, limit = 10) {
  const response = await axios.get(`${OPEN_LIBRARY_BASE}/search.json`, {
    params: {
      q: query,
      limit: limit,
      fields: 'key,title,author_name,first_publish_year,isbn,number_of_pages_median,ratings_average,ratings_count,cover_i'
    },
    timeout: 8000
  });

  if (!response.data || !Array.isArray(response.data.docs)) {
    return [];
  }

  return response.data.docs.map(doc => ({
    title: doc.title || 'Unknown Title',
    authors: Array.isArray(doc.author_name) ? doc.author_name.slice(0, 2).join(', ') : 'Unknown',
    firstPublishedYear: doc.first_publish_year || null,
    pageCount: doc.number_of_pages_median || null,
    rating: doc.ratings_average ? Number(doc.ratings_average.toFixed(2)) : null,
    ratingsCount: doc.ratings_count || 0,
    // Use first ISBN as the join key
    isbn: Array.isArray(doc.isbn) && doc.isbn.length > 0 ? doc.isbn[0] : null,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null
  }));
}

module.exports = { searchBooks };
