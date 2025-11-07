import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import conn from './src/config/db.js'
import errorHandler from './src/middleware/errorHandler.js'

// Import routes
import productRoutes from './src/routes/productRoutes.js'
import categoryRoutes from './src/routes/categoryRoutes.js'
import orderRoutes from './src/routes/orderRoutes.js'
import userRoutes from './src/routes/userRoutes.js'
import settingsRoutes from './src/routes/settingsRoutes.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))  // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }))


// Routes
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/settings', settingsRoutes)


// Error handler
app.use(errorHandler)

// Connect to database and start server
conn().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`)
    console.log(`📊 Database connected`)
  })
}).catch((error) => {
  console.error('Failed to connect to database:', error)
  process.exit(1)
})