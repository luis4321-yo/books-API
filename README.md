# Books & Prices App

## 1. Project Description

This is a simple web app that helps users search for books and see their prices in one place.

When a user types a search word (like "harry potter" or "tolkien"), the app finds books that match. For each book, it shows useful info like the author, page count, and rating. It also shows the price and if the book is for sale.

The cool part is that this info comes from **two different websites (APIs)**. The app gets the data from both, mixes it together, and shows it to the user as one clean list of book cards.

---

## 2. APIs Used

**Open Library Search API**
- Link: https://openlibrary.org/dev/docs/api/search
- This is a free book database run by the Internet Archive. We use it to get book titles, authors, publishing year, page count, ratings, and cover images. No API key is needed.

**Google Books API**
- Link: https://developers.google.com/books/docs/v1/using
- This is Google's book service. We use it to get the price of a book, if it is for sale, and the categories it belongs to. No API key is needed for basic searches.

---

## 3. Setup Instructions

**Step 1: Use Node.js**

**Step 2: Get the project files**

Unzip the project folder and open it in your terminal:

```bash
cd books-prices-app
```

**Step 3: Npm Install**


**Step 4: Run the app**

Start the server with this command:

```bash
npm start
```

**Step 5: Open the app**

Open your web browser and go to:

```
http://localhost:3000
```

Type a search word in the box and press the search button. That's it!

---

## 4. Data Integration Explanation

This app joins data from two APIs using the **ISBN** as the shared key.

**What is an ISBN?** It's a unique number that every book has, like a fingerprint. Two books can have the same title, but they will never have the same ISBN. This makes it perfect for matching data.

**How the join works:**

First, the app calls the Open Library API with the user's search word. This gives back a list of books with their titles, authors, ratings, and ISBNs.

Next, the app takes the ISBN from each book and calls the Google Books API. This returns the price and availability for that ISBN. We do all these calls **at the same time** using `Promise.all` to make it fast.

Then, the app puts the two results together. It uses a `Map` (which works like a phone book) to look up the price for each book by its ISBN. The book and its price get merged into one object.

Finally, the app adds a **computed field** called `classification`. This is a label that the app creates by looking at both the rating and the price together. For example:

- Rating 4.5 + Price $9 = "High Value"
- Rating 4.2 + Price $25 = "Highly Rated"
- Rating 3.8 + Price $7 = "Budget Pick"
- Rating 2.5 + any price = "Mixed Reviews"

**Short example:**

Open Library returns:
```
{ title: "Dune", isbn: "0441172717", rating: 4.3 }
```

Google Books returns:
```
{ isbn: "0441172717", price: 9.99, saleability: "FOR_SALE" }
```

After joining and adding the computed field:
```
{
  title: "Dune",
  rating: 4.3,
  price: 9.99,
  available: true,
  classification: "High Value"
}
```

This combined object is what gets shown on the book card.

---

## 5. Known Limitations

**Missing features:**
- No user accounts or saved searches.
- No way to sort or filter results (for example, by price or rating).
- No pagination. The app only shows the first 10 results.
- Prices are shown in whatever currency Google Books returns. There is no currency conversion.

**API constraints:**
- Google Books does not have prices for every book. Many older or less popular books show "Not for sale".
- Open Library ratings can be missing or based on very few reviews, which makes them less trustworthy.
- Both APIs are free and have rate limits. If too many people use the app at once, requests may slow down or fail.
- The app has its own rate limit of 20 searches per minute per user to protect the APIs.

**Edge cases:**
- If a book has no ISBN in Open Library, we cannot look up its price. The card will still show, but the price field will say "Not for sale".
- If the same book has many editions, the API may return the wrong edition's price.
- Very short search words (like "a") may return random results.
- If the network is slow, requests time out after 8 seconds and show a friendly error with a retry button.
