const arg = require("arg");
const {getSettings, setSettings} = require('../src/index');
const {writeFileSync, copyFileSync} = require("fs");

function convertArgsToOptions(receivedArgs) {
    const args = arg({
        '--property': [String],
        '--extend': Boolean,
        "--ignoreCase": Boolean,
        "--dest": String,
        "--ignorecase": "--ignoreCase",
        '-p': '--property',
        '-e': '--extend',
        '-i': '--ignoreCase',
        '-d': '--dest'
    },
    {
        argv: receivedArgs.slice(2)
    })

    let result = {
        ignoreCase: args['--ignoreCase'],
        extend: args['--extend'],
        properties: args['--property'],
        dest: args['--dest']
    }
    const functions = ["getsettings", "setsettings", "get", "set"];

    args._.forEach(x => {
        if (functions.includes(x.toLowerCase())) {
            result.func = x.toLowerCase();
        } else  result.file = x;
    })
    if (args.dest == void 0) args.dest = args.file;
    return result;

}

function convertToString(obj) {
    if (obj == void 0) return null;
    if (typeof obj === 'string') return obj;
    try {
        return JSON.stringify(obj);
    } catch (error) {
    }
    return null;
}

function cli(args) {
    var a = convertArgsToOptions(args);
    if (a.func == void 0) {
        console.log("no proper function has been set.  Options are getSettings, setSettings.");
        return;
    }
    switch (a.func) {
        case "get":
        case "getsettings":
            var settings = getSettings(a.file, a.properties, a.extend, a.ignoreCase);
            var settingsString  = convertToString(settings);
            if (settingsString == void 0) return null;
            if (a.dest == void 0) return console.log(settingsString);
            writeFileSync(a.dest, settingsString);
            break;
        default:
            // set setsettings
            var newSettings = setSettings(a.file, a.properties, a.extend, a.ignoreCase);
            if (a.dest == void 0) return console.log(newSettings);
            writeFileSync(a.dest, newSettings);
            break;
    }

}

module.exports = {
    cli
};
cli(process.argv);