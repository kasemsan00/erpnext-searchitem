// Search item App JavaScript

frappe.provide("searchitem");

// Debug: Check if frappe is available
console.log("Searchitem JS loaded. Frappe available:", typeof frappe !== "undefined");

searchitem = {
	searchKeyword: "",

	// Initialize the searchitem app
	init: function () {
		this.bindEvents();
		this.setupSearch();
		this.loadProducts();
		this.currentProductId = null;
	},

	// Bind event listeners
	bindEvents: function () {
		// Search input events - only update search keyword, no automatic search
		$(document).on("input", "#product-search", function () {
			searchitem.searchKeyword = $(this).val();
			// Hide suggestions when typing (no automatic search)
			searchitem.hideSuggestions();
		});

		// Enter key for item code search
		$(document).on("keydown", "#product-search", function (e) {
			console.log("Key pressed :", e.key);
			if (e.key === "Enter") {
				e.preventDefault();
				console.log("Enter key detected, handling search for:", $(this).val());
				searchitem.handleEnterKey($(this).val());
			}
		});

		// Search suggestion clicks
		$(document).on("click", ".suggestion-item", function () {
			const productId = $(this).data("product-id");
			searchitem.showProductDetails(productId);
			searchitem.hideSuggestions();
		});

		// Modal events
		$(document).on("click", "#viewFullDetails", function () {
			if (searchitem.currentProductId) {
				searchitem.viewFullDetails(searchitem.currentProductId);
			}
		});

		// Close suggestions when clicking outside
		$(document).on("click", function (e) {
			if (!$(e.target).closest(".searchitem-search-container").length) {
				searchitem.hideSuggestions();
			}
		});

		// Handle image errors - show HTML text instead of default image
		$(document).on("error", "img", function () {
			const $img = $(this);
			const $container = $img.closest(".product-image-container, .suggestion-item");

			// Replace image with HTML text
			$img.replaceWith('<div class="no-image-placeholder">ไม่มีรูปภาพ</div>');
		});

	},

	// Run diagnostic test
	runDiagnostic: function () {
		const query = $("#product-search").val() || "test";

		frappe.call({
			method: "searchitem.api.products.diagnose_search_issue",
			args: { query: query },
			callback: function (r) {
				if (r.message) {
					console.log("Search Diagnostic Results:", r.message);
					searchitem.showDiagnosticResults(r.message, "Search Diagnostic Results");
				}
			},
		});
	},

	// Run image diagnostic test
	runImageDiagnostic: function () {
		const itemCode = $("#product-search").val() || null;

		frappe.call({
			method: "searchitem.api.products.diagnose_image_issue",
			args: { item_code: itemCode },
			callback: function (r) {
				if (r.message) {
					console.log("Image Diagnostic Results:", r.message);
					searchitem.showDiagnosticResults(r.message, "Image Diagnostic Results");
				}
			},
		});
	},

	// Test unified search functionality
	testUnifiedSearch: function () {
		const query = $("#product-search").val() || "test";

		frappe.call({
			method: "searchitem.api.products.test_unified_search",
			args: { query: query },
			callback: function (r) {
				if (r.message) {
					console.log("Unified Search Test Results:", r.message);
					searchitem.showDiagnosticResults(r.message, "Unified Search Test Results");
				}
			},
		});
	},

	// Show diagnostic results
	showDiagnosticResults: function (results, title = "Diagnostic Results") {
		const modal = $(`
			<div class="modal fade" id="diagnosticModal" tabindex="-1">
				<div class="modal-dialog modal-lg">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title">${title}</h5>
							<button type="button" class="close" data-dismiss="modal">&times;</button>
						</div>
						<div class="modal-body">
							<pre style="max-height: 400px; overflow-y: auto;">${JSON.stringify(results, null, 2)}</pre>
						</div>
					</div>
				</div>
			</div>
		`);

		modal.modal("show");
		modal.on("hidden.bs.modal", function () {
			modal.remove();
		});
	},

	// Setup search (simplified - no debouncing needed)
	setupSearch: function () {
		// No longer needed for automatic search
	},

	// Handle search input (simplified - no automatic search)
	handleSearchInput: function (query) {
		// This function is no longer used for automatic search
		// Search only happens on Enter key or button click
		console.log("Search input changed to:", query);
	},

	// Handle Enter key press
	handleEnterKey: function (query) {
		if (!query.trim()) return;

		// Use unified search for Enter key as well
		this.performUnifiedSearchDirect(query.trim());
	},

	// Search by specific item code
	searchByItemCode: function (itemCode) {
		console.log("searchByItemCode: ", itemCode);
		this.showLoading();
		this.hideSuggestions();

		frappe.call({
			method: "searchitem.api.products.get_product_by_code",
			args: {
				item_code: itemCode,
			},
			callback: function (r) {
				searchitem.hideLoading();
				if (r.message && r.message.length > 0) {
					// Show the first product details directly
					searchitem.showProductDetails(r.message[0].name);
				} else {
					searchitem.showNoProducts();
					frappe.show_alert(__("No product found with code: {0}", [itemCode]), 3);
				}
			},
			error: function () {
				searchitem.hideLoading();
				searchitem.showNoProducts();
			},
		});
	},

	// Perform unified search with suggestions (for typing)
	performUnifiedSearch: function (query) {
		frappe.call({
			method: "searchitem.api.products.search_product_unified",
			args: {
				query: query,
			},
			callback: function (r) {
				if (r.message && r.message.length > 0) {
					console.log("Unified search results:", r.message);
					searchitem.showSearchSuggestions(r.message);
				} else {
					searchitem.hideSuggestions();
				}
			},
			error: function () {
				searchitem.hideSearchLoading();
			},
		});
	},

	// Perform unified search direct (for Enter key)
	performUnifiedSearchDirect: function (query) {
		console.log("performUnifiedSearchDirect: ", query);
		this.showLoading();
		this.hideSuggestions();

		frappe.call({
			method: "searchitem.api.products.search_product_unified",
			args: {
				query: query,
			},
			callback: function (r) {
				searchitem.hideLoading();
				if (r.message && r.message.length > 0) {
					console.log("Direct unified search results:", r.message);
					// Show the first product details directly
					searchitem.showProductDetails(r.message[0].name);
				} else {
					searchitem.showNoProducts();
					frappe.show_alert(__("No product found for: {0}", [query]), 3);
				}
			},
			error: function () {
				searchitem.hideLoading();
				searchitem.showNoProducts();
			},
		});
	},

	// Perform search with suggestions (legacy method - kept for compatibility)
	performSearch: function (query) {
		frappe.call({
			method: "searchitem.api.products.search_products",
			args: {
				query: query,
				limit: 10, // Limit for suggestions
			},
			callback: function (r) {
				if (r.message) {
					searchitem.showSearchSuggestions(r.message);
				}
			},
			error: function () {
				searchitem.hideSearchLoading();
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
			// Add search method indicator for debugging (only for System Managers)
			const searchMethodBadge =
				product.search_method && frappe.user.has_role("System Manager")
					? `<span class="badge badge-info badge-sm ml-2">${product.search_method}</span>`
					: "";

			const safeImageUrl = this.getSafeImageUrl(product.image);
			const imageHtml = safeImageUrl
				? `<img src="${safeImageUrl}" 
					   alt="${product.item_name}" 
					   class="mr-3"
					   style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">`
				: `<div class="no-image-placeholder mr-3" 
					   style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background-color: #f8f9fa; border-radius: 4px; font-size: 10px; color: #6c757d; text-align: center;">
					   ไม่มีรูปภาพ
				   </div>`;

			const suggestionItem = `
                <div class="suggestion-item" data-product-id="${product.name}">
                    <div class="d-flex align-items-center">
                        ${imageHtml}
                        <div class="flex-grow-1">
                            <div class="font-weight-bold">${
								product.item_name
							}${searchMethodBadge}</div>
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

	// Get safe image URL
	getSafeImageUrl: function (imageUrl) {
		if (!imageUrl || imageUrl.trim() === "") {
			return null;
		}

		// If it's already a full URL, return as is
		if (imageUrl.startsWith("http")) {
			return imageUrl;
		}

		// If it's a relative path, make it absolute
		if (imageUrl.startsWith("/")) {
			// Ensure it starts with the correct base path
			return imageUrl;
		}

		// If it's a file path without leading slash, add it
		if (imageUrl.includes("/") && !imageUrl.startsWith("/")) {
			return "/" + imageUrl;
		}

		// For file names without path, assume they're in /files/
		if (!imageUrl.includes("/")) {
			return "/files/" + imageUrl;
		}

		// Return the image URL as is if it's not empty
		return imageUrl;
	},

	// Hide search suggestions
	hideSuggestions: function () {
		$("#search-suggestions").hide();
	},

	// Show search loading
	showSearchLoading: function () {
		const suggestionsContainer = $("#search-suggestions");
		suggestionsContainer.html('<div class="p-3 text-center text-muted">Searching...</div>');
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
			method: "searchitem.api.products.get_product_details",
			args: {
				product_id: productId,
			},
			callback: function (r) {
				console.log("showProductDetails: ", r);
				searchitem.hideLoading();
				if (r.message) {
					searchitem.renderProductDetail(r.message);
					$("#product-detail").show();
				}
			},
			error: function () {
				searchitem.hideLoading();
				frappe.show_alert(__("Error loading product details"), 3);
			},
		});
	},

	// Render product detail on page with enhanced stock management UI
	renderProductDetail: function (product) {
		console.log("renderProductDetail: ", product);
		const detailContainer = $("#product-detail .product-card");
		const price = this.formatPrice(product.standard_rate);
		const imageUrl = this.getSafeImageUrl(product.image);
		const defaultImage = "/assets/searchitem/images/default-product.png";

		// Stock status indicator
		const stockStatus = this.getStockStatus(product.stock_qty);
		const stockBadge = this.getStockBadge(product.stock_qty);

		const safeImageUrl = this.getSafeImageUrl(product.image);
		const imageHtml = safeImageUrl
			? `<img src="${safeImageUrl}" 
				   alt="${product.item_name}" 
				   class="product-detail-image"
				   onclick="searchitem.showImageModal('${safeImageUrl}', '${product.item_name}', '${product.item_code}')">`
			: `<div class="no-image-placeholder product-detail-image" 
				   style="display: flex; align-items: center; justify-content: center; background-color: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; color: #6c757d; font-size: 16px; text-align: center; cursor: default;">
				   ไม่มีรูปภาพ
			   </div>`;

		const content = `
			<div class="product-header">
				<h2>รายละเอียดสินค้า</h2>
			</div>
			<div class="product-body">
				<div class="product-image-container">
					${imageHtml}
					${safeImageUrl ? '<div class="image-overlay">คลิกเพื่อขยาย</div>' : ""}
				</div>
				
				<div class="product-info-simple">
					<div class="product-details-simple">
						<div class="detail-row">
							<span class="detail-label">ชื่อสินค้า:</span>
							<span class="detail-value">${product.item_name}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">รหัสบาร์โค้ด:</span>
							<span class="detail-value">${product.barcode || "ไม่มีรหัส"}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">รหัสสินค้า:</span>
							<span class="detail-value">${product.item_code || "ไม่มีรหัส"}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">คงเหลือ:</span>
							<span class="detail-value ${stockStatus.class}">${product.stock_qty || 0} ${
			product.stock_uom || "หน่วย"
		}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">หมวดหมู่:</span>
							<span class="detail-value">${product.item_group || "ไม่ระบุ"}</span>
						</div>
						${
							product.brand
								? `
						<div class="detail-row">
							<span class="detail-label">แบรนด์:</span>
							<span class="detail-value">${product.brand}</span>
						</div>`
								: ""
						}
						${
							product.weight_per_unit
								? `
						<div class="detail-row">
							<span class="detail-label">น้ำหนัก:</span>
							<span class="detail-value">${product.weight_per_unit} ${product.weight_uom || "kg"}</span>
						</div>`
								: ""
						}
					</div>
				</div>
				
				<div class="product-actions">
					<button class="btn btn-success action-btn" onclick="searchitem.printProductInfo()">
						พิมพ์ข้อมูล
					</button>
					${
						safeImageUrl
							? `<button class="btn btn-warning action-btn" onclick="searchitem.showImageModal('${safeImageUrl}', '${product.item_name}', '${product.item_code}')">
							ดูรูปภาพ
						</button>`
							: ""
					}
				</div>
			</div>
        `;

		detailContainer.html(content);
	},

	// Get stock status for styling
	getStockStatus: function (stockQty) {
		const qty = parseFloat(stockQty) || 0;
		if (qty <= 0) {
			return { status: "out_of_stock", class: "text-danger", text: "หมด" };
		} else if (qty <= 10) {
			return { status: "low_stock", class: "text-warning", text: "ต่ำ" };
		} else {
			return { status: "in_stock", class: "text-success", text: "ปกติ" };
		}
	},

	// Get stock badge
	getStockBadge: function (stockQty) {
		const status = this.getStockStatus(stockQty);
		const badgeClass =
			status.status === "out_of_stock"
				? "badge-danger"
				: status.status === "low_stock"
				? "badge-warning"
				: "badge-success";

		return `<span class="badge ${badgeClass} badge-lg">
					Stock: ${status.text}
				</span>`;
	},

	// View full details in ERPNext form
	viewFullDetails: function (productId) {
		$("#productDetailModal").modal("hide");
		$("#imageModal").modal("hide");
		frappe.set_route("Form", "Item", productId);
	},

	// Show image in modal (defined here for consistency)
	showImageModal: function (imageSrc, productName, productCode) {
		if (!imageSrc || imageSrc.includes("default-product.png")) {
			frappe.show_alert(__("ไม่มีรูปภาพสำหรับสินค้านี้"), 3);
			return;
		}

		// Ensure the image URL is properly formatted
		const safeImageUrl = this.getSafeImageUrl(imageSrc);
		if (!safeImageUrl) {
			frappe.show_alert(__("ไม่สามารถโหลดรูปภาพได้"), 3);
			return;
		}

		// Set the image source
		$("#modalImage").attr("src", safeImageUrl);
		
		// Set product information if elements exist
		if ($("#imageProductName").length) {
			$("#imageProductName").text(productName || "");
		}
		if ($("#imageProductCode").length) {
			$("#imageProductCode").text(productCode || "");
		}
		
		// Show the modal
		$("#imageModal").modal("show");
	},

	// Download image function (defined here for consistency)
	downloadImage: function () {
		const imageSrc = $("#modalImage").attr("src");
		const productName = $("#imageProductName").text();

		if (imageSrc && !imageSrc.includes("default-product.png")) {
			const link = document.createElement("a");
			link.href = imageSrc;
			link.download = `${productName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_image.jpg`;
			link.target = "_blank";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			frappe.show_alert(__("กำลังดาวน์โหลดรูปภาพ..."), 2);
		} else {
			frappe.show_alert(__("ไม่สามารถดาวน์โหลดรูปภาพได้"), 3);
		}
	},

	// Print product info function (defined here for consistency)
	printProductInfo: function () {
		if (this.currentProductId) {
			// Add print-specific styles
			const printStyles = `
				<style>
					@media print {
						body * { visibility: hidden; }
						#product-detail, #product-detail * { visibility: visible; }
						#product-detail { position: absolute; left: 0; top: 0; width: 100%; }
						.product-actions, .search-section, .stock-header { display: none !important; }
					}
				</style>
			`;

			if (!document.getElementById("print-styles")) {
				const style = document.createElement("style");
				style.id = "print-styles";
				style.innerHTML = printStyles.replace("<style>", "").replace("</style>", "");
				document.head.appendChild(style);
			}

			setTimeout(() => {
				window.print();
			}, 100);
		} else {
			frappe.show_alert(__("ไม่มีข้อมูลสินค้าให้พิมพ์"), 3);
		}
	},

	// Clear search function (defined here for consistency)
	clearSearch: function () {
		$("#product-search").val("").focus();
		this.searchKeyword = "";
		this.hideSuggestions();
		$("#product-detail").hide();
		$("#no-products").hide();
		$("#loading-state").hide();
	},

	// Scan barcode functionality
	scanBarcode: function () {
		console.log("scanBarcode: ", this.searchKeyword);

		if (!this.searchKeyword || !this.searchKeyword.trim()) {
			frappe.show_alert(__("Please enter a barcode or item code to search"), 3);
			return;
		}

		// Use direct unified search for barcode scanning
		this.performUnifiedSearchDirect(this.searchKeyword.trim());
	},
};

// Initialize when document is ready
$(document).ready(function () {
	searchitem.init();
});
