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
    property_or_object_close: /(:[\w-]+)|}/,
    space_before_item: /\s[":{[]/
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
    console.log("Parsing Object");
    //Slice the text after the object end
    let object = {}, key = "";
    let objectString = string.slice(0, findCollectionClose(string) + 1);
    if (objectString.length > 2) {
        while(objectString.length > key.length + 4) {
            key = objectString.match(_regexlib.property_or_number)[0].slice(1);
            objectString = findNextObjectValue(objectString);
            object[key] = parseByType(objectString);
            if(objectString.match(_regexlib.property_or_object_close)[0] === '}')
                break;
            objectstring = objectString.slice(string.search(_regexlib.property));
        }
    }
    return object;
}

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
    
    //Counting pairs accounts for nested collections
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


function findNextStructure(string) {
    const nextStructure = string.search(/["{[:]/g);
    return nextStructure;
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
