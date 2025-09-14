import frappe
from frappe import _

@frappe.whitelist()
def get_products(limit=50, offset=0):
    """
    Get products for searchitem with performance optimizations
    """
    try:
        # Use optimized query with specific fields only
        products = frappe.get_all(
            "Item",
            fields=[
                "name", "item_name", "item_code", "description", 
                "standard_rate", "image", "item_group", "stock_uom"
            ],
            filters={
                "disabled": 0,
                "is_stock_item": 1
            },
            limit=limit,
            start=offset,
            order_by="modified desc"
        )
        
        # Add image URLs safely
        for product in products:
            product.image = get_safe_image_url(product.image)
        
        return products
        
    except Exception as e:
        frappe.log_error(f"Searchitem API Error: {str(e)}", "Searchitem API")
        return []

@frappe.whitelist()
def search_products(query, limit=20):
    """
    Search products by name or code with performance optimizations
    """
    try:
        if not query or len(query) < 2:
            return []
        
        # Clean query for better search
        clean_query = query.strip()
        
        # Debug logging
        frappe.logger().debug(f"Searching for query: '{clean_query}'")
        
        # Use optimized search query - search in both name and code separately
        # This is more reliable than or_filters
        name_products = frappe.get_all(
            "Item",
            fields=[
                "name", "item_name", "item_code", "description", 
                "standard_rate", "image", "item_group", "stock_uom"
            ],
            filters=[
                ["disabled", "=", 0],
                ["is_stock_item", "=", 1],
                ["item_name", "like", f"%{clean_query}%"]
            ],
            limit=limit//2,
            order_by="modified desc"
        )
        
        code_products = frappe.get_all(
            "Item",
            fields=[
                "name", "item_name", "item_code", "description", 
                "standard_rate", "image", "item_group", "stock_uom"
            ],
            filters=[
                ["disabled", "=", 0],
                ["is_stock_item", "=", 1],
                ["item_code", "like", f"%{clean_query}%"]
            ],
            limit=limit//2,
            order_by="modified desc"
        )
        
        # Debug logging
        frappe.logger().debug(f"Found {len(name_products)} products by name, {len(code_products)} by code")
        
        # Combine and deduplicate results
        all_products = name_products + code_products
        seen_names = set()
        unique_products = []
        
        for product in all_products:
            if product.name not in seen_names:
                seen_names.add(product.name)
                unique_products.append(product)
        
        # Limit final results
        products = unique_products[:limit]
        
        # Debug logging for products with images
        image_products = [p for p in products if p.image]
        frappe.logger().debug(f"Total products found: {len(products)}, Products with images: {len(image_products)}")
        
        # Add image URLs safely
        for product in products:
            original_image = product.image
            product.image = get_safe_image_url(product.image)
            if original_image and not product.image:
                frappe.logger().debug(f"Failed to get URL for image: {original_image}")
        
        return products
        
    except Exception as e:
        frappe.log_error(f"Searchitem Search Error: {str(e)}", "Searchitem API")
        return []

@frappe.whitelist()
def get_product_by_code(item_code):
    """
    Get product by specific item code with performance optimizations
    """
    try:
        if not item_code:
            return []
        
        clean_item_code = item_code.strip()
        
        # Debug logging
        frappe.logger().debug(f"Searching for item code: '{clean_item_code}'")
        
        # Search for exact item code match first
        products = frappe.get_all(
            "Item",
            fields=[
                "name", "item_name", "item_code", "description", 
                "standard_rate", "image", "item_group", "stock_uom"
            ],
            filters=[
                ["disabled", "=", 0],
                ["is_stock_item", "=", 1],
                ["item_code", "=", clean_item_code]
            ],
            limit=1
        )
        
        # If no exact match, try partial match
        if not products:
            products = frappe.get_all(
                "Item",
                fields=[
                    "name", "item_name", "item_code", "description", 
                    "standard_rate", "image", "item_group", "stock_uom"
                ],
                filters=[
                    ["disabled", "=", 0],
                    ["is_stock_item", "=", 1],
                    ["item_code", "like", f"%{clean_item_code}%"]
                ],
                limit=5
            )
        
        # Debug logging
        frappe.logger().debug(f"Found {len(products)} products for item code '{clean_item_code}'")
        
        # Add image URLs safely
        for product in products:
            original_image = product.image
            frappe.logger().debug(f"Processing product '{product.name}' with original image: '{original_image}'")
            
            # Check if original image field has data
            if original_image:
                frappe.logger().debug(f"Original image field type: {type(original_image)}, value: '{original_image}'")
            
            product.image = get_safe_image_url(product.image)
            frappe.logger().debug(f"Processed image URL: '{product.image}'")
            
            if original_image and not product.image:
                frappe.logger().debug(f"Failed to get URL for image: {original_image}")
            elif original_image and product.image:
                frappe.logger().debug(f"Successfully processed image: {original_image} -> {product.image}")
        
        return products
        
    except Exception as e:
        frappe.log_error(f"Searchitem Item Code Error: {str(e)}", "Searchitem API")
        return []

