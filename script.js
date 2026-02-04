const API_URL = 'https://api.escuelajs.co/api/v1/products';
let allProducts = [];
let currentProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortConfig = { key: null, direction: 'asc' };

// Element References
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const paginationElement = document.getElementById('pagination');

// Modals
const productDetailModal = new bootstrap.Modal(document.getElementById('productDetailModal'));
const createProductModal = new bootstrap.Modal(document.getElementById('createProductModal'));
const editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();

    // Event Listeners
    searchInput.addEventListener('input', handleSearch);
    pageSizeSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
    });

    // Create Form Submit
    document.getElementById('createForm').addEventListener('submit', handleCreateProduct);

    // Edit Form Submit
    document.getElementById('editForm').addEventListener('submit', handleUpdateProduct);

    // Edit Button in Detail Modal
    document.getElementById('btnOpenEdit').addEventListener('click', () => {
        const product = JSON.parse(document.getElementById('btnOpenEdit').dataset.product);
        productDetailModal.hide();
        openEditModal(product);
    });
});

async function fetchProducts() {
    try {
        const res = await fetch(API_URL);
        allProducts = await res.json();
        currentProducts = [...allProducts];
        renderTable();
    } catch (error) {
        console.error("Error fetching products:", error);
        alert("Failed to load products.");
    }
}

function renderTable() {
    tableBody.innerHTML = '';

    // Pagination Logic
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = currentProducts.slice(start, end);

    if (pageData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No products found</td></tr>';
        renderPagination();
        return;
    }

    pageData.forEach(product => {
        const tr = document.createElement('tr');
        // Add description as tooltip
        tr.setAttribute('title', product.description);
        tr.classList.add('product-row');

        // Handle image extraction - implementation handles possible array strings
        let imageSrc = 'https://placehold.co/50';
        if (product.images && product.images.length > 0) {
            // Very defensive image parsing because API returns weird formats sometimes
            let cleanImg = product.images[0].replace(/[\[\]"]/g, '');
            if (cleanImg.startsWith('http')) imageSrc = cleanImg;
        }

        tr.innerHTML = `
            <td class="ps-4 fw-bold">#${product.id}</td>
            <td><img src="${imageSrc}" class="img-thumb" alt="${product.title}" loading="lazy"></td>
            <td class="fw-semibold text-primary">${product.title}</td>
            <td><span class="badge bg-secondary rounded-pill">${product.category ? product.category.name : 'N/A'}</span></td>
            <td class="fw-bold text-success">$${product.price}</td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-light border" onclick="event.stopPropagation(); viewDetail(${product.id})">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        `;

        // Row click to view detail
        tr.addEventListener('click', () => viewDetail(product.id));

        tableBody.appendChild(tr);
    });

    renderPagination();
}

function renderPagination() {
    paginationElement.innerHTML = '';
    const totalPages = Math.ceil(currentProducts.length / itemsPerPage);

    if (totalPages <= 1) return;

    // Prev
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
    prevLi.onclick = (e) => { e.preventDefault(); if (currentPage > 1) { currentPage--; renderTable(); } };
    paginationElement.appendChild(prevLi);

    // Page Numbers (Simple version: show all or simplified range)
    // For large datasets, a more complex logic is needed, but for this demo, we can show a window
    // Let's show max 5 page numbers around current
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.onclick = (e) => { e.preventDefault(); currentPage = i; renderTable(); };
        paginationElement.appendChild(li);
    }

    // Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
    nextLi.onclick = (e) => { e.preventDefault(); if (currentPage < totalPages) { currentPage++; renderTable(); } };
    paginationElement.appendChild(nextLi);
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    currentProducts = allProducts.filter(p => p.title.toLowerCase().includes(term));
    currentPage = 1;

    // Re-apply sort if active
    if (sortConfig.key) {
        sortData(sortConfig.key, sortConfig.direction); // sortData calls renderTable
    } else {
        renderTable();
    }
}

function handleSort(key) {
    // Toggle direction if same key, else default to asc
    if (sortConfig.key === key) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig.key = key;
        sortConfig.direction = 'asc';
    }
    sortData(key, sortConfig.direction);
}

