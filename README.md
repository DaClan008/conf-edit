# conf-edit

Quickly and easily change .conf properties file.  Mainly created to run in docker files to convert environment variable to .conf files to offer some form of obfuscation in some docker images.

Can be used in console or as node extension.

## Usage

Install:

> npm install conf-edit

## Javascript

There are 4 main functions exposed:

### getSettings

Get the current settings from a .conf file.  This can also be limited to a specified set of properties.

```js
const { getSettings } = require('conf-edit');

const confFile = 'some/relative/or/absolute/file.conf';
const limits = [
    'PROPERTY1',
    'OTHERPROP',
];

console.log("only file", getSettings(confFile));
console.log("with limits", getSettings(confFile, limits));
console.log("set extend to true", getSettings(confFile, limits, true));
console.log("set extend to false (default)", getSettings(confFile, limits, false));
// with extend set to false, you are limited to limits properties that should not match if not case don't match.
console.log("set ignoreCase to false", getSettings(confFile, limits, false, false));
// with extend set to true, all properties should be displayed, but only matched if case is match
console.log("set ignoreCase to false", getSettings(confFile, limits, true, false));

console.log("set ignoreCase to true (default)", getSettings(confFile, limits, true, true));

// OUTPUT:
//  only file { property1: 'some value',  property2: 'some value2' }
//   - with limits { OTHERPROP: undefined, property1: 'some value' }
//   - set extend to true {
//       OTHERPROP: undefined,
//       property1: 'some value',
//       property2: 'some value2'
//     }
//   - set extend to false (default) { OTHERPROP: undefined, property1: 'some value' }
//   - set ignoreCase to false { PROPERTY1: undefined, OTHERPROP: undefined }
//   - set ignoreCase to false {
//       PROPERTY1: undefined,
//       OTHERPROP: undefined,
//       property1: 'some value',
//       property2: 'some value2'
//     }
//   - set ignoreCase to true (default) {
//       OTHERPROP: undefined,
//       property1: 'some value',
//       property2: 'some value2'
//     }
```

The .conf file has the following properties:
```.conf
property1 some value
property2 some value2
# exlcudedProperty exclude value
```

#### Function parameters

getSettings ( configFile, defaultProperties, extend, ignoreCase )

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| configFile | string | location to a .conf file that can be relative or absolute path. |
| defaultProperties | string[] / string | Sets out which properties should be returned by this function.  It can either be a **list of string**, or a string object referring to a **File Location** that contains a JSON object representing an array of string, or it is a **JSON string** representing a string array.  It is also able go convert from an **object** to array.
| extend | boolean | If set as false, only properties in the defaultProperties parameter will be included, unless if the defaultProperties is not set, then all set properties will be returned.  If set, all properties will be returned. |
| ignoreCase | boolean | If set to true, case will not be taken into account when values are returned.

### setSettings

Returns a new config string based on a config string provieded at a file location and an object with a given properties.

In these examples the same .conf file is used than specified above.

```js
const { setSettings }= require('conf-edit');

const confFile = 'some/relative/or/absolute/file.conf';
const newValues = {
    PROPERTY1: "new prop1", 
    OTHERPROP: 'new', 
    property2: null, 
    exlcudedProperty : "activate"
};

console.log("normal:\n", setSettings(confFile, newValues));
console.log("extended:\n", setSettings(confFile, newValues, true));
console.log("no extend & no ignoreCase:\n", setSettings(confFile, newValues, false, false));
console.log("extended & no ignoreCase:\n", setSettings(confFile, newValues, true, false));

// OUTPUT
//  normal:
//      property1 new prop1
//      # property2 some value2
//      exlcudedProperty activate
//  extended:
//      property1 new prop1
//      # property2 some value2
//      exlcudedProperty activate
//      OTHERPROP new
//  no extend & no ignoreCase:
//      property1 some value
//      # property2 some value2
//      exlcudedProperty activate
//  extended & no ignoreCase:
//      property1 some value
//      # property2 some value2
//      exlcudedProperty activate
//      PROPERTY1 new prop1
//      OTHERPROP new
```

#### Function parameters

getSettings ( configFile, defaultProperties, extend, ignoreCase )

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| configFile | string | location to a .conf file that can be relative or absolute path. |
| newValues | object / string | Sets out which properties should be returned by this function.  It can either be an **object**, or a string referring to a **File Location** that contains a JSON object, or it is a **JSON string** representing a object with key value pairs.  If value is set to null or undefined, the property on the .conf will be commented out.
| extend | boolean | If set as false, only properties in the defaultProperties parameter will be included, unless if the defaultProperties is not set, then all set properties will be returned.  If set, all properties will be returned. |
| ignoreCase | boolean | If set to true, case will not be taken into account when values are returned.

### parseConfig

The main function that converts a string representation of a .connf file to a object of key value pairs.  Refer to output and results under [getSettings](#getsettings) for more information.

#### Parameters


getSettings ( confFile, defaultProperties, extend, ignoreCase )


This is similar to [getSettings](#getsettings) and all parameters are the same except for the first parameter.

confFile is the actual content of the .conf file.

### setConfig

The main function that sets new values to an existing configuration string and returns.  Refer to output and results under [setSettings](#setsettings) for more information

#### Parameters

setConfig ( configFile, propertyValues, extend, ignoreCase = true )


This is similar to [setSettings](#setsettings) and all parameters are the same except for the first parameter.

confFile is the actual content of the .conf file.

## CLI

Only 2 functions are exposed through the cli process, these are [getSettings](#getsettings) and [setSettings](#setsettings).

### CLI Usage

> conf-edit [function] -e -i -d [dest] -p [property] -p [property] [src]

OR
> conf-edit [function] -extend true -ignoreCase true --destination [dest] --property [prop] [src]

### Arguments

| Argument | Aliases | Type | Descriptions |
| -------- | ------- | ---- | ------------ |
| Function \* | N/A   | N/A | The function to call.  The options are **[getSettings](#getsettings)** or **get** and **[setSettings](#setsettings)** or **set**.
| src \* | N/A | N/A | The starting source file including file name of the .conf file. |
| --extend | -e | boolean | Sets the extend property to true or false if needs be.
| --ignoreCase | --ignorecase / -i | boolean | Sets whether case should be ignored or not.  Refer to examples under [getSettings](#getsettings) or [setSettings](#setsettings).
| --property | -p | string[] | Is used for both getSettings and setSettings.  Where getSettings should only include the property name, the setSettings property value can have a property value pair (i.e. property value OR property=value). |

## Note

Project has not been fully tested and feel free to contribute.  Project has been completed quickly in order to proceed with further projects.  I would like to extend this project later on to also be able to Parse and Compile .yml files.
