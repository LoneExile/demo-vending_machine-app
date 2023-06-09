'use client'
import Link from 'next/link'
import {useStore} from '@nanostores/react'
import {cartStorage} from '@/utils/stores'
import Image from 'next/image'

function useData() {
  const local = useStore(cartStorage)
  // const local = cartStorage.get()
  if (local) {
    return JSON.parse(local.products)
  } else {
    return {items: [], total: 0}
  }
}

function Card({product}: {product: Product}) {
  const $cart: Cart = useData()
  if (!$cart.items) {
    cartStorage.setKey('products', JSON.stringify({items: [], total: 0}))
  }

  const add = () => {
    let found = false

    const updatedItems = $cart.items.map((item) => {
      if (item.products === product.product_name) {
        found = true
        return {
          ...item,
          quantity: item.quantity + 1,
          total: item.total + parseFloat(product.price),
        }
      } else {
        return item
      }
    })

    if (!found) {
      updatedItems.push({
        id: product.id,
        products: product.product_name,
        quantity: 1,
        price: parseFloat(product.price),
        total: parseFloat(product.price),
        picture: product.picture,
      })
    }

    const updatedCart: Cart = {
      items: updatedItems,
      total: updatedItems.reduce((total, item) => total + item.total, 0),
    }

    cartStorage.setKey('products', JSON.stringify(updatedCart))
  }

  return (
    <div className="card card-compact w-52 m-4 bg-base-100 shadow-xl">
      <figure>
        {/* <Image src={product.picture} alt="item" /> */}
        <Image src={'/water.webp'} alt="item" />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{product.product_name}</h2>
        <h2 className="">{product.price} THB</h2>
        <div className="card-actions justify-end">
          <button className="btn btn-primary" onClick={add}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
export default function Connent({products}: ProductsResponse) {
  const resetStores = () => {
    cartStorage.setKey('products', JSON.stringify([]))
    cartStorage.setKey('pocket', JSON.stringify([]))
  }

  const $cart = useData()

  return (
    <>
      <div className="flex flex-wrap justify-center">
        {products?.map((product: Product, i: number) => (
          <Card key={i} product={product} />
        ))}
      </div>
      <div className="flex justify-between m-4">
        <div className="flex justify-start">
          {$cart.items?.length > 0 ? (
            <button className="btn btn-primary" onClick={resetStores}>
              Reset
            </button>
          ) : (
            <></>
          )}
        </div>

        <div className="flex justify-start">
          {$cart.items?.length > 0 ? (
            <Link href="/checkout">
              <button className="btn btn-primary">Next</button>
            </Link>
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  )
}
