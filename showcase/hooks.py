app_name = "showcase"
app_title = "ERPNext Showcase"
app_publisher = "kasemsan"
app_description = "Show product by scan barcode or search by name"
app_email = "kasemsan.cho@gmail.com"
app_license = "MIT"
app_version = "1.0.0"

# Apps
# ------------------

# required_apps = ["erpnext"]

# Each item in the list will be shown as an app in the apps page
add_to_apps_screen = [
	{
		"name": "showcase",
		"logo": "/assets/showcase/logo.png",
		"title": "ERPNext Showcase",
		"route": "/showcase",
		"has_permission": "showcase.api.permission.has_app_permission"
	}
]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/showcase/css/showcase.css"
app_include_js = "/assets/showcase/js/showcase.js"

# include js, css files in header of web template
web_include_css = "/assets/showcase/css/showcase.css"
web_include_js = "/assets/showcase/js/showcase.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "showcase/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "showcase/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "showcase.utils.jinja_methods",
# 	"filters": "showcase.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "showcase.install.before_install"
# after_install = "showcase.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "showcase.uninstall.before_uninstall"
# after_uninstall = "showcase.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "showcase.utils.before_app_install"
# after_app_install = "showcase.utils.after_app_install"

# Migration
# ------------
# before_migrate = "showcase.utils.before_migrate"
# after_migrate = "showcase.utils.after_migrate"

# Permissions
# ------------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
# 
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"showcase.tasks.all"
# 	],
# 	"daily": [
# 		"showcase.tasks.daily"
# 	],
# 	"hourly": [
# 		"showcase.tasks.hourly"
# 	],
# 	"weekly": [
# 		"showcase.tasks.weekly"
# 	]
# 	"monthly": [
# 		"showcase.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "showcase.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "showcase.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation, along with any modifications made in other Frappe apps

