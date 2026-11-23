import { AccountService } from '@bindings/cyrene-launcher/internal/account-service'
import { AppService } from '@bindings/cyrene-launcher/internal/app-service'

export async function openAccountProfile() {
    const base = await AccountService.GetWebBaseURL()
    await AppService.OpenURL(base + "/profile")
}