@frappe.whitelist()
def get_product_details(product_id):
    """
    Get detailed product information for modal display
    """
    try:
        if not product_id:
            return None
        
        # Debug logging
        frappe.logger().debug(f"Getting details for product: '{product_id}'")
        
        # Get detailed product information
        product = frappe.get_doc("Item", product_id)
        
        if not product or product.disabled:
            frappe.logger().debug(f"Product '{product_id}' not found or disabled")
            return None
        
        # Get stock quantity from Bin
        stock_qty = 0
        try:
            bin_data = frappe.get_all(
                "Bin",
                fields=["actual_qty"],
                filters={"item_code": product.item_code},
                limit=1
            )
            if bin_data:
                stock_qty = bin_data[0].actual_qty or 0
        except:
            pass
        
        # Debug logging for image
        if product.image:
            frappe.logger().debug(f"Product '{product_id}' has image: {product.image}")
        
        # Get additional details
        details = {
            "name": product.name,
            "item_name": product.item_name,
            "item_code": product.item_code,
            "description": product.description,
            "standard_rate": product.standard_rate,
            "image": get_safe_image_url(product.image),
            "item_group": product.item_group,
            "stock_uom": product.stock_uom,
            "brand": product.brand,
            "weight_per_unit": product.weight_per_unit,
            "weight_uom": product.weight_uom,
            "stock_qty": stock_qty,
            "is_stock_item": product.is_stock_item,
            "allow_alternative_item": product.allow_alternative_item,
            "is_fixed_asset": product.is_fixed_asset,
            "auto_create_assets": product.auto_create_assets,
            "asset_category": product.asset_category,
            "asset_naming_series": product.asset_naming_series,
            "over_delivery_receipt_allowance": product.over_delivery_receipt_allowance,
            "over_billing_allowance": product.over_billing_allowance
        }
        
        return details
        
    except Exception as e:
        frappe.log_error(f"Searchitem Product Details Error: {str(e)}", "Searchitem API")
        return None

@frappe.whitelist()
def get_product_by_barcode(barcode):
    """
    Get product by barcode with performance optimizations
    """
    try:
        # Search in Item Barcode doctype first
        barcode_doc = frappe.get_all(
            "Item Barcode",
            fields=["parent"],
            filters={"barcode": barcode},
            limit=1
        )
        
        if barcode_doc:
            item_code = barcode_doc[0].parent
        else:
            # Fallback to item_code
            item_code = barcode
        
        # Get item details
        item = frappe.get_doc("Item", item_code)
        
        if not item or item.disabled:
            return None
        
        product = {
            "name": item.name,
            "item_name": item.item_name,
            "item_code": item.item_code,
            "description": item.description,
            "standard_rate": item.standard_rate,
            "image": get_safe_image_url(item.image),
            "item_group": item.item_group,
            "stock_uom": item.stock_uom
        }
        
        return product
        
    except Exception as e:
        frappe.log_error(f"Searchitem Barcode Error: {str(e)}", "Searchitem API")
        return None

