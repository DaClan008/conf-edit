const {resolve, isAbsolute, sep} = require("path");
const {lstatSync, readFileSync, existsSync} = require("fs");
const { getPropertyMatch, buildPropertyFromString } = require('./propertyHelper');

/**
 * Get the content of a file.
 * @param {string} filelocation The location to a file.
 * @returns {string} The content of the file in string format.
 */
function getFileContent(filelocation) {
    if (filelocation == void 0 || filelocation === "") return null;
    let workFile = filelocation;
    if (!isAbsolute(workFile)) workFile = resolve(filelocation);
    if (!existsSync(workFile)) {
        if (filelocation[0] !== '.') {
            if (filelocation[0] !== '/' && filelocation[0] !== '\\') return getFilecontent(`${sep}${filelocation}`);
            return getFilecontent(`.${filelocation}`);
        }
        return null;
    }
    // see if it is a file
    let stat = lstatSync(workFile);
    if (!stat.isFile()) return null;
    return readFileSync(workFile)?.toString();
}


function arrayToObject(propertyArr) {
    propertyArr = propertyArr || [];
    let result = {};
    propertyArr.forEach(prop => {
        let p = buildPropertyFromString(prop);
        result[p.property] = p.value;
    })
    return result;
}

/**
 * Get lines for a given config content.
 * @param {string} config The config content to get lines from
 * @param {string[]} properties Contraint properties to constrain result with.
 * @param {boolean} extend If false, only properties defined in defaultProperties will be included in the result object, else additional properties will be added.
 * @param {boolean} ignoreCase If true property case will be ignored.  Defautl = true
 * @returns {{line: string; startSpacer: boolean; 
 *  property: {
 *      property: string; 
 *      value: string | boolean | number | null; 
 *      original: string} | null;
 *  }[]}
 */
function getLines(config, properties, extend, ignoreCase, ignoreComment = true) {
    let lines = [];
    let getLine = () => {
        return {
            line: '',
            property: null,
            comment: false,
            startSpacer: ''
        }
    }
    let line = getLine();
    let start = true;
    let addChar = (char) => { line.line += char; }
    let reset = () => {
        if (!line.comment || !ignoreComment) {
            if (line.line.length > 0) {
                line.property = getPropertyMatch(line.line, properties, extend, ignoreCase);
            }
            lines.push(line);
        }
        line = getLine();
        start = true;
    }

    for (let i = 0; i < config.length; i++ ){
        let char = config[i];
        switch (char) {
            case '\n':
                reset();
            case '\r':
                continue;
            case '#':
                if (!start) break;
                line.comment = true;
                start = false;
                continue;
            case ' ':
                if (!start) break; 
                line.startSpacer += ' ';
                continue;
            default:
                if (start) start = false;
                break;
        }
        addChar(char);
    }
    // add last property
    reset();
    return lines;
}

/**
 * Returns the config properties as a object.
 * @param {string} config The config string content to parse
 * @param {string[]|null} properties Contraint properties to constrain result with.
 * @param {boolean} extend If false, only properties defined in defaultProperties will be included in the result object, else additional properties will be added.
 * @param {boolean} ignoreCase If true property case will be ignored.  Defautl = true
 * @returns {{[string]: string | boolean | number | null}}
 */
function parseConfigString(config, properties, extend, ignoreCase) {
    if (config == void 0 || config === '') return {};
    let lines = getLines(config, properties, extend, ignoreCase);
    let result = arrayToObject(properties);
    for(let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.property == void 0) continue;
        result[line.property.original] = line.property.value;
        if (line.property.original !== line.property.property) delete result[line.property.property];
    }
    return result;
}

/**
 * Construct the constrain property from a **file location**, **JSON array**, **JSON object**, property **string**, **object** or **array**.
 * @param {string|{}|[]|null} stringValue The constraint value
 * @param {boolean} isArray If true, will return an array with property names, else will return an object with values.
 * @returns {string[]|{}}
 */
function parseConstraintParameter(stringValue, isArray = false) {
    if (stringValue == void 0) return null;
    let result = isArray ? [] : {};
    
    if (typeof stringValue == 'string') {
        // see if value is a file location
        stringValue = getFileContent(stringFile) || stringValue;
        // see if it is JSON string
        try {
            stringValue = JSON.parse(stringValue);
        } catch (err) {
            stringValue = parseConfigString(stringValue, undefined, true, false);
        }
    }
    if (isArray) {
        if(Array.isArray(stringValue)) return stringValue;
        for(let prop in stringValue) result.push(prop);
        return result;
    }
    if (!Array.isArray(stringValue)) return stringValue;
    return arrayToObject(stringValue);
}


module.exports = {
    getLines,
    getFileContent,
    arrayToObject,
    parseConfigString,
    parseConstraintParameter
}