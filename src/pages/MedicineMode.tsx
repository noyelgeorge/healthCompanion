// This page has been superseded by the new Medicine Hub at /medicine.
// Routing is handled via App.tsx -> src/medicine/MedicineMode.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function MedicineModeRedirect() {
    const navigate = useNavigate()
    useEffect(() => {
        navigate('/medicine', { replace: true })
    }, [navigate])
    return null
}
