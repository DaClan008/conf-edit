import {resolve, isAbsolute} from "path";
import {lstatSync, readFileSync} from "fs";
const propertySplitReg = /^ *([^ #]+)([ =]+(.+))?/

function parseString(stringValue, isArray = false) {
    if (stringValue == void 0) return null;
    
    if (typeof stringValue == 'string') {
        let stringFile = stringValue;
        let stringString = stringValue;
        stringValue = isArray ? [] : {};
        // see if it is file location
        stringFile = getFromFile(stringFile);
        if (stringFile != void 0) stringString = stringFile;
        if (stringString != void 0 && stringString !== "") {
            // see if it is JSON string
            try {
                stringValue = JSON.parse(stringValue);
            } catch (err) {
                stringValue = parseConfig(stringString, undefined, true, false);
            }
        }
    }
    if (isArray) {
        if(Array.isArray(stringValue)) return stringValue;
        let resultArr = [];
        for(let prop in stringValue) {
            resultArr.push(prop);
        }
        return resultArr;
    }
    if (!Array.isArray(stringValue)) return stringValue;
    let resutlObject = {};

    stringValue.forEach(x => {
        let prop = getProperty(x, undefined, true, true);
        if (prop == void 0) return;
        resutlObject[prop.property] = prop.value;
    })
    return resutlObject;
}

function getFromFile(file) {
    if (file == void 0 || file === "") return null;
    if (!isAbsolute(file)) file = resolve(file);
    let stat = lstatSync(file);
    if (!stat.isFile()) return null;
    return readFileSync(file)?.toString();
}

function getPropertyName(property, properties = [], ignoreCase) {
    let workProp = ignoreCase ?  property.toLowerCase() : property;
    let propertyResult = properties.filter(x => (ignoreCase ? x.toLowerCase() : x) === workProp);
    return propertyResult.length === 0 ? null : propertyResult[0];
}

function getProperty(line, properties, extend, ignoreCase) {
    properties = properties || [];
    let propDefinitions = propertySplitReg.exec(line);
    if (propDefinitions == void 0) return null;
    let prop = propDefinitions[1];
    let tmp = getPropertyName(prop, properties, ignoreCase);
    if (!extend && tmp == void 0) return null;
    tmp = tmp || prop;
    return {
        property: tmp,
        original: prop,
        value: propDefinitions[3]
    };
}

function buildDefaultResult(defaultProperties) {
    defaultProperties = defaultProperties || [];
    let result = {};
    defaultProperties.forEach(prop => {
        result[prop] = undefined;
    })
    return result;
}

/**
 * Get settins that is set in a given .conf file.  The result may be limited by including a defaultProperties object, and may be limited by setting extend property to true or false.
 * @param {string} confFile Location of the .conf file
 * @param {string[]|string} defaultProperties The default propertyset that could exist in the .conf file (could be null / undefined).
 * This can be a string that represents a FILE LOCATION that contains a json string array or a JSON STRING ARRAY.
 * @param {boolean} extend If false, only properties defined in defaultProperties will be included in the result object, else additional properties will be added.
 * @returns {object} Of properties as set on .conf File
 */
export function getSettings(confFile, defaultProperties, extend, ignoreCase = true) {
    if (confFile == void 0 || confFile === "") return {};
    
    defaultProperties = defaultProperties == void 0 ? [] : parseString(defaultProperties, true);
    if (extend == void 0) extend = defaultProperties == void 0 || defaultProperties.length === 0;
    
    let file = getFromFile(confFile);
    if (file == void 0) return {};
    return parseConfig(file, defaultProperties, extend, ignoreCase);
}
/**
 * 
 * @param {string} confFile The location of a config file to use as base.
 * @param {string|{}} newValues A location to a file containing json type data, a json object and or config settings file, alternatively the data string or object
 * with values to set.
 * @param {*} extend 
 * @param {*} ignoreCase 
 * @returns 
 */
export function setSettings(confFile, newValues, extend, ignoreCase = true) {
    if (confFile == void 0 || confFile === "") return "";

    newValues = parseString(newValues);
    if (extend == void 0) extend = newValues == void 0;
    
    let file = getFromFile(confFile);
    if (file == void 0) return "";
    return setConfig(file, newValues, extend, ignoreCase);
}

/**
 * Compile a settings object from content found inside a .conf file.
 * @param {string} configFile The content of a .conf file
 * @param {string[]} defaultProperties The default propertyset that could exist in the .conf file (could be null / undefined)
 * @param {boolean} extend If false, only properties defined in defaultProperties will be included in the result object, else additional properties will be added.
 * @param {boolean} ignoreCase If true property case will be ignored.  Defautl = true
 * @returns {object} Settings object
 */
export function parseConfig(configFile, defaultProperties, extend, ignoreCase = true) {
    if (defaultProperties == void 0) defaultProperties = [];
    let searchStringList = [];
    
    defaultProperties.forEach(prop => {
        if (prop != "") searchStringList.push(prop);
    })
    let result = buildDefaultResult(defaultProperties);
    extend = extend == void 0 ? searchStringList.length === 0 : extend;

    configFile =  configFile.replace(/\r?\n\r?/g, '\n');
    let configFileSplit = configFile.split('\n');

    let isCommentCheck = /^ *#/;

    configFileSplit.forEach(line => {
        if (isCommentCheck.test(line)) return;
        let prop = getProperty(line, searchStringList, extend, ignoreCase);
        if (prop == void 0) return;
        result[prop.original] = prop.value
        if (prop.property !== prop.original) delete result[prop.property]
    });
    return result;
}

/**
 * Change a config file by adding or removing properties.
 * @param {string} configFile A currently existing config file
 * @param {object} propertyValues A object containing the new properties to be set
 * @param {bool} extend If false, only properties that are already defined in the configFile will be set, else new properties will also be set.
 * @param {bool} ignoreCase If set ignores case between property names as conteined in the propertyValues object and configFile
 * @returns {string}
 */
export function setConfig(configFile, propertyValues, extend, ignoreCase = true) {
    if (propertyValues == void 0) return configFile;
    let searchStringList = [];
    
    for(let property in propertyValues) {
        searchStringList.push(property);
    }
    let newLines = [];
    extend = extend == void 0 ? true : extend;

    configFile =  configFile.replace(/\r?\n\r?/g, '\n');
    let configFileSplit = configFile.split('\n');

    let regex = new RegExp(`^[ #]*(${searchStringList.join("|")})`, ignoreCase ? 'i' : '');

    configFileSplit.forEach(line => {
        if (!regex.test(line)) {
            newLines.push(line);
            return;
        }
        let regexExec = regex.exec(line);
        let tmpline = line.trim().replace(/^#*/, '');
        let prop = getProperty(tmpline, searchStringList, extend, ignoreCase);
        if (prop == void 0) return; // should never be hit
        if (propertyValues[prop.property] == void 0) newLines.push(`# ${tmpline}`);
        else newLines.push(`${regexExec[1]} ${propertyValues[prop.property]}`);
        searchStringList = searchStringList.filter(x => x != prop.property);
    });
    if (extend && searchStringList.length > 0) {
        searchStringList.forEach(element => {
            if (propertyValues[element] == void 0) return;
            newLines.push(`${element} ${propertyValues[element]}`);
        });
    }
    return newLines.join('\n');
}
