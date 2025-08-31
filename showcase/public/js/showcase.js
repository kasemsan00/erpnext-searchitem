// ERPNext Showcase App JavaScript

frappe.provide('showcase');

showcase = {
    // Initialize the showcase app
    init: function() {
        this.bindEvents();
        this.setupSearch();
        this.loadProducts();
    },

    // Bind event listeners
    bindEvents: function() {
        // Search functionality
        $(document).on('input', '.showcase-search input', function() {
            showcase.handleSearch($(this).val());
        });

        // Product card click
        $(document).on('click', '.showcase-product-card', function() {
            const productId = $(this).data('product-id');
            showcase.showProductDetails(productId);
        });
    },

    // Setup search with debouncing for performance
    setupSearch: function() {
        let searchTimeout;
        $('.showcase-search input').on('input', function() {
            clearTimeout(searchTimeout);
            const query = $(this).val();
            
            searchTimeout = setTimeout(() => {
                showcase.handleSearch(query);
            }, 300); // 300ms debounce
        });
    },

    // Handle search functionality
    handleSearch: function(query) {
        if (query.length < 2) {
            this.loadProducts();
            return;
        }

        frappe.call({
            method: 'showcase.api.products.search_products',
            args: {
                query: query
            },
            callback: function(r) {
                if (r.message) {
                    showcase.renderProducts(r.message);
                }
            }
        });
    },

    // Load all products
    loadProducts: function() {
        frappe.call({
            method: 'showcase.api.products.get_products',
            callback: function(r) {
                if (r.message) {
                    showcase.renderProducts(r.message);
                }
            }
        });
    },

    // Render products in the grid
    renderProducts: function(products) {
        const container = $('.showcase-product-grid');
        container.empty();

        if (!products || products.length === 0) {
            container.html('<div class="text-center text-muted">No products found</div>');
            return;
        }

        products.forEach(product => {
            const productCard = this.createProductCard(product);
            container.append(productCard);
        });
    },

    // Create product card HTML
    createProductCard: function(product) {
        return `
            <div class="showcase-product-card" data-product-id="${product.name}">
                <img src="${product.image || '/assets/showcase/images/default-product.png'}" 
                     alt="${product.item_name}" 
                     class="showcase-product-image"
                     onerror="this.src='/assets/showcase/images/default-product.png'">
                <div class="showcase-product-title">${product.item_name}</div>
                <div class="showcase-product-price">${this.formatPrice(product.standard_rate)}</div>
                <div class="showcase-product-description">${product.description || ''}</div>
            </div>
        `;
    },

    // Format price
    formatPrice: function(price) {
        if (!price) return 'Price not available';
        return frappe.format(price, { fieldtype: 'Currency' });
    },

    // Show product details
    showProductDetails: function(productId) {
        frappe.set_route('Form', 'Item', productId);
    },

    // Scan barcode functionality
    scanBarcode: function() {
        // Implementation for barcode scanning
        // This would integrate with a barcode scanner library
        console.log('Barcode scanning functionality');
    }
};

// Initialize when document is ready
$(document).ready(function() {
    showcase.init();
});
