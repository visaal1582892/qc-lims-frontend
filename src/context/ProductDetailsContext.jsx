import { useCallback, useMemo, useState } from 'react'
import { ProductDetailsContext } from './productDetailsContext'
import ProductDetailsModal from '../components/ProductDetailsModal'

export function ProductDetailsProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    productId: null,
    openNonce: 0,
  })

  const openProductDetails = useCallback((productId) => {
    const trimmed = productId != null ? String(productId).trim() : ''
    if (!trimmed) return
    setModalState((prev) => ({
      isOpen: true,
      productId: trimmed,
      openNonce: prev.openNonce + 1,
    }))
  }, [])

  const closeProductDetails = useCallback(() => {
    setModalState((prev) => ({
      isOpen: false,
      productId: null,
      openNonce: prev.openNonce,
    }))
  }, [])

  const value = useMemo(
    () => ({ openProductDetails, closeProductDetails }),
    [openProductDetails, closeProductDetails]
  )

  return (
    <ProductDetailsContext.Provider value={value}>
      {children}
      <ProductDetailsModal
        productId={modalState.productId}
        isOpen={modalState.isOpen}
        openNonce={modalState.openNonce}
        onClose={closeProductDetails}
      />
    </ProductDetailsContext.Provider>
  )
}

