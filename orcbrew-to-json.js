//----------------------------------------------
//                  INIT
//----------------------------------------------
//Make sure a file has been passed as an argument
if (process.argv.length !== 3) {
    console.log("You must specify one file");
    process.exit(1);
}

const fs = require('fs'), filename = process.argv[2];
let objects = strings = arrays = 0;

const _rgxlib = {
   property_or_number: /(:[\w-./]+)|(\d+\s)/,
   property: /(:[\w-./]+)/,
   number: /\d+\s/,
   property_or_number_or_object_close: /(:[\w-]+)|(\d+\s)|}/,
   property_or_object_close: /(:[\w-]+)|}/,
   number_or_object_close: /(\d+\s)|}|]/,
   space_before_item: /\s[":{[]/,
   next_item_or_close: /[":{[]|]/,
   end_of_value: /,|}|]|\s}|\s]|\s,/
}

//----------------------------------------------
//                  MAIN
//----------------------------------------------

//This is the main function that parses the file
function parseOrcbrew(text) {
    //While there is still content, we continue to look for structures and parse them
    const output = parseByType(text.trim());

    console.log(output[0]);

    console.log(`Found ${objects} objects, 
    ${arrays} arrays, and ${strings} strings.\n`);
}

//Switch for choosing type to parse
function parseByType(string){
    switch (string[0]){
        case '{':
            objects++;
            return parseObject(string);
            break;
        case '"':
            strings++;
            return parseString(string);
            break;
        case '[':
            arrays++;
            return parseArray(string);
            break;
        case ':':
            return parseProperty(string);
            break;
        default:
            throw new Error('parseByType needs a structure, instead found '+ string[0])
    }
}

//----------------------------------------------
//                  PARSERS
//----------------------------------------------

/*
    * These functions take a string and parse the next item in the string
    * Parsers return a pseudo-tuple with [payload, updated_string]
    * The string parameter must have the next item at it's 0 index or whitespace 
*/

function parseObject(_string){
    string = _string.slice(0);
    /*
        Orcbrew has two structures that use the {} syntax
        One uses properties as keys (:property)
        The other uses numbers as indices (0 {0 :value, 1: value} 1 {0: value, 1: value})
    */

    if(string[0] === '{') string = string.slice(1);
    else throw new Error('[Object Parser] String must start with {');

    //The payload will be an object or an array depending on the value
    let payload;
    if(isNaN(parseInt(_rgxlib.property_or_number.exec(string)[0], 10)))
        payload = {};
    else
        payload = [];

    //This loop will iterate through the properties of the object
    //as long as we're not at the end of the object
    objectLoop:
        while(_rgxlib.property_or_number_or_object_close.exec(string)[0] !== '}'){
            let keyLength = 0, valueLength = 0, value;

            //Find a key to parse and jump to it
            [string, keyLength] = findKeyOrIndex(string);
            
            //Save key
            let key = string.slice(0, keyLength);
            console.log('Key: ' + key);
            //Jump past key
            string = string.slice(keyLength);

            //Slice the colon off of the key
            key = string.slice(1); 
            
            //Get value corresponding to key
            [string, valueLength] = findObjectValue(string);

            //Evaluate and store value
            [value, string] = parseByType(string.slice(0, valueLength));

            //Store value in object or array depending on keytypes
            if (isNaN(parseInt(key, 10))) {
                payload[key] = value;
            }else{
                payload.push(value);
            }
        }
    //Step over last curly brace
    string.slice(string.search(/}/) + 1);
    return [payload, string];
}

function parseString(_string){
    string = _string.slice(0);
    if(string[0] !== '"') 
        throw new Error('parseString must start with ", instead found ' + string[0]);
    const payload = string.slice(1).slice(0, string.search(/"/));
    const string = string.slice(1).slice(string.search(/"/) + 1);
    return [payload, string];
}

function parseArray(_string){
    string = _string.slice(0);
    let payload = [];
    if(string[0] !== '[')
        throw new Error('parseArray must start with [, instead found ' + string[0]);
    //Jump ahead of the first bracket
    string = string.slice(1);
    //Loop while still in the array
    while(_rgxlib.next_item_or_close.exec(string)[0] !== ']'){
        let itemLength = 0, item;
        [string, itemLength] = findNextArrayItem(string);
        //Evaluate item and add to payload
        [item, string] = parseByType(string);
        payload.push(item);
    }
    return [payload, string];
}

function parseProperty(_string){
    string = _string.slice(0);
    if (string[0] !== ':')
        throw new Error('parseProperty must start with :, instead found ' + string[0]);
        console.log('')
    let payload = _rgxlib.property.exec(string);
    
    string = string.slice(payload.length);
    //Trim the colon off of the payload
    payload = payload.slice(1);
    return [payload, string];
}

//----------------------------------------------
//                  FINDERS
//----------------------------------------------

/*
    These functions take a string as a parameter and return
    another pseudo-tuple with [newString, length_of_item]
*/

function findKeyOrIndex(string){
    //Jump to key or index
    const newString = string.slice(string.search(_rgxlib.property_or_number));
    //Find the length of the property or index
    const length_of_item = _rgxlib.property_or_number.exec(newString)[0].length;
    return [newString, length_of_item];
}

function findObjectValue(string){
    //Jump to next value
    const newString = string.slice(string.search(_rgxlib.next_item_or_close));
    //Get an accurate value length by accounting for nested collections
    let length_of_item = 0;
    if(newString[0] === '{' || newString == '['){
        length_of_item = determineCollectionLength(string);
    }else length_of_item = _rgxlib.property.exec(newString)[0].length;
    return [newString, length_of_item];
}

function findNextArrayItem(string){
    //Jump to next value
    const newString = string.slice(string.search(_rgxlib.next_item_or_close));
    //Get an accurate value length by accounting for nested collections
    let length_of_item = 0;
    if(newString[0] === '{' || newString == '['){
        length_of_item = determineCollectionLength(string);
    }else length_of_item = _rgxlib.next_item_or_close.exec(newString).length;
        return [newString, length_of_item];
}

//----------------------------------------------
//                  UTILITY
//----------------------------------------------

//Returns the length of a collection
function determineCollectionLength(_string){
    let string = skipSpace(_string);
    //Works for Objects and Arrays
    let nests = 0, open, close;
    switch(string.charAt(0)){
        case '{':
            [open, close] = ['{', '}'];
            break;
        case '[':
            [open, close] = ['[', ']'];
            break;
        default:
            throw new Error(`findCollectionClose() must 
            take a string where the first character is { or [. Instead found ${string.slice(0,14)}`)
    }
    //Counting pairs accounts for nested collections, avoid first symbol
    for(let i = 1; i < string.length; i++){
        switch (string.charAt(i)){
            case open:
                nests++;
                break;
            case close:
                if(nests === 0) return i + 1;
                else nests--;
                break;
        }
    }
    throw new Error(`No closing ${close} for structure ${string.slice(0, 15)}`);
}

function skipSpace(string) {
    return string.slice(string.search(/\S/));
}

//----------------------------------------------
//                  RUNTIME
//----------------------------------------------

fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {throw err;}
    console.log('Reading from [' + filename + ']...\nFile is ' + data.length + ' characters long');
    parseOrcbrew(data);
});