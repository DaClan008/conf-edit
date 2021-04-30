const START = 0;
const PROPERTY = 1;
const EQUAL = 2;

/**
 * Converts a string value to the correct formated value object.
 * @param {string} valString The string value to convert
 * @returns {string | boolean | number | null}
 */
function getValue(valString) {
    let num = Number(valString);
    if (!isNaN(num)) return num;
    if (valString.toLowerCase() === 'true') return true;
    if (valString.toLowerCase() === 'false') return false;
    let len = valString.length -1;
    if ((valString[0] === '"' || valString[0] === "'") && (valString[len] === '"' || valString[len] === "'") && len >= 1) return valString.substr(1, len-1);
    return valString;
}

/**
 * Converts a property string to a property object.
 * @param {string} propString The propertystring to convert to a property object.
 * @returns {{property: string; value: string | boolean | number | null} | null} or Null if propString is not correct.
 */
function buildPropertyFromString(propString) {
    if (propString == void 0 || typeof propString !== 'string' || propString.length === 0) return null;
    let result = {
        property: "",
        value: null
    }
    let state = START;
    for(let i = 0; i< propString.length; i++) {
        let char = propString[i];
        switch (char) {
            case ' ':
            case '=':
            case ':':
                if (state === START) continue;
                if (state === PROPERTY) {
                    state = EQUAL;
                    continue;
                }
                // else ignore if EQUAL
                break;
            default:
                if (state === START) state = PROPERTY;
                if (state === PROPERTY) {
                    result.property += char;
                    continue;
                }
                // will never be VALUE... thus end of EQUAL
                result.value = getValue(propString.substr(i).trim());
                return result;
        }
    }
    // if we get here there was no value set.
    return result.property === '' ? null : result;
}
/**
 * Returne a matched property combination.
 * @param {string} line The orignal property string
 * @param {string[]} properties A list of strings containing property names to filter by.
 * @param {boolean} extend If true any property can be returned, else the line property name should match any property in the properties list.
 * @param {boolean} ignoreCase If set to true the case is ignored between the line property name and the properties listed in the properties list.
 * @returns {{property: string; value: string | boolean | number | null; original: string} | null}
 * An object if property match occured, else null.
 */
function getPropertyMatch(line, properties, extend, ignoreCase) {
    properties = properties || [];
    
    let prop = buildPropertyFromString(line);
    if (prop == null) return null;
    prop.original = prop.property;

    let workProp = ignoreCase ? prop.property.toLowerCase() : prop.property;
    let matchedProp = properties.filter(x => (ignoreCase ? x.toLowerCase() : x) === workProp);
    let hasMatch = matchedProp != void 0 && matchedProp[0] != void 0 && matchedProp[0].length > 0;
    if (!extend && !hasMatch) return null;
    if (matchedProp.length > 0 && hasMatch) prop.property = matchedProp[0];

    return prop;
}

module.exports = {
    buildPropertyFromString,
    getPropertyMatch
}