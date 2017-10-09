module.exports = function _fastIndexOf (str, char) {
  let index = -1
  for (let i = 0; i < str.length; i++) {
    if (str[i] === char) {
      index = i
      break
    }
  }
  return index
}
