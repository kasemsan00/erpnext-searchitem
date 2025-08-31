# ERPNext Showcase

A Frappe/ERPNext app for showcasing products with barcode scanning and search functionality.

## Features

- **Product Showcase**: Display products in a responsive grid layout
- **Search Functionality**: Search products by name or item code
- **Barcode Scanning**: Scan barcodes to quickly find products
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Performance Optimized**: Efficient queries and caching for better performance
- **ERPNext Integration**: Seamless integration with ERPNext Item management

## Installation

### Using Frappe Bench

```bash
# Get the app
bench get-app --branch main https://github.com/kasemsan00/erpnext-showcase

# Install the app
bench --site your-site.com install-app showcase
```

### Using Docker (Frappe Docker)

Add the app to your `apps.json`:

```json
[
  { "url": "https://github.com/frappe/erpnext", "branch": "version-15" },
  { "url": "https://github.com/frappe/hrms", "branch": "version-15" },
  { "url": "https://github.com/kasemsan00/erpnext-showcase", "branch": "main" }
]
```

## Usage

1. **Access the Showcase**: Navigate to `/showcase` on your ERPNext site
2. **Search Products**: Use the search bar to find products by name or code
3. **Scan Barcodes**: Click the scan button to use barcode scanning (requires barcode scanner setup)
4. **Filter Products**: Use category and sorting filters to organize products
5. **View Details**: Click on any product card to view detailed information

## App Structure

```
showcase/
├── api/
│   ├── __init__.py
│   ├── products.py          # Product API endpoints
│   └── permission.py        # Permission controls
├── public/
│   ├── css/
│   │   └── showcase.css     # App styles
│   └── js/
│       └── showcase.js      # App JavaScript
├── templates/
│   └── pages/
│       └── showcase.html    # Main showcase page
├── __init__.py
├── hooks.py                 # App configuration
└── modules.txt             # App modules
```

## API Endpoints

### Get Products

```
GET /api/method/showcase.api.products.get_products
```

### Search Products

```
GET /api/method/showcase.api.products.search_products?query=search_term
```

### Get Product by Barcode

```
GET /api/method/showcase.api.products.get_product_by_barcode?barcode=barcode_value
```

### Get Product Details

```
GET /api/method/showcase.api.products.get_product_details?item_code=item_code
```

## Performance Optimizations

- **Optimized Queries**: Uses specific field selection to reduce data transfer
- **Debounced Search**: 300ms debounce on search input to reduce API calls
- **Lazy Loading**: Load more products on demand
- **Image Optimization**: Proper image handling with fallbacks
- **Caching**: Efficient caching strategies for better performance

## Configuration

### Hooks Configuration

The app can be configured through `hooks.py`:

```python
# Add to apps screen
add_to_apps_screen = [
    {
        "name": "showcase",
        "logo": "/assets/showcase/logo.png",
        "title": "ERPNext Showcase",
        "route": "/showcase",
        "has_permission": "showcase.api.permission.has_app_permission"
    }
]

# Include CSS and JS
app_include_css = "/assets/showcase/css/showcase.css"
app_include_js = "/assets/showcase/js/showcase.js"
web_include_css = "/assets/showcase/css/showcase.css"
web_include_js = "/assets/showcase/js/showcase.js"
```

## Permissions

The app respects ERPNext permissions:

- Users need `Item` read permission to access the showcase
- System Managers have full access
- Stock Users and Purchase Users have appropriate access levels

## Development

### Prerequisites

- Frappe Framework v15+
- ERPNext v15+
- Python 3.10+

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/kasemsan00/erpnext-showcase
cd erpnext-showcase

# Install in development mode
bench get-app . --overwrite
bench --site your-site.com install-app showcase
```

### Running Tests

```bash
bench --site your-site.com run-tests --module showcase
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Contact: kasemsan.cho@gmail.com

## Changelog

### Version 1.0.0

- Initial release
- Product showcase functionality
- Search and barcode scanning
- Responsive design
- Performance optimizations
