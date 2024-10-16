const API_URL = "https://gutendex.com/books"
const ITEMS_PER_PAGE = 10;


// Fetch books with pagination support
async function fetchBooks(page = 1)
{
    const ITEMS_PER_PAGE = 10;
    const url = `https://gutendex.com/books/?page=${page}`;
    try
    {
        const response = await fetch(url);
        const data = await response.json();

        // Check if there are books to display
        if (data.results.length === 0)
        {
            return { results: [], count: 0 };
        }

        // Calculate the total number of available pages based on the actual count from API
        const totalPages = Math.ceil(data.count / ITEMS_PER_PAGE);

        // Return the books and total pages
        return {
            results: data.results,
            count: data.count, // Total count from the API
            totalPages: totalPages
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

// Render books on the page with "Add to Wishlist" button
function renderBooks(books, containerId, page = 1)
{
    const bookList = document.getElementById(containerId);
    bookList.innerHTML = '';  // Clear any existing content

    // Calculate the start and end index for the current page
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedBooks = books.slice(startIndex, endIndex);

    paginatedBooks.forEach(book =>
    {
        const bookElement = document.createElement('div');
        bookElement.classList.add('book');
        bookElement.innerHTML = `
        <h3>${book.title}</h3>
        <p>Author: ${book.authors.map(author => author.name).join(', ')}</p>
        <a href="book.html?id=${book.id}">View Details</a>
        <button class="wishlist-btn">Add to Wishlist</button>
      `;

        // Add event listener to add book to wishlist
        bookElement.querySelector('.wishlist-btn').addEventListener('click', () =>
        {
            addToWishlist({
                id: book.id,
                title: book.title,
                authors: book.authors.map(author => author.name)
            });
        });

        bookList.appendChild(bookElement);
    });
}


// Render pagination
function renderPagination(currentPage, totalPages)
{
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Prevent pagination if no more pages are available
    if (totalPages <= 1) return;

    // Helper to create page buttons
    const createPageButton = (pageNumber) =>
    {
        const pageElement = document.createElement('button');
        pageElement.textContent = pageNumber;
        pageElement.classList.add('page-btn');
        pageElement.disabled = pageNumber === currentPage;
        pageElement.addEventListener('click', () =>
        {
            loadBooks(pageNumber);  // Load the selected page
        });
        pagination.appendChild(pageElement);
    };

    // First Page
    if (currentPage !== 1)
    {
        createPageButton(1);
        if (currentPage > 3)
        {
            const dots = document.createElement('span');
            dots.textContent = '...';
            pagination.appendChild(dots);
        }
    }

    // Previous, Current, Next Pages
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(currentPage + 1, totalPages); i++)
    {
        createPageButton(i);
    }

    // Last Page
    if (currentPage < totalPages)
    {
        if (currentPage < totalPages - 2)
        {
            const dots = document.createElement('span');
            dots.textContent = '...';
            pagination.appendChild(dots);
        }
        createPageButton(totalPages);
    }
}



// Load books for the homepage
async function loadBooks(page = 1)
{
    const data = await fetchBooks(page);

    // If no books are returned, prevent pagination
    if (data.results.length === 0)
    {
        renderBooks([], 'book-list');
        document.getElementById('pagination').innerHTML = '<p>No more books available</p>';
        return;
    }

    const totalPages = data.totalPages;

    // Render books and pagination only if there are valid results
    renderBooks(data.results, 'book-list', page);
    renderPagination(page, totalPages);
}


// Load wishlist books from localStorage
function loadWishlist()
{
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    renderBooks(wishlist, 'wishlist');
}

// Load a single book by ID
async function loadBooks(page = 1)
{
    const data = await fetchBooks(page);
    const totalPages = Math.ceil(data.count / ITEMS_PER_PAGE);  // Total number of pages

    renderBooks(data.results, 'book-list', page);
    renderPagination(page, totalPages);
}


// Initialize based on the current page
document.addEventListener('DOMContentLoaded', () =>
{
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '')
    {
        loadBooks(1);  // Load books for the home page
    } else if (currentPage === 'wishlist.html')
    {
        loadWishlist();  // Load wishlist books from localStorage
    } else if (currentPage === 'book.html')
    {
        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');
        loadBook(bookId);
    }
});

// Render books with pagination support for wishlist
function renderWishlistBooks(books, page, perPage = 10)
{
    const paginatedBooks = books.slice((page - 1) * perPage, page * perPage);
    renderBooks(paginatedBooks, 'wishlist');
    renderPagination(page, Math.ceil(books.length / perPage));
}

function loadWishlist(page = 1)
{
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    renderWishlistBooks(wishlist, page);
}

