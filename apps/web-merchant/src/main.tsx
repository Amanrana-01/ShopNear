import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import './i18n'
import './index.css'
import App from './App'
import { AuthProvider } from '@/state/AuthContext'
import { ShopProvider } from '@/state/ShopContext'
import { ToastProvider } from '@/components/ui/Toast'
import { IncomingOrdersProvider } from '@/state/IncomingCountContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ShopProvider>
            <ToastProvider>
              <IncomingOrdersProvider>
                <App />
              </IncomingOrdersProvider>
            </ToastProvider>
          </ShopProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
