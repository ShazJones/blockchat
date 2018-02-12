let leftPad = require('left-pad')
let { connect } = require('lotion');
let genesis = require('./genesis.json');
let config = require('./peers.js')
let readline = require('readline')

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.setPrompt('choose a username ~ ');

const APP_ID = "89a6244c04b9560fe2a8c75f1e75c432c00961b1ac254744866cf37fb1193e7d";

async function main() {
    let timeout = setTimeout(() => console.log('Connecting...'), 2000);
    let client;
    try {
        client = await connect(APP_ID);
        console.log('connected');
    } catch (err) {
        console.log(err);
    }

    clearTimeout(timeout);
    rl.prompt()

    let bar = '================================================================='
    let link = '                                |                                '
    function logMessage({ sender, message }, index) {
        readline.clearLine(process.stdout, 0)
        readline.cursorTo(process.stdout, 0)
        if (!(index % 3)) {
            console.log(bar)
        }
        console.log(
            '|  ' +
            sender +
            leftPad(': ', 12 - sender.length) +
            message +
            leftPad('|', 50 - message.length)
        )
        if (index % 3 === 2) {
            console.log(bar)
            console.log(link)
            console.log(link)
            console.log(link)
        }
        rl.prompt(true)
    }

    let username

    function usernameError(name) {
        if (name.length > 12) {
            return 'Username is too long'
        }
        if (name.length < 3) {
            return 'Username is too short'
        }
        if (name.indexOf(' ') !== -1) {
            return 'Username may not contain a space'
        }
        return false
    }

    rl.on('line', async line => {
        readline.moveCursor(process.stdout, 0, -1)
        readline.clearScreenDown(process.stdout)
        line = line.trim()
        if (!username) {
            let e = usernameError(line)
            if (e) {
                console.log(e)
            } else {
                username = line
                rl.setPrompt('> ')
            }
        } else {
            let message = line;
            const result = await client.send({
                message,
                sender: username
            });
            //const state = await client.getState();
            updateState(state)
        }

        rl.prompt(true)
    })

    // poll blockchain state
    let lastMessagesLength = 0
    function updateState(state) {
        for (let i = lastMessagesLength; i < state.messages.length; i++) {
            logMessage(state.messages[i], i)
        }
        lastMessagesLength = state.messages.length
    }
    const state = await client.getState();
    updateState(state)

    setInterval(async () => {
        try {
            const state = await client.getState();
            updateState(state);
        } catch (err) {
            console.log(err);
        }
    }, 500)
}

main().then(nothing => {
    console.log(nothing);
}).catch(err => {
    console.log(err);
})