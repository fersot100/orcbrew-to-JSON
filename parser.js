// This project takes a .orcbrew file and converts it into a javscript object.
// The object is returned in JSON

//Make sure a file has been passed as an argument
if (process.argv.length !== 3) {
     console.log("You must specify one file");
     process.exit(1);
}
const fs = require('fs'), filename = process.argv[2];
let properties = objects = strings = arrays = 0;

//This is the main function that parses the file
function parseOrcbrew(text) {

    //Copy text to local content variable
    let content = text.slice(0);

    //While there is still content, we continue to look for structures and parse them
    do {
        content = findNextStructure(content.slice(1));
        parseByType(content);
    } while (content !== "");

    console.log(`Found ${properties} properties, ${objects} objects, ${arrays} arrays, and ${strings} strings.\n`);
}

function parseByType(string){
    switch (string[0]){
        case ':':
            properties++;
            return parseProperty(string);
            break;
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
    }
}

function parseProperty(string){

}

function parseObject(string){

}

function parseString(string){

}

function findNextStructure(string) {
    const nextStructure = string.search(/["{[:]/g);
    if(nextStructure == -1 ) return "";
    return string.slice(nextStructure);
}

function returnObject(){

}

function skipSpace(string){
    //Finds the next instance of a non-whitespace character
    const next = string.search(/\S/);
    //If none exists, the file has been parsed and we can return an empty string
    if(next == -1) return "";
    //Return the string with the whitespace sliced off
    return string.slice(next); 
}

fs.readFile(filename, 'utf8', (err, data) => {
    if (err) throw err;
    console.log('Reading from [' + filename + ']...\nFile is ' 
        + data.length + ' characters long');
    parseOrcbrew(data);
})
