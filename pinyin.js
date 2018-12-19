/** @param input {string}
 *  @param tone {number}
*/
function setTone(input, tone) {
    switch(tone) {
        case 1:
            switch(input) {
                case 'a': return 'ā';
                case 'e': return 'ē';
                case 'i': return 'ī';
                case 'o': return 'ō';
                case 'u': return 'ū';
                case 'v': return 'ǖ';
                default: throw new Error(`Unexpected tone letter: ${input}`);
            }
        case 2:
            switch(input) {
                case 'a': return 'á';
                case 'e': return 'é';
                case 'i': return 'í';
                case 'o': return 'ó';
                case 'u': return 'ú';
                case 'v': return 'ǘ';
                default: throw new Error(`Unexpected tone letter: ${input}`);
            }
        case 3:
            switch(input) {
                case 'a': return 'ǎ';
                case 'e': return 'ě';
                case 'i': return 'ǐ';
                case 'o': return 'ǒ';
                case 'u': return 'ǔ';
                case 'v': return 'ǚ';
                default: throw new Error(`Unexpected tone letter: ${input}`);
            }
        case 4:
            switch(input) {
                case 'a': return 'à';
                case 'e': return 'è';
                case 'i': return 'ì';
                case 'o': return 'ò';
                case 'u': return 'ù';
                case 'v': return 'ǜ';
                default: throw new Error(`Unexpected tone letter: ${input}`);
            }
        default:
            throw new Error(`Unexpected tone: ${tone}`);
    }
}

/** @param input {string}
 *  @param tone {number}
*/
function addAccent(input, tone) {
    if(tone === 5)
        return input;

    match = /^([^aeiouv]*)([aeiouv])([^aeiouv]*)$/.exec(input);
    if(match !== null)
        return match[1] + setTone(match[2], tone) + match[3];

    match = /^(.*)(a|e)(.*)$/.exec(input);
    if(match !== null)
        return match[1] + setTone(match[2], tone) + match[3];

    match = /^(.*)ou(.*)$/.exec(input);
    if(match !== null)
        return match[1] + setTone('o', tone) + 'u' + match[2];

    match = /^([^aeiouv]*)([aeiouv])([aeiouv])(.*)$/.exec(input);
    if(match !== null)
        return match[1] + match[2] + setTone(match[3], tone) + match[4];

    throw new Error(`Can't add accent to '${input}' ${tone}`);
}

/** @param input {string} */
function numberedToAccent(input) {
    input = input.toLowerCase();

    const match = /^(.+)([1-5])$/.exec(input);
    if(match === null)
        return input;

    const tone = parseInt(match[2]);
    return addAccent(match[1], tone);
}

module.exports = {
    numberedToAccent
};
