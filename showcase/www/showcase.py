import frappe

def get_context(context):
	"""
	Get context for showcase page
	"""
	context.title = "Search item"
	context.show_sidebar = False
	context.no_cache = True
	
	# Ensure user has permission to view showcase
	if not frappe.has_permission("Item", "read"):
		frappe.throw("Not permitted to view showcase", frappe.PermissionError)
	
	return context
