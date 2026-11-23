import assert from 'node:assert/strict'
import test from 'node:test'

const cases = [
    ['fresh installation', undefined, 'march7th', 'https://server.march7th.cc', null],
    ['existing local test', { version: 8, state: { serverTarget: 'local_test' } }, 'local_test', 'http://localhost:21000', 'test'],
    ['existing local production', { version: 8, state: { serverTarget: 'local_prod' } }, 'local_prod', 'http://localhost:21000', 'prod'],
    ['existing custom address', { version: 8, state: { serverTarget: 'custom', customServerUrl: 'https://example.test/hsr/' } }, 'custom', 'https://example.test/hsr', null],
    ['legacy custom address', { version: 2, state: { serverTarget: 'custom', patchTargetUrl: 'https://legacy.test/' } }, 'custom', 'https://legacy.test', null],
    ['empty custom stays disconnected', { version: 8, state: { serverTarget: 'custom', customServerUrl: '' } }, 'custom', '', null],
]

for (const [label, saved, target, base, localChannel] of cases) {
    test(label, async () => {
        const entries = new Map(saved ? [['setting-storage', JSON.stringify(saved)]] : [])
        Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
            getItem: key => entries.get(key) ?? null,
            setItem: (key, value) => entries.set(key, value),
            removeItem: key => entries.delete(key),
        } })
        const url = new URL('./src/stores/settingStore.ts', import.meta.url)
        url.searchParams.set('case', label)
        const { default: store, resolveServerBaseUrl, honeyChannelFromTarget } = await import(url)
        const state = store.getState()
        assert.equal(state.serverTarget, target)
        assert.equal(resolveServerBaseUrl(state.serverTarget, state.customServerUrl), base)
        assert.equal(honeyChannelFromTarget(state.serverTarget), localChannel)
    })
}