@frappe.whitelist()
def search_product_unified(query):
    """
    Unified search that tries barcode first, then item code, then item name
    Priority: Barcode -> Item Code -> Item Name
    """
    try:
        if not query or not query.strip():
            return []
        
        clean_query = query.strip()
        frappe.logger().debug(f"Unified search for: '{clean_query}'")
        
        # Step 1: Try barcode search first
        try:
            # Search in Item Barcode doctype
            barcode_docs = frappe.get_all(
                "Item Barcode",
                fields=["parent"],
                filters={"barcode": clean_query},
                limit=5
            )
            
            if barcode_docs:
                frappe.logger().debug(f"Found {len(barcode_docs)} items by barcode")
                # Get items from barcode matches
                item_codes = [doc.parent for doc in barcode_docs]
                products = frappe.get_all(
                    "Item",
                    fields=[
                        "name", "item_name", "item_code", "description", 
                        "standard_rate", "image", "item_group", "stock_uom"
                    ],
                    filters=[
                        ["disabled", "=", 0],
                        ["is_stock_item", "=", 1],
                        ["item_code", "in", item_codes]
                    ],
                    limit=5
                )
                
                if products:
                    # Process images and return results
                    for product in products:
                        original_image = product.image
                        product.image = get_safe_image_url(product.image)
                        product.search_method = "barcode"  # Add search method for debugging
                        frappe.logger().debug(f"Found by barcode: {product.item_code}")
                    
                    frappe.logger().debug(f"Returning {len(products)} products found by barcode")
                    return products
                    
        except Exception as e:
            frappe.logger().debug(f"Barcode search error: {str(e)}")
        
        # Step 2: Try exact item code match
        try:
            products = frappe.get_all(
                "Item",
                fields=[
                    "name", "item_name", "item_code", "description", 
                    "standard_rate", "image", "item_group", "stock_uom"
                ],
                filters=[
                    ["disabled", "=", 0],
                    ["is_stock_item", "=", 1],
                    ["item_code", "=", clean_query]
                ],
                limit=5
            )
            
            if products:
                frappe.logger().debug(f"Found {len(products)} items by exact item code")
                for product in products:
                    original_image = product.image
                    product.image = get_safe_image_url(product.image)
                    product.search_method = "item_code_exact"
                    frappe.logger().debug(f"Found by item code: {product.item_code}")
                
                frappe.logger().debug(f"Returning {len(products)} products found by item code")
                return products
                
        except Exception as e:
            frappe.logger().debug(f"Item code search error: {str(e)}")
        
        # Step 3: Try partial item code match
        try:
            products = frappe.get_all(
                "Item",
                fields=[
                    "name", "item_name", "item_code", "description", 
                    "standard_rate", "image", "item_group", "stock_uom"
                ],
                filters=[
                    ["disabled", "=", 0],
                    ["is_stock_item", "=", 1],
                    ["item_code", "like", f"%{clean_query}%"]
                ],
                limit=5
            )
            
            if products:
                frappe.logger().debug(f"Found {len(products)} items by partial item code")
                for product in products:
                    original_image = product.image
                    product.image = get_safe_image_url(product.image)
                    product.search_method = "item_code_partial"
                    frappe.logger().debug(f"Found by partial item code: {product.item_code}")
                
                frappe.logger().debug(f"Returning {len(products)} products found by partial item code")
                return products
                
        except Exception as e:
            frappe.logger().debug(f"Partial item code search error: {str(e)}")
        
        # Step 4: Try item name search
        try:
            products = frappe.get_all(
                "Item",
                fields=[
                    "name", "item_name", "item_code", "description", 
                    "standard_rate", "image", "item_group", "stock_uom"
                ],
                filters=[
                    ["disabled", "=", 0],
                    ["is_stock_item", "=", 1],
                    ["item_name", "like", f"%{clean_query}%"]
                ],
                limit=5
            )
            
            if products:
                frappe.logger().debug(f"Found {len(products)} items by item name")
                for product in products:
                    original_image = product.image
                    product.image = get_safe_image_url(product.image)
                    product.search_method = "item_name"
                    frappe.logger().debug(f"Found by item name: {product.item_name}")
                
                frappe.logger().debug(f"Returning {len(products)} products found by item name")
                return products
                
        except Exception as e:
            frappe.logger().debug(f"Item name search error: {str(e)}")
        
        # No results found
        frappe.logger().debug(f"No products found for query: '{clean_query}'")
        return []
        
    except Exception as e:
        frappe.log_error(f"Searchitem Unified Search Error: {str(e)}", "Searchitem API")
        frappe.logger().debug(f"Unified search error: {str(e)}")
        return []

