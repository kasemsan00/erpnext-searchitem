# -*- coding: utf-8 -*-
"""
Search item Module
==================

This module handles the search item functionality for displaying products
by scanning barcode or searching by name.
"""

import frappe
from frappe import _

def get_context(context):
    """Get context for searchitem pages"""
    context.update({
        "title": _("Search item"),
        "searchitem_products": get_searchitem_products()
    })

def get_searchitem_products():
    """Get products for searchitem display"""
    try:
        products = frappe.get_all(
            "Item",
            filters={"show_in_searchitem": 1, "disabled": 0},
            fields=["name", "item_name", "item_code", "image", "description"],
            limit=20
        )
        return products
    except Exception as e:
        frappe.log_error(f"Error fetching searchitem products: {str(e)}")
        return []

def search_products(search_term):
    """Search products by name or code"""
    try:
        products = frappe.get_all(
            "Item",
            filters={
                "disabled": 0,
                "or": [
                    ["item_name", "like", f"%{search_term}%"],
                    ["item_code", "like", f"%{search_term}%"]
                ]
            },
            fields=["name", "item_name", "item_code", "image", "description"],
            limit=10
        )
        return products
    except Exception as e:
        frappe.log_error(f"Error searching products: {str(e)}")
        return []

def get_product_by_barcode(barcode):
    """Get product by barcode"""
    try:
        # First try to find by barcode field if it exists
        products = frappe.get_all(
            "Item",
            filters={"barcode": barcode, "disabled": 0},
            fields=["name", "item_name", "item_code", "image", "description"],
            limit=1
        )
        
        if not products:
            # If no barcode field, try by item_code
            products = frappe.get_all(
                "Item",
                filters={"item_code": barcode, "disabled": 0},
                fields=["name", "item_name", "item_code", "image", "description"],
                limit=1
            )
        
        return products[0] if products else None
    except Exception as e:
        frappe.log_error(f"Error fetching product by barcode: {str(e)}")
        return None
