# Cedar Phoenix E-Commerce Frontend

A modern, responsive e-commerce website built with React and Vite.

## Features

- ✅ Responsive navbar with sidebar navigation
- ✅ Sticky bottom navigation for mobile
- ✅ Shopping cart with local storage
- ✅ Product listing with search and filter
- ✅ Guest checkout system
- ✅ Contact page
- ✅ Admin navigation in sidebar
- ✅ Context-based state management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── NavBar.jsx          # Top navigation with sidebar
│   ├── BottomNav.jsx        # Bottom navigation for mobile
│   └── ShoppingCart.jsx     # Shopping cart sidebar
├── pages/
│   ├── Home.jsx             # Homepage
│   ├── Products.jsx         # Products listing
│   ├── Checkout.jsx         # Checkout form
│   └── Contact.jsx          # Contact page
├── context/
│   ├── CartContext.jsx      # Cart state management
│   └── AuthContext.jsx      # User authentication
├── App.jsx                  # Main app component
└── main.jsx                 # Entry point
```

## Features Overview

### Navigation
- **Top Navbar**: Logo, search, wishlist, cart, user account
- **Category Bar**: Quick access to product categories (desktop)
- **Sidebar**: Categories, account links, help, and admin section
- **Bottom Nav**: Home, Products, Cart, Categories, Contact (mobile)

### Shopping Cart
- Add/remove items
- Update quantities
- Persistent storage (localStorage)
- Real-time cart count badge
- Slide-out cart panel

### Checkout
- Guest checkout support
- Shipping information form
- Order summary
- Tax and shipping calculation

## Technologies

- React 18
- React Router DOM
- Context API for state management
- CSS3 with custom properties
- Vite for build tooling

## API Integration

Update the API base URL in checkout and products pages:
```javascript
const API_URL = 'http://localhost:3000/api'
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
