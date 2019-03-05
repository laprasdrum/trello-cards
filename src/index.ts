const properties = PropertiesService.getScriptProperties()
const SLACK_WEBHOOK_URL: string = properties.getProperty('SLACK_WEBHOOK_URL')
const TRELLO_KEY: string = properties.getProperty('TRELLO_KEY')
const TRELLO_TOKEN: string = properties.getProperty('TRELLO_TOKEN')

const MESSAGE_EMPTY_SEARCH_WORD: string = properties.getProperty('MESSAGE_EMPTY_SEARCH_WORD')
const MESSAGE_BOARD_NOT_FOUND: string = properties.getProperty('MESSAGE_BOARD_NOT_FOUND')
const MESSAGE_BOARD_LIST_HERE: string = properties.getProperty('MESSAGE_BOARD_LIST_HERE')
const MESSAGE_CARD_NOT_FOUND: string = properties.getProperty('MESSAGE_CARD_NOT_FOUND')

const HOST: string = 'https://api.trello.com'

interface Card {
  name: string;
}

interface List {
  name: string;
  cards: [Card];
}

interface Board {
  id: string;
  name: string;
  shortUrl: string;
}

function baseParams() {
  return 'key=' + TRELLO_KEY + '&token=' + TRELLO_TOKEN
}

function getBoards(): [Board] {
  let response = UrlFetchApp.fetch(
    HOST + '/1/members/me/boards?' + this.baseParams() + '&filter=all&fields=all&lists=none&memberships=none&organization=false&organization_fields=name%2CdisplayName',
    { method: 'get', contentType: 'application/json' }
  )
  return JSON.parse(response.getContentText())
}

function getListsOfBoard(id: string): [List] {
  let response = UrlFetchApp.fetch(
    HOST + '/1/boards/' + id + '/lists?' + this.baseParams() + '&cards=open&card_fields=name&filter=open&fields=name',
    { method: 'get', contentType: 'application/json' }
  )
  return JSON.parse(response.getContentText())
}

function message(e): string {
  if (e == null || e.parameter == null || e.parameter.text == null || e.parameter.text.split(' ', 2)[1] == null) return `${MESSAGE_EMPTY_SEARCH_WORD}`

  let searchingBoard = e.parameter.text.split(' ').shift().join(' ')

  let boards = getBoards()
  if (boards == null || boards.length <= 0 || boards.map(b => b.name).indexOf(searchingBoard) == -1) {
    var emptyError = `${MESSAGE_BOARD_NOT_FOUND}`
    if (boards.length > 0) {
      emptyError += `\n${MESSAGE_BOARD_LIST_HERE}\n` + boards.map(b => b.name).join('\n')
    }
    return emptyError
  }

  var board: Board
  for (var b of boards) {
    if (b.name == searchingBoard) {
      board = b
      break
    }
  }
  let lists = getListsOfBoard(board.id)
  return ':trello: ' + board.shortUrl + '\n' +
    lists.map(function (l) {
      let listMessage = '*' + l.name + '*'
      let cardsMessage = l.cards.length <= 0 ? `\n${MESSAGE_CARD_NOT_FOUND}` : '\n' + l.cards.map(c => c.name).join('\n')
      return listMessage + cardsMessage
    }).join('\n')
}

function postParams(e) {
  return {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      text: message(e).replace(/":"/g, '\"\:\"')
    })
  }
}

function postToSlack(params) {
  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, params)
}

function doPost(e) {
  postToSlack(postParams(e))
}