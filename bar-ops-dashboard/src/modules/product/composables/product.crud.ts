// Import vue APIs
import { computed } from 'vue'

// Import validation rules
import { rules } from '@shared/utils/rules.util'

// Import stores
import { ProductsStore } from '@stores'

// Import composables
import { useCrud, useBulkUpdate } from '@shared/composables/crud.composable'

// Import providers
import { productProvider } from '@product/providers/product.provider'

// Import types
import type { ICrudStore } from '@shared/types/ICrud.types'
import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'
import type { IProduct, ICreateProduct, IUpdateProduct } from '@product/types/IProduct.types'
import type { IFormField, ISelectItem } from '@shared/types/IForm.types'

// Export product crud composable
export function useProductCrud(store: ICrudStore<IProduct>) {
  const productsStore = ProductsStore()

  // Initialize base CRUD actions
  const base = useCrud<IProduct, ICreateProduct, IUpdateProduct>(productProvider, store)

  // Initialize bulk update actions
  const { isBulkUpdating, handleBulkUpdate, takeSnapshot } = useBulkUpdate<
    IProduct,
    IUpdateProduct
  >(productProvider, store, () => productsStore.products || [])

  // Product form configuration
  const productTypeOptions = computed<ISelectItem[]>(() => {
    const allowed = [
      ProductType.ALCOHOL,
      ProductType.SODA,
      ProductType.ENERGY_DRINK,
      ProductType.ACCOMPANYING,
      ProductType.DISPOSABLE,
    ]

    return allowed.map((value) => ({
      title: ProductTypeLabels[value],
      value,
    }))
  })

  const productInitialState = (equipmentMode?: boolean): ICreateProduct => ({
    name: '',
    supplierId: '',
    price: 0,
    volume: equipmentMode ? 1 : 0,
    type: equipmentMode ? ProductType.EQUIPMENT : ProductType.SODA,
    quantity: 0,
  })

  const getProductFields = (
    suppliers: { id: string; name: string }[],
    currentForm: Partial<ICreateProduct>,
    equipmentMode?: boolean,
  ): IFormField[] => {
    const isPriceHidden = currentForm.type === ProductType.EQUIPMENT
    const isVolumeHidden =
      currentForm.type === ProductType.EQUIPMENT ||
      currentForm.type === ProductType.DISPOSABLE ||
      currentForm.type === ProductType.ACCOMPANYING

    return [
      {
        key: 'name',
        label: 'שם המוצר*',
        type: 'text',
        rules: [rules.required('שדה שם הוא חובה')],
      },
      {
        key: 'supplierId',
        label: 'בחר ספק*',
        type: 'select',
        items: suppliers.map((s) => ({ title: s.name, value: s.id })),
        rules: [rules.required()],
      },
      {
        key: 'type',
        label: 'סוג מוצר*',
        type: 'select',
        items: productTypeOptions.value,
        hidden: !!equipmentMode,
        rules: [rules.required('חובה לבחור סוג')],
      },
      {
        key: 'price',
        label: 'מחיר( בלי מע"מ )*',
        type: 'number',
        props: { prefix: '₪' },
        hidden: isPriceHidden,
        rules: [rules.required('שדה מחיר הוא חובה')],
      },
      {
        key: 'volume',
        label: 'נפח (מ״ל)*',
        type: 'number',
        hidden: isVolumeHidden,
        rules: [rules.required('שדה נפח הוא חובה')],
      },
    ]
  }

  return {
    ...base,
    isBulkUpdating,
    handleBulkUpdate,
    takeSnapshot,
    productInitialState,
    getProductFields,
  }
}
