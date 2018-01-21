// This project takes a .orcbrew file and converts it into a javscript object.
// The object is returned in JSON


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

const _regexlib = {
    property_or_number: /(:[\w-./]+)|(\d+\s)/,
    property: /(:[\w-]+)/,
    number: /\d+\s/,
    property_or_number_or_object_close: /(:[\w-]+)|(\d+\s)|}/,
    property_or_object_close: /(:[\w-]+)|}/,
    number_or_object_close: /(\d+\s)|}/,
    space_before_item: /\s[":{[]/,
    next_item: /[":{[]/,
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

//----------------------------------------------
//                  PARSERS
//----------------------------------------------
//Returns an actual object with all properties parsed
function parseObject(string){
    //Deep copy string
    let objectString = string.slice(0);
    //Enum for different object types
    var TYPES = {
        INDEX: 0,
        PROPERTY: 1 
    }

    let object = {}, key, type, keyStart;
    
    objectLoop:
        while(objectString.length > 0) {
            //Parse key 
            key = objectString.match(_regexlib.property_or_number)[0];
            keyStart = objectString.search(_regexlib.property_or_number);

            //If the key is a property type, slice the ":" off the beginning
            if (isNaN(parseInt(key, 10))) {
                type = TYPES.PROPERTY;
                key = key.slice(1);
            } else type = TYPES.INDEX;

            //Cut the key out of the string
            objectString = objectString.slice(keyStart + key.length);
            
            //Start the next object value
            [objectString, end_of_value] = findNextObjectValue(objectString);

            //Assign the key a value
            [object[key], objectString] = parseByType(objectString);

            console.log(`Key: ${key}  Value: ${object[key]}`)
            //Find the next key or index if there is one, otherwise break the loop.
            switch (type){
                case TYPES.INDEX:
                    if(objectString.match(_regexlib.number_or_object_close)[0] === '}'){
                        objectString.slice(objectString.search(_regexlib.number_or_object_close));
                        break objectLoop;
                    }
                    objectstring = objectString.slice(objectString.search(_regexlib.number));
                    break;
                case TYPES.PROPERTY:
                    if(objectString.match(_regexlib.property_or_object_close)[0] === '}'){
                        objectString.slice(objectString.search(_regexlib.property_or_object_close));
                        break objectLoop;
                    }
                    objectstring = objectString.slice(objectString.search(_regexlib.property));
                    break;
            }
        }
    
    return [object, objectString];
}
//Returns a javascript string 
function parseString(string){
    const end_of_value = string.slice(1).search(/"/);
    return [string.slice(1, end_of_value + 1), string.slice(0, end_of_value + 1)];
}

//Returns a javascript array with all elements parsed
function parseArray(string){
    const array = [];
    const close = findCollectionClose(string);
    while(str > 2){
        console.log(str.length);
        [val, str] = parseByType(str);
        array.append(val);
        str = findNextObjectValue(str);
    }
    return [array, string.slice(close)];
}

//Returns a string with the property name and the new string after the parse
function parseProperty(string){
    const property = string.match(_regexlib.property).slice(2)
    return [property,string.slice(property.length + 2)];
}



//----------------------------------------------
//                  FINDERS
//----------------------------------------------

//Returns a pseudo-tuple with (new_string, end_of_value)
function findNextObjectValue(string) {
    const newString = string.slice(string.search(_regexlib.next_item));
    const endOfValue = newString.search(_regexlib.end_of_value);
    return [newString, endOfValue];
}

//Returns a pseudo-tuple with (new_string, end_of_value)
function findNextArrayItem(string){
    const newString = string.slice(string.search(_regexlib.next_item) + 1);
    const endOfValue = newString.search(_regexlib.end_of_value);
    return [newString, endOfValue];
}

//Returns the index of the collection closing symbol
function findCollectionClose(string){
    //String must start with the opening symbol of the collection
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
    
//----------------------------------------------
//                  RUNTIME
//----------------------------------------------

fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {throw err;}
    console.log('Reading from [' + filename + ']...\nFile is ' + data.length + ' characters long');
    parseOrcbrew(data);
});