function sortData(key, direction) {
    currentProducts.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        // specific check for title to compare strings safely
        if (key === 'title') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    renderTable();
}

function viewDetail(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('detailTitle').innerText = product.title;
    document.getElementById('detailProductName').innerText = product.title;
    document.getElementById('detailCategory').innerText = product.category ? product.category.name : 'Unknown';
    document.getElementById('detailPrice').innerText = `$${product.price}`;
    document.getElementById('detailDescription').innerText = product.description;

    // Carousel Images
    const carouselInner = document.getElementById('detailImages');
    carouselInner.innerHTML = '';

    let images = product.images || [];
    if (images.length === 0) images = ['https://placehold.co/600x400'];

    images.forEach((img, index) => {
        let cleanImg = img.replace(/[\[\]"]/g, '');
        if (!cleanImg.startsWith('http')) cleanImg = 'https://placehold.co/600x400';

        const div = document.createElement('div');
        div.className = `carousel-item ${index === 0 ? 'active' : ''}`;
        div.innerHTML = `<img src="${cleanImg}" class="d-block w-100" alt="Product Image">`;
        carouselInner.appendChild(div);
    });

    // Set data for Edit trigger
    document.getElementById('btnOpenEdit').dataset.product = JSON.stringify(product);

    productDetailModal.show();
}

function openEditModal(product) {
    document.getElementById('editId').value = product.id;
    document.getElementById('editTitle').value = product.title;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editDescription').value = product.description;

    // Handle image value - take first image if available
    let imgVal = '';
    if (product.images && product.images.length > 0) {
        imgVal = product.images[0].replace(/[\[\]"]/g, '');
    }
    document.getElementById('editImage').value = imgVal;

    editProductModal.show();
}

function handleCreateProduct(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        title: formData.get('title'),
        price: parseFloat(formData.get('price')),
        description: formData.get('description'),
        categoryId: parseInt(formData.get('categoryId')),
        images: [formData.get('images')]
    };

    fetch(API_URL + '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(newProduct => {
            if (newProduct.id) {
                alert('Product Created Successfully!');
                // Add locally to avoid full re-fetch lag, or re-fetch
                allProducts.unshift(newProduct); // Add to top
                currentProducts = [...allProducts];
                renderTable();
                createProductModal.hide();
                e.target.reset();
            } else {
                alert('Error creating product. Check console.');
                console.log(newProduct);
            }
        })
        .catch(err => console.error(err));
}

function handleUpdateProduct(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');
    const data = {
        title: formData.get('title'),
        price: parseFloat(formData.get('price')),
        description: formData.get('description'),
        images: [formData.get('images')]
    };

    fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(updatedProduct => {
            alert('Product Updated Successfully!');

            // Update local state
            const idx = allProducts.findIndex(p => p.id == id);
            if (idx !== -1) {
                allProducts[idx] = { ...allProducts[idx], ...updatedProduct };
                // Also need to update currentProducts if it's there
                const currIdx = currentProducts.findIndex(p => p.id == id);
                if (currIdx !== -1) currentProducts[currIdx] = { ...currentProducts[currIdx], ...updatedProduct };

                renderTable();
            }

            editProductModal.hide();
        })
        .catch(err => console.error(err));
}

function exportToCSV() {
    if (currentProducts.length === 0) {
        alert("No data to export");
        return;
    }

    const headers = ["ID", "Title", "Price", "Category", "Description"];
    const rows = currentProducts.map(p => [
        p.id,
        `"${p.title.replace(/"/g, '""')}"`, // Escape quotes
        p.price,
        `"${p.category ? p.category.name : ''}"`,
        `"${p.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "products_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
