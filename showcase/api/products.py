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
        
        # Use optimized search query
        products = frappe.get_all(
            "Item",
            fields=[
                "name", "item_name", "item_code", "description", 
                "standard_rate", "image", "item_group", "stock_uom"
            ],
            filters=[
                ["disabled", "=", 0],
                ["is_stock_item", "=", 1],
                ["item_name", "like", f"%{query}%"]
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
