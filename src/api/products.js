import api from './client'

export const productsApi = {
  // Fetch product details (productId, productName, manufacturerName, status)
  getProductDetails: (productId) => {
    return api.get('/v1/products/details', {
      params: { productId: String(productId).trim() },
    })
  },
}

