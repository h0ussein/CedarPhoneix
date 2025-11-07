import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cedar_phoenix_cart')
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cedar_phoenix_cart', JSON.stringify(cartItems))
  }, [cartItems])

  // Helper function to create unique key for cart items based on product ID, size, and color
  const getItemKey = (item) => {
    return `${item._id}_${item.selectedSize || 'no-size'}_${item.selectedColor || 'no-color'}`
  }

  const addToCart = (product, quantity = 1) => {
    // Check if product is out of stock
    if (product.stock === 0 || product.stock < 1) {
      toast.error('This product is out of stock', {
        icon: '⚠️',
        style: {
          background: '#ef4444',
          color: '#fff',
        }
      })
      return
    }

    // Check if exact same variant (product ID + size + color) exists
    const productKey = getItemKey(product)
    const existingItem = cartItems.find(item => getItemKey(item) === productKey)
    
    if (existingItem) {
      // Same product with same size and color - update quantity
      const newQuantity = existingItem.quantity + quantity
      
      // Check if new quantity exceeds available stock
      if (newQuantity > product.stock) {
        toast.error(`Only ${product.stock} units available in stock`, {
          icon: '⚠️',
          style: {
            background: '#ef4444',
            color: '#fff',
          }
        })
        return
      }

      setCartItems(prevItems =>
        prevItems.map(item =>
          getItemKey(item) === productKey
            ? { ...item, quantity: newQuantity }
            : item
        )
      )
      toast.success(`Updated quantity in cart`, {
        icon: '🛒',
        style: {
          background: '#ecfdf5',
          color: '#065f46',
          border: '2px solid #10b981',
        }
      })
    } else {
      // Different variant (different size/color) - add as new item
      // Check if requested quantity exceeds available stock
      if (quantity > product.stock) {
        toast.error(`Only ${product.stock} units available in stock`, {
          icon: '⚠️',
          style: {
            background: '#ef4444',
            color: '#fff',
          }
        })
        return
      }

      setCartItems(prevItems => [...prevItems, { ...product, quantity }])
      toast.success(`Added to cart successfully!`, {
        icon: '✅',
        style: {
          background: '#ecfdf5',
          color: '#065f46',
          border: '2px solid #10b981',
        }
      })
    }
  }

  const updateQuantity = (itemKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemKey)
      return
    }
    
    const item = cartItems.find(item => getItemKey(item) === itemKey)
    if (!item) return

    // Check if quantity exceeds available stock
    if (item.stock !== undefined && quantity > item.stock) {
      toast.error(`Only ${item.stock} units available in stock`, {
        icon: '⚠️',
        style: {
          background: '#ef4444',
          color: '#fff',
        }
      })
      return
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        getItemKey(item) === itemKey ? { ...item, quantity } : item
      )
    )
  }

  const updateCartItem = (productId, updates, originalItem = null) => {
    // If originalItem is provided (when updating from checkout), use it to find the exact item
    let item
    if (originalItem) {
      const originalKey = getItemKey(originalItem)
      item = cartItems.find(cartItem => getItemKey(cartItem) === originalKey)
    } else {
      // Find first matching product ID (should only be one if no variants)
      item = cartItems.find(item => item._id === productId)
    }
    
    if (!item) return

    // Check if new quantity exceeds available stock
    if (updates.quantity !== undefined && updates.quantity > item.stock) {
      toast.error(`Only ${item.stock} units available in stock`, {
        icon: '⚠️',
        style: {
          background: '#ef4444',
          color: '#fff',
        }
      })
      return
    }

    // Create updated item
    const updatedItem = { ...item, ...updates }
    const updatedKey = getItemKey(updatedItem)
    const currentKey = getItemKey(item)
    
    // Check if the updated variant already exists as a different item
    const existingItemWithSameVariant = cartItems.find(
      cartItem => getItemKey(cartItem) === updatedKey && getItemKey(cartItem) !== currentKey
    )

    // If updating to a variant that already exists as a different item, merge quantities instead
    if (existingItemWithSameVariant) {
      const newQuantity = existingItemWithSameVariant.quantity + (updates.quantity || item.quantity)
      
      if (newQuantity > item.stock) {
        toast.error(`Only ${item.stock} units available in stock`, {
          icon: '⚠️',
          style: {
            background: '#ef4444',
            color: '#fff',
          }
        })
        return
      }

      // Remove the old item and update the existing one
      setCartItems(prevItems => {
        return prevItems
          .filter(cartItem => getItemKey(cartItem) !== currentKey)
          .map(cartItem =>
            getItemKey(cartItem) === updatedKey
              ? { ...cartItem, quantity: newQuantity }
              : cartItem
          )
      })
    } else {
      // Update the item normally
      setCartItems(prevItems =>
        prevItems.map(cartItem =>
          getItemKey(cartItem) === currentKey
            ? { ...cartItem, ...updates }
            : cartItem
        )
      )
    }

    toast.success(`Cart item updated successfully!`, {
      icon: '✅',
      style: {
        background: '#ecfdf5',
        color: '#065f46',
        border: '2px solid #10b981',
      }
    })
  }

  const removeFromCart = (itemKey) => {
    const item = cartItems.find(item => getItemKey(item) === itemKey)
    setCartItems(prevItems => prevItems.filter(item => getItemKey(item) !== itemKey))
    if (item) {
      toast.success(`Item removed from cart`, {
        icon: '🗑️',
        style: {
          background: '#ef4444',
          color: '#fff',
        }
      })
    }
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen)
  }

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCartItem,
    clearCart,
    getCartTotal,
    getCartCount,
    isCartOpen,
    toggleCart,
    setIsCartOpen
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

