# Seein E-Commerce Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string and other configurations.

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `GET /api/categories/slug/:slug` - Get category by slug
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Orders
- `POST /api/orders` - Create order (Public - allows guest orders)
- `GET /api/orders/myorders` - Get user's orders (Private)
- `GET /api/orders/:id` - Get single order (Private)
- `GET /api/orders` - Get all orders (Admin)
- `PUT /api/orders/:id` - Update order status (Admin)
- `DELETE /api/orders/:id` - Delete order (Admin)

### Users
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (Private)
- `PUT /api/users/profile` - Update user profile (Private)
- `GET /api/users` - Get all users (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)
- `PUT /api/users/:id/role` - Update user role (Admin)

## Authentication

Include JWT token in requests:
```
Authorization: Bearer <token>
```

## Models

### Product
- name, description, price, category, stock, imageUrl, images, featured, rating, numReviews

### User
- name, email, password, role (admin/user/guest), phone, address, isGuest

### Category
- name, description, slug, image, isActive

### Order
- user, orderItems, shippingInfo, paymentInfo, prices, orderStatus, isGuestOrder

