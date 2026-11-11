import { useContext } from 'react'
import { ProductDetailsContext } from '../context/productDetailsContext'

export function useProductDetails() {
  const ctx = useContext(ProductDetailsContext)
  if (!ctx) {
    throw new Error('useProductDetails must be used within ProductDetailsProvider')
  }
  return ctx
}