@frappe.whitelist()
def diagnose_image_issue(item_code=None):
    """
    Diagnostic function to help identify image issues
    """
    try:
        result = {
            "debug_info": [],
            "items_checked": [],
            "image_processing": []
        }
        
        # If specific item_code provided, check that item
        if item_code:
            items = frappe.get_all(
                "Item",
                fields=["name", "item_name", "item_code", "image"],
                filters=[
                    ["item_code", "=", item_code],
                    ["disabled", "=", 0]
                ],
                limit=1
            )
        else:
            # Get a few items with images
            items = frappe.get_all(
                "Item",
                fields=["name", "item_name", "item_code", "image"],
                filters=[
                    ["disabled", "=", 0],
                    ["image", "!=", ""],
                    ["image", "is", "set"]
                ],
                limit=5
            )
        
        result["debug_info"].append(f"Found {len(items)} items to check")
        
        for item in items:
            item_info = {
                "name": item.name,
                "item_code": item.item_code,
                "original_image": item.image,
                "image_type": str(type(item.image)),
                "image_length": len(item.image) if item.image else 0,
                "processed_url": None,
                "processing_error": None
            }
            
            try:
                processed_url = get_safe_image_url(item.image)
                item_info["processed_url"] = processed_url
                item_info["url_accessible"] = bool(processed_url)
            except Exception as e:
                item_info["processing_error"] = str(e)
            
            result["items_checked"].append(item_info)
        
        # Check File doctype for recent images
        files = frappe.get_all(
            "File",
            fields=["name", "file_name", "file_url", "is_private"],
            filters=[
                ["attached_to_doctype", "=", "Item"],
                ["is_folder", "=", 0]
            ],
            limit=5,
            order_by="creation desc"
        )
        
        result["recent_files"] = files
        result["debug_info"].append(f"Found {len(files)} recent files attached to Items")
        
        return result
        
    except Exception as e:
        frappe.log_error(f"Image Diagnosis Error: {str(e)}", "Searchitem API")
        return {"error": str(e)}

@frappe.whitelist()
def test_unified_search(query):
    """
    Test the unified search functionality with detailed logging
    """
    try:
        if not query:
            return {"error": "No query provided"}
        
        result = {
            "query": query,
            "search_steps": [],
            "final_results": []
        }
        
        # Test each step of the unified search
        clean_query = query.strip()
        
        # Step 1: Test barcode search
        try:
            barcode_docs = frappe.get_all(
                "Item Barcode",
                fields=["parent", "barcode"],
                filters={"barcode": clean_query},
                limit=5
            )
            
            step1_result = {
                "step": "barcode_search",
                "query": clean_query,
                "found_barcodes": len(barcode_docs),
                "barcode_docs": barcode_docs
            }
            
            if barcode_docs:
                item_codes = [doc.parent for doc in barcode_docs]
                products = frappe.get_all(
                    "Item",
                    fields=["name", "item_name", "item_code", "image"],
                    filters=[
                        ["disabled", "=", 0],
                        ["is_stock_item", "=", 1],
                        ["item_code", "in", item_codes]
                    ]
                )
                step1_result["found_products"] = len(products)
                step1_result["products"] = products
                if products:
                    result["final_results"] = products
                    result["search_steps"].append(step1_result)
                    return result
            
            result["search_steps"].append(step1_result)
            
        except Exception as e:
            result["search_steps"].append({
                "step": "barcode_search",
                "error": str(e)
            })
        
        # Step 2: Test exact item code
        try:
            products = frappe.get_all(
                "Item",
                fields=["name", "item_name", "item_code", "image"],
                filters=[
                    ["disabled", "=", 0],
                    ["is_stock_item", "=", 1],
                    ["item_code", "=", clean_query]
                ]
            )
            
            step2_result = {
                "step": "exact_item_code",
                "query": clean_query,
                "found_products": len(products),
                "products": products
            }
            
            if products:
                result["final_results"] = products
                result["search_steps"].append(step2_result)
                return result
            
            result["search_steps"].append(step2_result)
            
        except Exception as e:
            result["search_steps"].append({
                "step": "exact_item_code",
                "error": str(e)
            })
        
        # Step 3: Test partial item code
        try:
            products = frappe.get_all(
                "Item",
                fields=["name", "item_name", "item_code", "image"],
                filters=[
                    ["disabled", "=", 0],
                    ["is_stock_item", "=", 1],
                    ["item_code", "like", f"%{clean_query}%"]
                ],
                limit=5
            )
            
            step3_result = {
                "step": "partial_item_code",
                "query": clean_query,
                "found_products": len(products),
                "products": products
            }
            
            if products:
                result["final_results"] = products
                result["search_steps"].append(step3_result)
                return result
            
            result["search_steps"].append(step3_result)
            
        except Exception as e:
            result["search_steps"].append({
                "step": "partial_item_code",
                "error": str(e)
            })
        
        # Step 4: Test item name
        try:
            products = frappe.get_all(
                "Item",
                fields=["name", "item_name", "item_code", "image"],
                filters=[
                    ["disabled", "=", 0],
                    ["is_stock_item", "=", 1],
                    ["item_name", "like", f"%{clean_query}%"]
                ],
                limit=5
            )
            
            step4_result = {
                "step": "item_name",
                "query": clean_query,
                "found_products": len(products),
                "products": products
            }
            
            if products:
                result["final_results"] = products
            
            result["search_steps"].append(step4_result)
            
        except Exception as e:
            result["search_steps"].append({
                "step": "item_name",
                "error": str(e)
            })
        
        return result
        
    except Exception as e:
        return {"error": str(e)}

