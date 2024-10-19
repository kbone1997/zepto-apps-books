const API_URL = "https://gutendex.com/books"
const ITEMS_PER_PAGE = 32;
const notFoundImage = "assets/pngwing.com.png";


// Fetch books with pagination support
async function fetchBooks(page = 1)
{
    const url = `${API_URL}/?page=${page}`;
    var loadingDiv = document.getElementById('loader');
    loadingDiv.style.visibility = "visible"
    const bookList = document.getElementById("book-list");
    bookList.innerHTML = ''; // Clear any existing content
    try
    {
        const response = await fetch(url);
        const data = await response.json();

        // Check if there are books to display
        if (data.results.length === 0)
        {
            return { results: [], count: 0 };
        }

        loadingDiv.style.visibility = "hidden"
        // Save books in localStorage
        localStorage.setItem('latestBooks', JSON.stringify(data.results));
        localStorage.setItem('totalPages', Math.ceil(data.count / ITEMS_PER_PAGE));
        // Return the books and total count
        return {
            results: data.results,
            count: data.count,  // Total count from the API
            totalPages: Math.ceil(data.count / ITEMS_PER_PAGE) // Correctly calculate total pages
        };
    } catch (error)
    {
        console.error('Error fetching books:', error);
        return { results: [], count: 0 }; // Return empty if there's an error
    }
}




// Save a book to the wishlist in localStorage
function addToWishlist(book)
{
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    // Check if the book is already in the wishlist
    if (wishlist.some(item => item.id === book.id))
    {
        alert('This book is already in your wishlist!');
        return;
    }

    wishlist.push(book);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    alert('Book added to wishlist!');
}

function renderBooks(books, containerId)
{
    const bookList = document.getElementById(containerId);
    bookList.innerHTML = ''; // Clear any existing content

    books.forEach(book =>
    {
        const authorName = book.authors.map(author => author.name).join(', ');
        const truncatedAuthor = authorName.length >= 25 ? authorName.slice(0, 25) + '...' : authorName;
        const imageUrl = book.formats && book.formats["image/jpeg"] ? book.formats["image/jpeg"] : notFoundImage; // Provide a default image URL
        const truncatedTitle = book.title.length > 30 ? book.title.slice(0, 30) + '...' : book.title;
        const bookElement = document.createElement('div');
        bookElement.classList.add('book');

        // Check if the book is already in the wishlist
        const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const isInWishlist = wishlist.some(item => item.id === book.id);

        // Define the icon color based on the wishlist status
        const iconColor = isInWishlist ? 'style="color:red"' : 'style="color:white"';

        bookElement.innerHTML = `
            <div class="book-inner">
                <!-- Front Side -->
                <div class="book-front">
                    <p class="book-title">${truncatedTitle}</p>
                    <img class="cover-image" src="${imageUrl}" alt="Book Cover" />
                    <p>Author: ${truncatedAuthor}</p>
                </div>
                <!-- Back Side -->
                <div class="book-back">
                    <p><strong>Title:</strong> ${book.title}</p>
                    <p><strong>Author:</strong> ${authorName}</p>
                    <p><strong>Genre:</strong> ${book.subjects ? book.subjects[0] : 'Unknown'}</p>
                    <p><strong>ID:</strong> ${book.id}</p>
                </div>
            </div>
            <div class="book-footer">
                <a class="book-footer-text" href="book.html?id=${book.id}">Show Details</a>
                <button class="wishlist-btn">
                    <i class="fa fa-heart-o" ${iconColor}></i>
                </button>
            </div>
        `;

        // Prevent book flip when interacting with book-footer (links or buttons)
        const bookFooter = bookElement.querySelector('.book-footer');
        bookFooter.addEventListener('click', (event) =>
        {
            event.stopPropagation(); // Prevent flip on book-footer click
        });

        // Add event listener to add/remove book to/from wishlist
        bookElement.querySelector('.wishlist-btn').addEventListener('click', (event) =>
        {
            event.stopPropagation(); // Prevent book flip when clicking wishlist button
            const icon = bookElement.querySelector('.wishlist-btn i');
            if (isInWishlist)
            {
                icon.style.color = 'white';
                // Remove from wishlist
                removeFromWishlist(book.id);
                alert('Book removed from wishlist!');
            } else
            {
                icon.style.color = 'red';
                // Add to wishlist
                addToWishlist({
                    id: book.id,
                    title: book.title,
                    authors: book.authors,
                    formats: {
                        "image/jpeg": book.formats["image/jpeg"]
                    },
                    subjects: book.subjects
                });
            }
        });

        bookList.appendChild(bookElement);
    });
}

// Render pagination with only "Previous" and "Next" buttons
function renderPagination(currentPage, totalPages)
{
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // Clear existing pagination

    // Helper to create a button
    const createPageButton = (text, pageNumber, disabled = false) =>
    {
        const pageElement = document.createElement('button');
        pageElement.textContent = text;
        pageElement.classList.add('page-btn');
        pageElement.disabled = disabled; // Disable the button if needed
        pageElement.addEventListener('click', () =>
        {
            loadBooks(pageNumber); // Load the selected page
        });
        pagination.appendChild(pageElement);
    };

    // "Previous Page" button
    if (currentPage > 1)
    {
        createPageButton('<', currentPage - 1);
    }

    // "Next Page" button
    if (currentPage < totalPages)
    {
        createPageButton('>', currentPage + 1);
    }
}

// Load wishlist books from localStorage
function loadWishlist()
{
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    console.log(wishlist)
    renderBooks(wishlist, 'wishlist');
}


