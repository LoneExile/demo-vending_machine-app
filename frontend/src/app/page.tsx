import {Nav} from '@/components/nav'
import Footer from '@/components/footer'
import Connent from '@/components/content'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen justify-between">
      <Nav />
      <main className="mt-2">
        <Connent />
      </main>
      <Footer />
    </div>
  )
}