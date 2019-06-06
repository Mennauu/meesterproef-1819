const form = document.getElementById("searchArtist")
let formData = new FormData(form)
const request = new XMLHttpRequest()

form.addEventListener("submit", submitHandler)

function submitHandler(e) {
  e.preventDefault()

  request.open('POST', '/search-artist', true)
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
  request.send(formData)
}