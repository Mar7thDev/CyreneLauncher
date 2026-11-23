# Cyrene Launcher v1.3.0 · Account Edition

This Windows portable edition signs in with a Cyrene website password or browser device approval.
Guest access is local to this session. It can start a user-selected `StarRail.exe` with its original
configuration. It does not ship patch DLLs, install certificates, change proxies, redirect game
traffic, or change server channels. Its binary has a distinct name and is not an automatic
replacement for the cloud-channel launcher.

Build with Node 22, Go and Wails v3. From the repository root, generate the account bindings with
`wails3 generate bindings -clean=false -ts -noevents ./accountclient`. From `frontend`, run
`npx --no-install vite build --config vite.account.config.ts`. Back at the root, run:

```sh
wails3 generate syso -arch amd64 -icon build/windows/icon.ico -manifest accountclient/windows.manifest -info build/windows/info.json -out accountclient/wails_windows_amd64.syso
go build -tags production -trimpath -ldflags="-s -w -H windowsgui" -o bin/cyrene-launcher-account.exe ./accountclient
```
