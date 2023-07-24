import { useEffect } from 'react'
import jwtDecode from 'jwt-decode'
import axiosInstance from '../utils/axios'
import { useSelector, useDispatch } from 'react-redux'
import { clearTokens, getTokens, setTokens } from '../utils/token'
import useIsMountedRef from '../hook/useIsMountedRef'
import { initialise } from '../data/authSlice'
import { RootState } from '@src/modules/shared/store'

interface AuthProviderProps {
  children: React.ReactNode
}

interface JwtPayload {
  exp: number
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const isMounted = useIsMountedRef()

  const { isInitialised } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()

  const isValidToken = (token: string) => {
    const decoded: JwtPayload = jwtDecode(token)
    const currentTime = Date.now() / 1000
    return decoded.exp > currentTime
  }

  useEffect(() => {
    if (!isMounted.current) {
      return
    }

    async function fetchUser() {
      const { refresh_token } = getTokens()
      if (refresh_token && isValidToken(refresh_token)) {
        const response = await axiosInstance.post('/whoami', { refresh_token })
        const { access_token, user } = response.data.data
        setTokens(access_token)
        dispatch(initialise({ isAuthenticated: true, user }))
      } else {
        dispatch(initialise({ isAuthenticated: false, user: null }))
        clearTokens()
      }
    }

    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isInitialised) {
    return <p>SplashScreen</p>
  }

  return <>{children}</>
}

export default AuthProvider