// Initialize based on the current page
document.addEventListener('DOMContentLoaded', () =>
{
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '')
    {
        loadBooksFromLocalStorage();  // Load books for the home page
    } else if (currentPage === 'wishlist.html')
    {
        loadWishlist();  // Load wishlist books from localStorage
    } else if (currentPage === 'book.html')
    {
        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');
        fetchBookDetails(bookId);
    }
});

// Add event listeners to genre dropdown items
document.querySelectorAll('.dropdown-content p').forEach(item =>
{
    item.addEventListener('click', function ()
    {
        const selectedGenre = this.getAttribute('data-topic'); // Get the genre from the data-topic attribute
        searchBooksByTopic(selectedGenre); // Perform the search with the selected genre
    });
});

document.getElementById('search-btn').addEventListener('click', async function ()
{
    const query = document.getElementById('search-input').value.trim();

    if (query)
    {
        // Encode the query to make it URL-friendly
        const encodedQuery = encodeURIComponent(query);
        // Construct the search URL
        const searchUrl = `${API_URL}?search=${encodedQuery}`;
        var loadingDiv = document.getElementById('loader');
        loadingDiv.style.visibility = "visible"
        const bookList = document.getElementById("book-list");
        bookList.innerHTML = ''; // Clear any existing content

        try
        {
            const response = await fetch(searchUrl);
            const data = await response.json();

            // Check if there are books to display
            if (data.results.length === 0)
            {
                return { results: [], count: 0 };
            }

            loadingDiv.style.visibility = "hidden"
            const totalPages = Math.ceil(data.count / ITEMS_PER_PAGE);
            // Save books in localStorage
            localStorage.setItem('latestBooks', JSON.stringify(data.results));
            localStorage.setItem('totalPages', totalPages);

            console.log(totalPages)
            // Return the books and total count
            renderBooks(data.results, 'book-list', 1);
            if (totalPages > 1)
            {
                renderPagination(page, totalPages);
            }
        } catch (error)
        {
            console.error('Error fetching books:', error);
            return { results: [], count: 0 }; // Return empty if there's an error
        }
    } else
    {
        console.log('Please enter a search query');
    }
});

// Render books with pagination support for wishlist
function renderWishlistBooks(books, page, perPage = 10)
{
    const paginatedBooks = books.slice((page - 1) * perPage, page * perPage);
    renderBooks(paginatedBooks, 'wishlist');
    renderPagination(page, Math.ceil(books.length / perPage));
}

// Function to remove a book from the wishlist
function removeFromWishlist(bookId)
{
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    wishlist = wishlist.filter(item => item.id !== bookId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Function to search for books by topic
function searchBooksByTopic(topic)
{
    const apiUrl = `${API_URL}/?topic=${encodeURIComponent(topic)}`; // Assuming your API endpoint looks like this
    // You can add a loading spinner or some UI feedback while the data is being fetched
    var loadingDiv = document.getElementById('loader');
    loadingDiv.style.visibility = "visible"
    const bookList = document.getElementById("book-list");
    bookList.innerHTML = '';

    fetch(apiUrl)
        .then(response => response.json())
        .then(data =>
        {
            document.getElementById('loader').style.display = 'hidden'; // Hide loader once data is fetched
            localStorage.setItem('latestBooks', JSON.stringify(data.results));
            renderBooks(data.results, 'book-list'); // Assuming you already have a renderBooks function
        })
        .catch(error =>
        {
            document.getElementById('loader').style.display = 'hidden';
            console.error('Error fetching books:', error);
        });
}

// Render books from localStorage if available
function loadBooksFromLocalStorage()
{
    const savedBooks = localStorage.getItem('latestBooks');
    const savedPages = localStorage.getItem('totalPages');

    if (savedBooks)
    {
        const books = JSON.parse(savedBooks);
        const totalPages = parseInt(savedPages, 10);
        console.log('Loading books from localStorage');

        renderBooks(books, 'book-list'); // Render books
        renderPagination(1, totalPages);
    }
    else
    {
        console.log('No books found in localStorage, fetching from API');
        loadBooks(1); // Fetch from API if no books in localStorage
    }
}

// Fetch and display book details
async function fetchBookDetails(bookId)
{
    const bookDetailsUrl = `${API_URL}?ids=${bookId}`; // Assuming your API URL supports fetching a book by its ID

    try
    {
        const response = await fetch(bookDetailsUrl);
        const book = await response.json();

        console.log(book)
        // Render the book details
        renderBookDetails(book.results[0]);
    } catch (error)
    {
        console.error('Error fetching book details:', error);
    }
}

// Function to render book details on the page
function renderBookDetails(book)
{
    const bookDetailsDiv = document.getElementById('book-details');

    const authorName = book.authors.map(author => author.name).join(', ');
    const bookDetailsHTML = `
        <div class="book-details-container">
            <div class="book-cover">
                <img src="${book.formats && book.formats['image/jpeg'] ? book.formats['image/jpeg'] : notFoundImage}" alt="Book Cover" class="book-cover-image" />
            </div>
            <div class="book-info">
                <h2>Title:${book.title}</h2>
                <p><strong>Author:</strong> ${authorName}</p>
                <p><strong>Genre:</strong> ${book.subjects ? book.subjects[0] : 'Unknown'}</p>
                <p><strong>ID:</strong> ${book.id}</p>
                <p>${book.description || 'No description available.'}</p>
            </div>
        </div>
    `;

    bookDetailsDiv.innerHTML = bookDetailsHTML;
}

// Load a single book by ID
async function loadBooks(page = 1)
{
    const data = await fetchBooks(page);
    const totalPages = Math.ceil(data.count / ITEMS_PER_PAGE);  // Total number of pages

    renderBooks(data.results, 'book-list', page);
    renderPagination(page, totalPages);
}

