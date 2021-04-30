const { getFileContent, parseConfigString, parseConstraintParameter, getLines } = require("./paramHelper");

/**
 * Get settins that is set in a given .conf file.  The result may be limited by including a defaultProperties object, and may be limited by setting extend property to true or false.
 * @param {string} confFile Location of the .conf file
 * @param {string[]|string} defaultProperties The default propertyset that could exist in the .conf file (could be null / undefined).
 * This can be a string that represents a FILE LOCATION that contains a json string array or a JSON STRING ARRAY.
 * @param {boolean} extend If false, only properties defined in defaultProperties will be included in the result object, else additional properties will be added.
 * @returns {object} Of properties as set on .conf File
 */
function getSettings(confFile, defaultProperties, extend, ignoreCase = true) {
    if (confFile == void 0 || confFile === "") return {};
    
    defaultProperties = defaultProperties == void 0 ? [] : parseConstraintParameter(defaultProperties, true);
    if (extend == void 0) extend = defaultProperties == void 0 || defaultProperties.length === 0;
    
    let file = getFileContent(confFile);
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
function setSettings(confFile, newValues, extend, ignoreCase = true) {
    if (confFile == void 0 || confFile === "") return "";

    newValues = parseConstraintParameter(newValues);
    if (extend == void 0) extend = newValues == void 0;
    
    let file = getFileContent(confFile);
    if (file == void 0) return "";
    return setConfig(file, newValues, extend, ignoreCase);
}

/**
 * Compile a settings object from content found inside a .conf file.
 * @param {string} configFile The content of a .conf file
 * @param {string|string[]|{}|null} defaultProperties The default propertyset that could exist in the .conf file (could be null / undefined)
 * @param {boolean} extend If false, only properties defined in defaultProperties will be included in the result object, else additional properties will be added.
 * @param {boolean} ignoreCase If true property case will be ignored.  Defautl = true
 * @returns {object} Settings object
 */
function parseConfig(configFile, defaultProperties, extend, ignoreCase = true) {
    if (defaultProperties == void 0) defaultProperties = [];
    let searchStringList = [];
    
    if (defaultProperties != void 0) {
        if (Array.isArray(defaultProperties)) searchStringList = defaultProperties;
        else searchStringList = parseConstraintParameter(defaultProperties, true);
    }
    extend = extend == void 0 ? searchStringList.length === 0 : extend;

    return parseConfigString(configFile, searchStringList, extend, ignoreCase);
}

/**
 * Change a config file by adding or removing properties.
 * @param {string} configFile A currently existing config file
 * @param {string|string[]|{}|null} propertyValues A object containing the new properties to be set
 * @param {bool} extend If false, only properties that are already defined in the configFile will be set, else new properties will also be set.
 * @param {bool} ignoreCase If set ignores case between property names as conteined in the propertyValues object and configFile
 * @returns {string}
 */
function setConfig(configFile, propertyValues, extend, ignoreCase = true) {
    propertyValues = parseConstraintParameter(propertyValues, false);
    if (propertyValues == void 0) return configFile;
    let searchStringList = [];
    
    for(let property in propertyValues) searchStringList.push(property);
    
    extend = extend == void 0 ? true : extend;
    let lines = getLines(configFile, searchStringList, extend, ignoreCase, false);
    let newLines = [];
    lines.forEach(line => {
        let val = null;
        let isComment = line.comment;
        if (line.property == void 0) {
            newLines.push(`${line.startSpacer}${line.comment ? '#' : ''}${line.line}`);
            return;
        }

        if (searchStringList.includes(line.property.property)) {
            val = propertyValues[line.property.property];
            searchStringList = searchStringList.filter(x => x !== line.property.property);
            isComment = val === null;
        } else val = line.property.value;
        
        if (isComment) {
            newLines.push(`${line.startSpacer}#${line.comment ? '' : ' '}${line.line}`);
        } else newLines.push(`${line.property.original || line.property.property} ${val}`);
    });

    if (extend && searchStringList.length > 0) {
        searchStringList.forEach(element => {
            if (propertyValues[element] == void 0) return;
            newLines.push(`${element} ${propertyValues[element]}`);
        });
    }
    return newLines.join('\n');
}

module.exports = {
    setConfig,
    getSettings,
    setSettings,
    parseConfig
}
