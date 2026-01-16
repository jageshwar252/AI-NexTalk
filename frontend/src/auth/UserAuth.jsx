import React, { useContext, useEffect} from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate } from 'react-router-dom'

const UserAuth = ({ children }) => {

    const { user } = useContext(UserContext)
    const[loading, setLoading] = React.useState(true)
    const token = localStorage.getItem('token')
    const navigate = useNavigate()

    useEffect(()=>{
        if(user){
            setLoading(false)
        }
        if(!token){
            navigate('/login')
        }
        if(!user){
            navigate('/login')
        }
    },[])

    if(loading){
        return <div>Loading...</div>
    }

    return (
        <div>
            {children}
        </div>
    )
}

export default UserAuth
