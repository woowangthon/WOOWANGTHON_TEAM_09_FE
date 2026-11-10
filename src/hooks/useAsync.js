import { useCallback, useEffect, useState } from 'react'

// 비동기 데이터 불러오기: { data, error, loading, reload, setData }
// deps가 바뀌거나 reload()하면 다시 불러오고, 그동안 이전 data는 그대로 보여줘요.
export function useAsync(load, deps) {
  const [version, setVersion] = useState(0)
  const key = JSON.stringify([...deps, version])
  const [state, setState] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    let ignore = false
    load()
      .then((data) => { if (!ignore) setState({ key, data, error: null }) })
      .catch((error) => { if (!ignore) setState((previous) => ({ key, data: previous.data, error })) })
    return () => { ignore = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = state.key !== key
  const reload = useCallback(() => setVersion((value) => value + 1), [])
  const setData = useCallback((update) => setState((previous) => ({
    ...previous,
    data: typeof update === 'function' ? update(previous.data) : update,
  })), [])

  return { data: state.data, error: loading ? null : state.error, loading, reload, setData }
}
