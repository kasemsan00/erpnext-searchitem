// ERPNext Showcase App JavaScript

frappe.provide("showcase");

// Debug: Check if frappe is available
console.log("Showcase JS loaded. Frappe available:", typeof frappe !== "undefined");

showcase = {
	// Initialize the showcase app
	init: function () {
		this.bindEvents();
		this.setupSearch();
		this.loadProducts();
		this.currentProductId = null;
	},

	// Bind event listeners
	bindEvents: function () {
		// Search input events
		$(document).on("input", "#product-search", function () {
			showcase.handleSearchInput($(this).val());
		});

		// Enter key for item code search
		$(document).on("keydown", "#product-search", function (e) {
			console.log("Key pressed:", e.key);
			if (e.key === "Enter") {
				e.preventDefault();
				console.log("Enter key detected, handling search for:", $(this).val());
				showcase.handleEnterKey($(this).val());
			}
		});

		// Product card click
		$(document).on("click", ".showcase-product-card", function () {
			const productId = $(this).data("product-id");
			showcase.showProductDetails(productId);
		});

		// Search suggestion clicks
		$(document).on("click", ".suggestion-item", function () {
			const productId = $(this).data("product-id");
			showcase.showProductDetails(productId);
			showcase.hideSuggestions();
		});

		// Modal events
		$(document).on("click", "#viewFullDetails", function () {
			if (showcase.currentProductId) {
				showcase.viewFullDetails(showcase.currentProductId);
			}
		});

		// Close suggestions when clicking outside
		$(document).on("click", function (e) {
			if (!$(e.target).closest(".showcase-search-container").length) {
				showcase.hideSuggestions();
			}
		});
	},

	// Setup search with debouncing for performance
	setupSearch: function () {
		this.searchTimeout = null;
		this.lastSearchQuery = "";
	},

	// Handle search input with debouncing
	handleSearchInput: function (query) {
		clearTimeout(this.searchTimeout);

		if (query === this.lastSearchQuery) return;
		this.lastSearchQuery = query;

		if (query.length < 2) {
			this.hideSuggestions();
			this.loadProducts();
			return;
		}

		// Show loading state for suggestions
		this.showSearchLoading();

		this.searchTimeout = setTimeout(() => {
			this.performSearch(query);
		}, 300); // 300ms debounce for performance
	},

	// Handle Enter key press
	handleEnterKey: function (query) {
		if (!query.trim()) return;

		// Check if it looks like an item code (alphanumeric, typically 6-20 chars)
		const itemCodePattern = /^[A-Za-z0-9-_]{3,20}$/;

		if (itemCodePattern.test(query.trim())) {
			// Search for specific item code
			this.searchByItemCode(query.trim());
		} else {
			// Perform regular search
			this.performSearch(query);
		}
	},

	// Search by specific item code
	searchByItemCode: function (itemCode) {
		this.showLoading();
		this.hideSuggestions();

		frappe.call({
			method: "showcase.api.products.get_product_by_code",
			args: {
				item_code: itemCode,
			},
			callback: function (r) {
				showcase.hideLoading();
				if (r.message && r.message.length > 0) {
					showcase.renderProducts(r.message);
					if (r.message.length === 1) {
						// If only one product found, show its details
						showcase.showProductDetails(r.message[0].name);
					}
				} else {
					showcase.showNoProducts();
					frappe.show_alert(__("No product found with code: {0}", [itemCode]), 3);
				}
			},
			error: function () {
				showcase.hideLoading();
				showcase.showNoProducts();
			},
		});
	},

	// Perform search with suggestions
	performSearch: function (query) {
		frappe.call({
			method: "showcase.api.products.search_products",
			args: {
				query: query,
				limit: 10, // Limit for suggestions
			},
			callback: function (r) {
				if (r.message) {
					showcase.showSearchSuggestions(r.message);
				}
			},
			error: function () {
				showcase.hideSearchLoading();
			},
		});
	},

	// Show search suggestions
	showSearchSuggestions: function (products) {
		const suggestionsContainer = $("#search-suggestions");
		suggestionsContainer.empty();

		if (!products || products.length === 0) {
			suggestionsContainer.hide();
			return;
		}

		products.forEach((product) => {
			const suggestionItem = `
                <div class="suggestion-item" data-product-id="${product.name}">
                    <div class="d-flex align-items-center">
                        <img src="${
							product.image || "/assets/showcase/images/default-product.png"
						}" 
                             alt="${product.item_name}" 
                             class="mr-3"
                             style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"
                             onerror="this.src='/assets/showcase/images/default-product.png'">
                        <div>
                            <div class="font-weight-bold">${product.item_name}</div>
                            <div class="text-muted small">${product.item_code || ""}</div>
                        </div>
                    </div>
                </div>
            `;
			suggestionsContainer.append(suggestionItem);
		});

		suggestionsContainer.show();
		this.hideSearchLoading();
	},

	// Hide search suggestions
	hideSuggestions: function () {
		$("#search-suggestions").hide();
	},

	// Show search loading
	showSearchLoading: function () {
		const suggestionsContainer = $("#search-suggestions");
		suggestionsContainer.html(
			'<div class="p-3 text-center text-muted"><i class="fa fa-spinner fa-spin"></i> Searching...</div>'
		);
		suggestionsContainer.show();
	},

	// Hide search loading
	hideSearchLoading: function () {
		// Loading state is handled in showSearchSuggestions
	},

	// Show loading state
	showLoading: function () {
		$("#loading-state").show();
		$("#products-grid").hide();
		$("#no-products").hide();
	},

	// Hide loading state
	hideLoading: function () {
		$("#loading-state").hide();
		$("#products-grid").show();
	},

	// Show no products state
	showNoProducts: function () {
		$("#no-products").show();
		$("#products-grid").hide();
	},

	// Load all products
	loadProducts: function () {
		this.showLoading();
		this.hideSuggestions();

		frappe.call({
			method: "showcase.api.products.get_products",
			callback: function (r) {
				showcase.hideLoading();
				if (r.message) {
					showcase.renderProducts(r.message);
				}
			},
			error: function () {
				showcase.hideLoading();
				showcase.showNoProducts();
			},
		});
	},

	// Render products in the grid
	renderProducts: function (products) {
		const container = $("#products-grid");
		container.empty();

		if (!products || products.length === 0) {
			this.showNoProducts();
			return;
		}

		// Use document fragment for better performance
		const fragment = document.createDocumentFragment();

		products.forEach((product) => {
			const productCard = this.createProductCard(product);
			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = productCard;
			fragment.appendChild(tempDiv.firstElementChild);
		});

		container.append(fragment);
		$("#no-products").hide();
	},

	// Create product card HTML
	createProductCard: function (product) {
		const price = this.formatPrice(product.standard_rate);
		const description = product.description || "";
		const truncatedDescription =
			description.length > 100 ? description.substring(0, 100) + "..." : description;

		return `
            <div class="showcase-product-card" data-product-id="${product.name}">
                <img src="${product.image || "/assets/showcase/images/default-product.png"}" 
                     alt="${product.item_name}" 
                     class="showcase-product-image"
                     loading="lazy"
                     onerror="this.src='/assets/showcase/images/default-product.png'">
                <div class="showcase-product-title">${product.item_name}</div>
                <div class="showcase-product-price">${price}</div>
                ${
					description
						? `<div class="showcase-product-description">${truncatedDescription}</div>`
						: ""
				}
                <div class="showcase-product-code text-muted small mt-2">${
					product.item_code || ""
				}</div>
            </div>
        `;
	},

	// Format price
	formatPrice: function (price) {
		if (!price) return "Price not available";
		return frappe.format(price, { fieldtype: "Currency" });
	},

	// Show product details in modal
	showProductDetails: function (productId) {
		this.currentProductId = productId;
		this.showLoading();

		frappe.call({
			method: "showcase.api.products.get_product_details",
			args: {
				product_id: productId,
			},
			callback: function (r) {
				showcase.hideLoading();
				if (r.message) {
					showcase.renderProductModal(r.message);
					$("#productDetailModal").modal("show");
				}
			},
			error: function () {
				showcase.hideLoading();
				frappe.show_alert(__("Error loading product details"), 3);
			},
		});
	},

	// Render product modal content
	renderProductModal: function (product) {
		const modalContent = $("#productDetailContent");
		const price = this.formatPrice(product.standard_rate);

		const content = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${product.image || "/assets/showcase/images/default-product.png"}" 
                         alt="${product.item_name}" 
                         class="img-fluid rounded"
                         style="max-height: 300px; object-fit: cover;"
                         onerror="this.src='/assets/showcase/images/default-product.png'">
                </div>
                <div class="col-md-6">
                    <h4>${product.item_name}</h4>
                    <p class="text-muted">${product.item_code || ""}</p>
                    <div class="mb-3">
                        <span class="h5 text-danger font-weight-bold">${price}</span>
                    </div>
                    ${
						product.description
							? `<div class="mb-3"><strong>Description:</strong><br>${product.description}</div>`
							: ""
					}
                    ${
						product.item_group
							? `<div class="mb-2"><strong>Category:</strong> ${product.item_group}</div>`
							: ""
					}
                    ${
						product.brand
							? `<div class="mb-2"><strong>Brand:</strong> ${product.brand}</div>`
							: ""
					}
                    ${
						product.weight_per_unit
							? `<div class="mb-2"><strong>Weight:</strong> ${
									product.weight_per_unit
							  } ${product.weight_uom || "kg"}</div>`
							: ""
					}
                </div>
            </div>
        `;

		modalContent.html(content);
	},

	// View full details in ERPNext form
	viewFullDetails: function (productId) {
		$("#productDetailModal").modal("hide");
		frappe.set_route("Form", "Item", productId);
	},

	// Scan barcode functionality
	scanBarcode: function () {
		// Implementation for barcode scanning
		// This would integrate with a barcode scanner library
		frappe.show_alert(__("Barcode scanning functionality coming soon!"), 3);
	},
};

// Initialize when document is ready
$(document).ready(function () {
	showcase.init();
});