@frappe.whitelist()
def diagnose_search_issue(query):
    """
    Diagnostic function to help identify search issues
    """
    try:
        if not query:
            return {"error": "No query provided"}
        
        clean_query = query.strip()
        diagnosis = {
            "query": clean_query,
            "total_items": 0,
            "items_with_images": 0,
            "items_without_images": 0,
            "search_results": [],
            "image_issues": []
        }
        
        # Get total count of items
        total_items = frappe.db.count("Item", filters={"disabled": 0, "is_stock_item": 1})
        diagnosis["total_items"] = total_items
        
        # Get items with images
        items_with_images = frappe.db.count("Item", filters={
            "disabled": 0, 
            "is_stock_item": 1,
            "image": ["!=", ""]
        })
        diagnosis["items_with_images"] = items_with_images
        diagnosis["items_without_images"] = total_items - items_with_images
        
        # Test search
        search_results = search_products(clean_query, 10)
        diagnosis["search_results"] = search_results
        
        # Check for image issues
        for product in search_results:
            if product.get("image"):
                try:
                    url = frappe.get_url(product["image"])
                    if not url:
                        diagnosis["image_issues"].append({
                            "product": product["name"],
                            "image_field": product["image"],
                            "issue": "Failed to generate URL"
                        })
                except Exception as e:
                    diagnosis["image_issues"].append({
                        "product": product["name"],
                        "image_field": product["image"],
                        "issue": str(e)
                    })
        
        return diagnosis
        
    except Exception as e:
        frappe.log_error(f"Diagnosis Error: {str(e)}", "Searchitem API")
        return {"error": str(e)}

def get_safe_image_url(image_field):
    """
    Safely get image URL with error handling
    """
    try:
        if not image_field:
            return None
        
        # Check if it's already a full URL
        if image_field.startswith('http'):
            return image_field
        
        # Handle file attachment paths
        if image_field.startswith('/files/') or image_field.startswith('/private/files/'):
            # For file paths, use frappe.utils.get_url to get the full URL
            from frappe.utils import get_url
            url = get_url() + image_field
            frappe.logger().debug(f"Generated URL for file path '{image_field}': {url}")
            return url
            
        # Handle File doctype references (when image field contains File name)
        if not image_field.startswith('/') and not image_field.startswith('http'):
            try:
                # Check if this is a File doctype name
                file_doc = frappe.get_doc("File", image_field)
                if file_doc and file_doc.file_url:
                    from frappe.utils import get_url
                    if file_doc.file_url.startswith('http'):
                        return file_doc.file_url
                    else:
                        url = get_url() + file_doc.file_url
                        frappe.logger().debug(f"Generated URL from File doc '{image_field}': {url}")
                        return url
            except frappe.DoesNotExistError:
                # Not a File doctype name, continue with other logic
                pass
            except Exception as e:
                frappe.logger().debug(f"Error checking File doctype for '{image_field}': {str(e)}")
                pass
        
        # For other cases, try to construct the URL
        # This handles cases where the image field contains just the filename
        if '/' not in image_field:
            # If it's just a filename, assume it's in /files/
            url = frappe.utils.get_url() + image_field
        else:
            # If it contains path separators, use as-is with base URL
            url = frappe.utils.get_url() + ('/' + image_field if not image_field.startswith('/') else image_field)
        
        frappe.logger().debug(f"Generated URL for image '{image_field}': {url}")
        return url
        
    except Exception as e:
        # Log error but don't break the search
        frappe.log_error(f"Image URL Error for '{image_field}': {str(e)}", "Searchitem API")
        frappe.logger().debug(f"Failed to process image field: '{image_field}', error: {str(e)}")
        return None
