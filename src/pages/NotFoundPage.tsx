// src/pages/NotFoundPage.tsx
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center page-transition">
      <p className="text-6xl font-black text-muted-foreground">404</p>
      <h2 className="mt-4 text-xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Button className="mt-6" onClick={() => navigate('/scan')}>
        Go to Scanner
      </Button>
    </div>
  )
}
