import { Navigate } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { isFeatureEnabled, type FeatureKey } from "@/config/features"

interface FeatureGateProps {
    children: ReactNode
    feature: FeatureKey
}

export default function FeatureGate({ children, feature }: FeatureGateProps) {
    if (!isFeatureEnabled(feature)) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
