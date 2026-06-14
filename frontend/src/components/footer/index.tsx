
import { launcherConfig } from "@/config/launcher"

export default function Footer() {
    return(
        <footer className="footer footer-horizontal footer-center launcher-info-panel rounded p-10">
            <aside>
                <p>Copyright © {new Date().getFullYear()} - {launcherConfig.appName} (Powered by Wails & DaisyUI)</p>
            </aside>
        </footer>
    )
}
