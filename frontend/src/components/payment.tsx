'use client'
import Link from 'next/link'
import {useState} from 'react'
import {useStore} from '@nanostores/react'
import {cartStorage} from '@/utils/stores'
import {useRouter} from 'next/navigation'

type ListItemProps = {
  pocketItem: PocketItem
  setPocketItem: (item: PocketItem) => void
}

function ListItem({pocketItem, setPocketItem}: ListItemProps) {
  const [count, setCount] = useState(pocketItem.quantity)

  const increase = () => {
    setCount((prevCount) => {
      const newCount = prevCount + 1
      setPocketItem({
        ...pocketItem,
        quantity: newCount,
        total: newCount * pocketItem.denomination_value,
      })
      return newCount
    })
  }

  const decrease = () => {
    if (count > 0) {
      setCount((prevCount) => {
        const newCount = prevCount - 1
        setPocketItem({
          ...pocketItem,
          quantity: newCount,
          total: newCount * pocketItem.denomination_value,
        })
        return newCount
      })
    }
  }

  return (
    <tr>
      <td>
        <div className="flex items-center space-x-3">
          <div className="avatar"></div>
          <div>
            <div className="font-bold ml-12 ">
              {pocketItem.typed === 'coin' ? '🪙' : '💵'}{' '}
              {pocketItem.denomination_value} THB
            </div>
          </div>
        </div>
      </td>
      <td>
        <div className="flex items-center space-x-2">
          <button className="btn btn-primary" onClick={decrease}>
            -
          </button>

          <input
            type="number"
            className="input input-bordered w-20"
            value={count}
            readOnly
          />

          <button className="btn btn-primary" onClick={increase}>
            +
          </button>
        </div>
      </td>
      <td>{pocketItem.total}</td>
    </tr>
  )
}

async function sendCartAndPocket(cart: Cart, pocket: Pocket) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_SERVER_IP_HOST + '/billing',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({cart, pocket}),
        credentials: 'include',
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    return data
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        'There was a problem with the fetch operation: ' + error.message
      )
    }
  }
}

export default function Payment({denominations}: DenominationsResponse) {
  const local = useStore(cartStorage)
  const cart: Cart = JSON.parse(local.products)
  const denominationsList: Denomination[] = JSON.parse(local.pocket)
  if (denominationsList.length === 0) {
    const pocketItem: PocketItem[] = denominations.map((item) => {
      return {
        ...item,
        quantity: 0,
        total: 0,
      }
    })
    const pocket: Pocket = {
      items: pocketItem,
      balance: 0,
    }
    cartStorage.setKey('pocket', JSON.stringify(pocket))
  }

  function getPocket() {
    const local = cartStorage.get()
    const pocket: Pocket = JSON.parse(local.pocket)
    return pocket
  }

  function updatePocket(pocket: Pocket) {
    const pocketItem: PocketItem[] = pocket.items
    let total = 0
    pocketItem.forEach((item) => {
      total += item.total
    })
    pocket.balance = total
    cartStorage.setKey('pocket', JSON.stringify(pocket))
  }

  const $pocket = getPocket()

  function calculateChange() {
    const total = $pocket.balance
    const paid = cart.total
    const change = total - paid
    return change
  }

  async function checkout() {
    const local = cartStorage.get()
    const pocket: Pocket = JSON.parse(local.pocket)
    const cart: Cart = JSON.parse(local.products)
    const data = await sendCartAndPocket(cart, pocket)
    return data
  }
  const router = useRouter()
  async function handlePayment() {
    const billsData = await checkout()
    cartStorage.setKey('bills', JSON.stringify(billsData))
    router.push('/payment/bill')
  }
  return (
    <>
      <div className="collapse bg-base-200 mb-2">
        <input type="radio" name="my-accordion-2" defaultChecked={true} />
        <div className="collapse-title text-xl font-medium">
          <div className="flex justify-between">
            <div>Pocket</div>
            <div>{$pocket.balance} THB</div>
          </div>
        </div>
        <div className="collapse-content">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="mx-auto">
                {$pocket.items?.map((item, index) => (
                  <ListItem
                    key={index}
                    pocketItem={item}
                    setPocketItem={(updatedItem: PocketItem) => {
                      const newItems = [...$pocket.items]
                      newItems[index] = updatedItem
                      const updatedPocket = {...$pocket, items: newItems}
                      cartStorage.setKey(
                        'pocket',
                        JSON.stringify(updatedPocket)
                      )
                      let myPocket = getPocket()
                      updatePocket(myPocket)
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="card shadow-lg bg-base-100 my-4">
        <div className="card-body">
          <div className="flex justify-between">
            <div>Total Payment</div>
            <div>{cart.total} THB</div>
          </div>
          <div className="flex justify-between">
            <div>My Pocket</div>
            <div>{$pocket.balance} THB</div>
          </div>
          <div className="flex justify-between">
            <div>Change</div>
            <div
              className={
                calculateChange() < 0 ? 'text-red-500' : 'text-green-500'
              }
            >
              {calculateChange()} THB
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between m-4">
        <Link href="/checkout">
          <button className="btn btn-primary">Back</button>
        </Link>

        <button
          className="btn btn-primary"
          disabled={calculateChange() < 0 ? true : false}
          onClick={handlePayment}
        >
          Pay
        </button>
      </div>
    </>
  )
}
