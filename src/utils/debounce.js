export function debounce(fn, wait) {
  let timer = null

  function debounced(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }

  debounced.cancel = () => clearTimeout(timer)

  return debounced
}
