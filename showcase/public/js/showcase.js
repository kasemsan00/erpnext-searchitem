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
			console.log("Key pressed xx:", e.key);
			if (e.key === "Enter") {
				e.preventDefault();
				console.log("Enter key detected, handling search for:", $(this).val());
				showcase.handleEnterKey($(this).val());
			}
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
					// Show the first product details directly
					showcase.showProductDetails(r.message[0].name);
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
		$("#product-detail").hide();
		$("#no-products").hide();
	},

	// Hide loading state
	hideLoading: function () {
		$("#loading-state").hide();
	},

	// Show no products state
	showNoProducts: function () {
		$("#no-products").show();
		$("#product-detail").hide();
	},

	// Load all products - now just hides product detail
	loadProducts: function () {
		this.hideLoading();
		this.hideSuggestions();
		$("#product-detail").hide();
		$("#no-products").hide();
	},

	// Format price
	formatPrice: function (price) {
		if (!price) return "Price not available";
		return frappe.format(price, { fieldtype: "Currency" });
	},

	// Show product details on page
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
					showcase.renderProductDetail(r.message);
					$("#product-detail").show();
				}
			},
			error: function () {
				showcase.hideLoading();
				frappe.show_alert(__("Error loading product details"), 3);
			},
		});
	},

	// Render product detail on page
	renderProductDetail: function (product) {
		const detailContainer = $("#product-detail");
		const price = this.formatPrice(product.standard_rate);

		const content = `
            <div class="row">
                <div class="col-md-5">
                    <img src="${product.image || "/assets/showcase/images/default-product.png"}" 
                         alt="${product.item_name}" 
                         class="product-detail-image"
                         onerror="this.src='/assets/showcase/images/default-product.png'">
                </div>
                <div class="col-md-7">
                    <div class="product-detail-title">${product.item_name}</div>
                    <div class="product-detail-code">${product.item_code || ""}</div>
                    <div class="product-detail-price">${price}</div>
                    ${
						product.description
							? `<div class="product-detail-description">${product.description}</div>`
							: ""
					}
                    
                    <div class="product-detail-info">
                        ${
							product.item_group
								? `<div class="info-item">
                                    <span class="info-label">หมวดหมู่:</span>
                                    <span class="info-value">${product.item_group}</span>
                                </div>`
								: ""
						}
                        ${
							product.brand
								? `<div class="info-item">
                                    <span class="info-label">แบรนด์:</span>
                                    <span class="info-value">${product.brand}</span>
                                </div>`
								: ""
						}
                        ${
							product.weight_per_unit
								? `<div class="info-item">
                                    <span class="info-label">น้ำหนัก:</span>
                                    <span class="info-value">${product.weight_per_unit} ${
										product.weight_uom || "kg"
								  }</span>
                                </div>`
								: ""
						}
                        ${
							product.stock_qty !== undefined
								? `<div class="info-item">
                                    <span class="info-label">คงเหลือ:</span>
                                    <span class="info-value">${product.stock_qty || 0} ${
										product.stock_uom || "หน่วย"
								  }</span>
                                </div>`
								: ""
						}
                    </div>
                </div>
            </div>
        `;

		detailContainer.html(content);
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
