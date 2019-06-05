const socket = io()

socket.on('query', result => renderSearchResult(result))

$('#searchSongs').submit((e) => {
  e.preventDefault()
  socket.emit('searching', $('#numberSearch').val())
  $('#numberSearch').val('')
  return false
})