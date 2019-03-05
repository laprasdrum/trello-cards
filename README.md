# trello cards

show trello board's cards via Slack App

## Requirements

- Trello API Key & Token
- Your Slack App with:
  - Incoming Webhook
  - Bots
- [Google App Script](https://script.google.com/home)

## setup

```sh
nvm install
nvm use
npm i
npx clasp login
npx clasp create __your_project_name_here__ --rootDir ./src
```

## deploy

```sh
cd src
npx clasp push
```
