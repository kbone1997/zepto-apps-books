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

// Render books on the page with "Add to Wishlist" button
function renderBooks(books, containerId)
{
    const bookList = document.getElementById(containerId);
    bookList.innerHTML = ''; // Clear any existing content

    books.forEach(book =>
    {
        const authorName = book.authors.map(author => author.name).join(', ');
        //console.log(authorName, authorName.length)
        const truncatedAuthor = authorName.length >= 25 ? authorName.slice(0, 25) + '...' : authorName;
        console.log(truncatedAuthor)
        // Truncate title if it's longer than 30 characters
        const imageUrl = book.formats && book.formats["image/jpeg"] ? book.formats["image/jpeg"] : notFoundImage; // Provide a default image URL
        const truncatedTitle = book.title.length > 30 ? book.title.slice(0, 30) + '...' : book.title;
        const bookElement = document.createElement('div');
        bookElement.classList.add('book');

        // Check if the book is already in the wishlist
        const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const isInWishlist = wishlist.some(item => item.id === book.id);

        // Define the icon color based on the wishlist status
        const iconColor = isInWishlist ? 'style="color:red"' : 'style="color:white"'; // Change to your desired class

        bookElement.innerHTML = `
            <p class="book-title">${truncatedTitle}</p>
            <img class="cover-image" src="${imageUrl}" cover" class="book-image" />
            <p>Author: ${truncatedAuthor}</p>
            <div class="book-footer">
                <a class="book-footer-text" href="book.html?id=${book.id}">Show Details</a>
                <button class="wishlist-btn">
                    <i class="fa fa-heart-o" ${iconColor}"></i>
                </button>
            </div>
        `;

        // Add event listener to add/remove book to/from wishlist
        bookElement.querySelector('.wishlist-btn').addEventListener('click', () =>
        {
            if (isInWishlist)
            {
                // Remove from wishlist
                removeFromWishlist(book.id);
                alert('Book removed from wishlist!');
            } else
            {
                // Add to wishlist
                addToWishlist({
                    id: book.id,
                    title: book.title,
                    authors: book.authors,
                    formats: {
                        "image/jpeg": book.formats["image/jpeg"]
                    }
                });
            }

            // Update icon color after adding/removing
            bookElement.querySelector('.wishlist-btn i').classList.toggle('text-red-500', !isInWishlist);
            bookElement.querySelector('.wishlist-btn i').classList.toggle('text-white', isInWishlist);
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

