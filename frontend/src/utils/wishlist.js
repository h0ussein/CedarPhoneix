import toast from 'react-hot-toast'

// Get wishlist from localStorage
export const getWishlist = () => {
  try {
    const savedWishlist = localStorage.getItem('cedar_phoenix_wishlist')
    return savedWishlist ? JSON.parse(savedWishlist) : []
  } catch (error) {
    console.error('Error loading wishlist:', error)
    return []
  }
}

// Check if product is in wishlist
export const isInWishlist = (productId) => {
  const wishlist = getWishlist()
  return wishlist.some(item => item._id === productId)
}

// Add product to wishlist
export const addToWishlist = (product) => {
  const currentWishlist = getWishlist()
  
  // Check if already in wishlist
  if (isInWishlist(product._id)) {
    toast.error('Product already in wishlist', {
      icon: '💔',
      style: {
        background: '#ef4444',
        color: '#fff',
      }
    })
    return false
  }

  const newWishlist = [...currentWishlist, product]
  localStorage.setItem('cedar_phoenix_wishlist', JSON.stringify(newWishlist))
  
  toast.success('Added to wishlist!', {
    icon: '❤️',
    style: {
      background: '#ec4899',
      color: '#fff',
    }
  })
  
  return true
}

// Remove product from wishlist
export const removeFromWishlist = (productId) => {
  const currentWishlist = getWishlist()
  const newWishlist = currentWishlist.filter(item => item._id !== productId)
  
  localStorage.setItem('cedar_phoenix_wishlist', JSON.stringify(newWishlist))
  
  toast.success('Removed from wishlist', {
    icon: '💔',
    style: {
      background: '#f59e0b',
      color: '#fff',
    }
  })
  
  return true
}

// Remove product from wishlist silently (no toast) - used when product is deleted
export const removeFromWishlistSilent = (productId) => {
  const currentWishlist = getWishlist()
  const newWishlist = currentWishlist.filter(item => item._id !== productId)
  localStorage.setItem('cedar_phoenix_wishlist', JSON.stringify(newWishlist))
  return true
}

// Clean up wishlist by removing products that no longer exist
export const cleanupWishlist = async (existingProductIds = []) => {
  if (existingProductIds.length === 0) {
    // Fetch all product IDs from API if not provided
    try {
      const response = await fetch('http://localhost:3000/api/products')
      const data = await response.json()
      if (data.success) {
        existingProductIds = data.data.map(p => p._id)
      }
    } catch (error) {
      console.error('Error fetching products for wishlist cleanup:', error)
      return
    }
  }

  const currentWishlist = getWishlist()
  const validWishlist = currentWishlist.filter(item => 
    existingProductIds.includes(item._id)
  )

  if (validWishlist.length !== currentWishlist.length) {
    localStorage.setItem('cedar_phoenix_wishlist', JSON.stringify(validWishlist))
    return true // Cleanup was performed
  }
  return false // No cleanup needed
}

// Toggle wishlist status
export const toggleWishlist = (product) => {
  if (isInWishlist(product._id)) {
    return removeFromWishlist(product._id)
  } else {
    return addToWishlist(product)
  }
}
