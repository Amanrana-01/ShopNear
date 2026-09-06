import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireLocation } from '@/components/RequireLocation'
import LocationGate from '@/pages/LocationGate'
import Login from '@/pages/Login'
import Story from '@/pages/Story'
import Home from '@/pages/Home'
import SearchResults from '@/pages/SearchResults'
import MultiItemSearch from '@/pages/MultiItemSearch'
import ProductDetail from '@/pages/ProductDetail'
import ShopPage from '@/pages/ShopPage'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import OrderHistory from '@/pages/OrderHistory'
import OrderDetail from '@/pages/OrderDetail'
import Account from '@/pages/Account'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LocationGate />} />
      <Route path="/login" element={<Login />} />
      <Route path="/story" element={<Story />} />

      <Route element={<RequireLocation />}>
        <Route element={<AppShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/multi-search" element={<MultiItemSearch />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/shop/:id" element={<ShopPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/account" element={<Account />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
