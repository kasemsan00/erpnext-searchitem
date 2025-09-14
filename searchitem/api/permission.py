import frappe
from frappe import _

def has_app_permission():
    """
    Check if user has permission to access the searchitem app
    """
    try:
        # Allow access to all authenticated users
        if frappe.session.user == "Guest":
            return False
        
        # Check if user has Item read permission
        if not frappe.has_permission("Item", "read"):
            return False
        
        return True
        
    except Exception:
        return False

def get_user_permissions():
    """
    Get user permissions for searchitem functionality
    """
    try:
        user = frappe.get_doc("User", frappe.session.user)
        
        permissions = {
            "can_read_items": frappe.has_permission("Item", "read"),
            "can_write_items": frappe.has_permission("Item", "write"),
            "can_create_items": frappe.has_permission("Item", "create"),
            "can_delete_items": frappe.has_permission("Item", "delete"),
            "can_read_warehouses": frappe.has_permission("Warehouse", "read"),
            "can_read_suppliers": frappe.has_permission("Supplier", "read"),
            "is_system_manager": "System Manager" in frappe.get_roles(),
            "is_stock_user": "Stock User" in frappe.get_roles(),
            "is_purchase_user": "Purchase User" in frappe.get_roles()
        }
        
        return permissions
        
    except Exception as e:
        frappe.log_error(f"Searchitem Permission Error: {str(e)}", "Searchitem API")
        return {}

def validate_item_access(item_code):
    """
    Validate if user has access to specific item
    """
    try:
        if not frappe.has_permission("Item", "read"):
            frappe.throw(_("You don't have permission to read items"))
        
        # Check if item exists and is not disabled
        item = frappe.get_doc("Item", item_code)
        if item.disabled:
            frappe.throw(_("Item is disabled"))
        
        return True
        
    except Exception as e:
        frappe.log_error(f"Searchitem Item Access Error: {str(e)}", "Searchitem API")
        return False
