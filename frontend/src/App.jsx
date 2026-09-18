import { RouterProvider } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import router from './routes'

function App() {
  const { theme } = useTheme()

  return (
    <div className={theme}>
      <RouterProvider router={router} />
    </div>
  )
}

export default App
