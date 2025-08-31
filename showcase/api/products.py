import frappe
from frappe import _

@frappe.whitelist()
def get_products(limit=50, offset=0):
    """
    Get products for showcase with performance optimizations
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
        
        # Add image URLs
        for product in products:
            if product.image:
                product.image = frappe.get_url(product.image)
        
        return products
        
    except Exception as e:
        frappe.log_error(f"Showcase API Error: {str(e)}", "Showcase API")
        return []

@frappe.whitelist()
def search_products(query, limit=20):
    """
    Search products by name or code with performance optimizations
    """
    try:
        if not query or len(query) < 2:
            return []
        
        # Use optimized search query with OR condition for both name and code
        products = frappe.get_all(
            "Item",
            fields=[
                "name", "item_name", "item_code", "description", 
                "standard_rate", "image", "item_group", "stock_uom"
            ],
            filters=[
                ["disabled", "=", 0],
                ["is_stock_item", "=", 1],
                ["name", "like", f"%{query}%"]
            ],
            or_filters=[
                ["item_name", "like", f"%{query}%"],
                ["item_code", "like", f"%{query}%"]
            ],
            limit=limit,
            order_by="modified desc"
        )
        
        # Add image URLs
        for product in products:
            if product.image:
                product.image = frappe.get_url(product.image)
        
        return products
        
    except Exception as e:
        frappe.log_error(f"Showcase Search Error: {str(e)}", "Showcase API")
        return []

@frappe.whitelist()
def get_product_by_code(item_code):
    """
    Get product by specific item code with performance optimizations
    """
    try:
        if not item_code:
            return []
        
        # Search for exact item code match
        products = frappe.get_all(
            "Item",
            fields=[
                "name", "item_name", "item_code", "description", 
                "standard_rate", "image", "item_group", "stock_uom"
            ],
            filters=[
                ["disabled", "=", 0],
                ["is_stock_item", "=", 1],
                ["item_code", "=", item_code]
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
                    ["item_code", "like", f"%{item_code}%"]
                ],
                limit=5
            )
        
        # Add image URLs
        for product in products:
            if product.image:
                product.image = frappe.get_url(product.image)
        
        return products
        
    except Exception as e:
        frappe.log_error(f"Showcase Item Code Error: {str(e)}", "Showcase API")
        return []

@frappe.whitelist()
def get_product_details(product_id):
    """
    Get detailed product information for modal display
    """
    try:
        if not product_id:
            return None
        
        # Get detailed product information
        product = frappe.get_doc("Item", product_id)
        
        if not product or product.disabled:
            return None
        
        # Get additional details
        details = {
            "name": product.name,
            "item_name": product.item_name,
            "item_code": product.item_code,
            "description": product.description,
            "standard_rate": product.standard_rate,
            "image": frappe.get_url(product.image) if product.image else None,
            "item_group": product.item_group,
            "stock_uom": product.stock_uom,
            "brand": product.brand,
            "weight_per_unit": product.weight_per_unit,
            "weight_uom": product.weight_uom,
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
        frappe.log_error(f"Showcase Product Details Error: {str(e)}", "Showcase API")
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
            "image": frappe.get_url(item.image) if item.image else None,
            "item_group": item.item_group,
            "stock_uom": item.stock_uom
        }
        
        return product
        
    except Exception as e:
        frappe.log_error(f"Showcase Barcode Error: {str(e)}", "Showcase API")
        return None
