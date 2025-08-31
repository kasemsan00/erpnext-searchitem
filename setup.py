#!/usr/bin/env python3
"""
ERPNext Showcase App Setup
A simple setup file for Frappe app installation
"""

import os
import re

def get_version():
    """Get version from __init__.py"""
    try:
        version_file = os.path.join(os.path.dirname(__file__), "showcase", "__init__.py")
        with open(version_file, "r") as f:
            version_match = re.search(r"^__version__ = ['\"]([^'\"]*)['\"]", f.read(), re.M)
            if version_match:
                return version_match.group(1)
    except Exception:
        pass
    return "1.0.0"

# App metadata
APP_NAME = "showcase"
APP_VERSION = get_version()
APP_DESCRIPTION = "ERPNext Showcase - Show products by scan barcode or search by name"
APP_AUTHOR = "kasemsan"
APP_AUTHOR_EMAIL = "kasemsan.cho@gmail.com"
APP_LICENSE = "MIT"

if __name__ == "__main__":
    print(f"App: {APP_NAME}")
    print(f"Version: {APP_VERSION}")
    print(f"Description: {APP_DESCRIPTION}")
    print(f"Author: {APP_AUTHOR}")
    print(f"Email: {APP_AUTHOR_EMAIL}")
    print(f"License: {APP_LICENSE}")
