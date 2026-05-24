
export default function Footer() {
    return(
        <footer className="footer footer-horizontal footer-center bg-base-200 text-base-content rounded p-10">
            <aside>
                <p>Copyright © {new Date().getFullYear()} - Cyrene Launcher (Powered by Wails & DaisyUI)</p>
            </aside>
        </footer>
    )
}
