// This project takes a .orcbrew file and converts it into a javscript object.
// The object is returned in JSON

//Make sure a file has been passed as an argument
if (process.argv.length !== 3) {
     console.log("You must specify one file");
     process.exit(1);
}

const fs = require('fs'), filename = process.argv[2];
let objects = strings = arrays = 0;

const _regexlib = {
    property_or_number: /(:[\w-./]+)|(\d+\s)/,
    property: /(:[\w-]+)/,
    number: /(\d+\s)/,
    property_or_number_or_object_close: /(:[\w-]+)|(\d+\s)|}/,
    property_or_object_close: /(:[\w-]+)|}/,
    number_or_object_close: /(\d+\s)|}/,
    space_before_item: /\s[":{[]/,
    next_item: /[":{[]/
}

//This is the main function that parses the file
function parseOrcbrew(text) {
    //While there is still content, we continue to look for structures and parse them
    parseByType(text.trim());
    console.log(`Found ${objects} objects, 
    ${arrays} arrays, and ${strings} strings.\n`);
}

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
    }
}

//Returns an actual object with all properties parsed
function parseObject(string){
    //Enum for different object types
    var TYPES = {
        INDEX: 0,
        PROPERTY: 1 
    }
    //Slice the text after the object end
    let object = {}, key, type;
    //Clip the text after the closure
    let objectString = string.slice(0, findCollectionClose(string) + 1);
    
    console.log("Parsing Object");

    objectLoop:
        while(objectString) {
            key = objectString.match(_regexlib.property_or_number)[0];

            //If the key is not an index, slice the : off the beginning
            if (parseInt(key, 10) === NaN) {
                type = TYPES.PROPERTY;
                key = key.slice(1);
            } else type = TYPES.INDEX;

            //Assign the key a value
            object[key] = parseByType(findNextObjectValue(objectString));

            //Treat the object differently depending on the type
            switch (type){
                case TYPES.INDEX:
                    if(objectString.match(_regexlib.number_or_object_close)[0] === '}')
                        break objectLoop;
                    objectstring = objectString.slice(string.search(_regexlib.number));
                    break;
                case TYPES.PROPERTY:
                    if(objectString.match(_regexlib.property_or_object_close)[0] === '}')
                        break objectLoop;
                    objectstring = objectString.slice(string.search(_regexlib.property));
                    break;
            }

            objectstring = objectString.slice(string.search(_regexlib.property_or_number));
        }
    return object;
}

//

function findNextObjectValue(string) {
    return string.slice(string.search(_regexlib.space_before_item) + 1);
}

function findNextArrayItem(string){
    return string.slice(string.search(_regexlib.space_before_item) + 1);
}

//Returns an actual javscript string value
function parseString(string){
    console.log("Parsing String");
    return string.slice(1).slice(0,string.search(/"/));
}

//Returns an actual javascript array with all elements parsed
function parseArray(string){
    console.log("Parsing Array");
    const array = [];
    const close = findCollectionClose(string);
    string = string.slice(0, close);
    while(string > 2){
        console.log(string.length);
        array.append(parseByType(string));
        string = findNextObjectValue(string);
    }
    return array;
}

//Returns a string with the property name
function parseProperty(string){
    return string.match(_regexlib.property).slice(1);
}

function findCollectionClose(string){
    //string must start with the opening symbol of the collection
    let pairs = 0, open, close;
    
    switch (string.charAt(0)) {
        case '{':
            [open, close] = ['{', '}'];
            break;
        case '[':
            [open, close] = ['[', ']'];
            break;
        default:
            throw new Error(`findCollectionClose() must 
            take a string where the first character is { or [.\n
            string received with first character ${string.charAt(0)}`);
    }
    
    //Counting pairs accounts for nested collections, avoid first symbol
    for(let i = 1; i < string.length; i++){
        switch (string.charAt(i)){
            case open:
                pairs++;
                break;
            case close:
                if(pairs === 0) return i + 1;
                else pairs--;
                break;
        }
    }

    throw new Error(`No closing ${close} for structure ${string.slice(0, 15)}`);
}




function skipSpace(string){
    //Finds the next instance of a non-whitespace character
    const next = string.search(/\S/);
    //If none exists, the file has been parsed and we can return an empty string
    if(next == -1) return "";
    //Return the string with the whitespace sliced off
    return next; 
}

fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {throw err;}
    console.log('Reading from [' + filename + ']...\nFile is ' + data.length + ' characters long');
    parseOrcbrew(data);
})
