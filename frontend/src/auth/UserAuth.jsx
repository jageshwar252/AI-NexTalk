import React, { useContext } from 'react'
import { UserContext } from '../context/user-context'
import { Navigate } from 'react-router-dom'

const UserAuth = ({ children }) => {
    const { user, isBootstrapping } = useContext(UserContext)

    if (isBootstrapping) {
        return (
            <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-200">
                <p className="text-sm tracking-wide">Loading workspace...</p>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return (
        <>
            {children}
        </>
    )
}

export default UserAuth
