const fs = require('fs');
const cccedict = require('parse-cc-cedict');

const { csvEscape } = require('./escape');
const { numberedToAccent } = require('./pinyin');

const dataDir = './data';
const dictionaryFile = `${dataDir}/cedict_1_0_ts_utf-8_mdbg.txt`;

/** Read the word and pinyin columns from a csv file
 * @param {string} fileName
 * @returns {{word: string, pinyin: string, level: number }[]}
 */
function readCsv(fileName) {
    const level = parseInt(/^.*\/(\d+)\.csv$/.exec(fileName)[1]);
    const contents = fs.readFileSync(`${fileName}`, 'utf8');
    const lines = contents.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1)
        .filter(line => line.trim() !== '')
        .map(line => {
            const cells = line.split(',');
            if(cells.length !== headers.length)
                throw new Error(`parse error for line: ${fileName}: ${JSON.stringify(cells)}`);

            return headers.length === 8
                ? { word: cells[1].trim(), pinyin: cells[3].trim(), level }
                : { word: cells[0].trim(), pinyin: cells[2].trim(), level };
        });
}

let seperationCharacter = ',';
let files;

if(process.argv.length > 2 && process.argv[2] === '--tabs') {
    seperationCharacter = '\t';
    files = process.argv.slice(3);
} else {
    files = process.argv.slice(2);
}

/** @type {{word: string, pinyin: string, level: number}[]} */
const rawValues = files
    .map(readCsv)
    .reduce((p, c) => p.concat(c), []);

/** Remove brackets and slash alternatives
 * @param {string} v
 */
const sanitizeValue = v => v
    .replace(/\(.+\)/g, '') // remove brackets
    .replace(/\/.*$/, '') // remove '/' alternate values
    .replace(/['" ]/g, '') // quotes

const values = rawValues
    .map(({ word, pinyin, level }) => ({
        word: sanitizeValue(word),
        pinyin: sanitizeValue(pinyin),
        level: level
    }));

// This is where we output the new CSV file
{
    const dictionaryDefs = cccedict.parseFile(dictionaryFile);
    let dictionary = new Map();
    for(const def of dictionaryDefs) {
        if(dictionary.has(def.traditional))
            dictionary.get(def.traditional).push(def);
        else
            dictionary.set(def.traditional, [ def ]);

        if(def.traditional !== def.simplified)
            dictionary.set(def.simplified, dictionary.get(def.traditional));
    }

    function findInDic(word) {
        let defs = dictionary.get(word);

        if(defs === undefined) {
            process.stderr.write(`Can't find in dictionary: ${word}\n`);
            defs = [];
        }

        return {
            pinyin: Array.from(
                    new Set(defs.map(d => d.pronunciation.toLowerCase())))
                .join(' '),
            translations: defs
                .map(d => d.definitions)
                .reduce((p, c) => p.concat(c), [])
        };
    }

    /** @type{Set<string>} */
    let done = new Set();
    const lookup = new Map(values.map(v => [v.word, v]));

    /** @param {{word: string, pinyin: string, otherPinyin: string, translations: string[], level: number, parent?: {word: string, pinyin: string}}} value */
    function writeValueLine(value) {
        if(done.has(value.word))
            return;

        done.add(value.word);

        const line = [
            value.word,
            value.pinyin,
            value.otherPinyin,
            value.level.toString(),
            value.translations.slice(0, 1).join(''),
            value.translations.slice(1).join(', '),
            value.parent !== undefined ? value.parent.word : '',
            value.parent !== undefined ? value.parent.pinyin : ''
        ]
            .map(csvEscape)
            .join(seperationCharacter);

        process.stdout.write(line + '\n');
    }

    // write csv header
    process.stdout.write(['"Word"', '"Pinyin"', '"OtherPinyin"', '"Level"', '"First Translation"', '"Other Translations"', '"ParentWord"', '"ParentPinyin"'].join(seperationCharacter) + '\n');

    for(const value of values) {
        /** @type {string[]} */
        const chars = Array.from(value.word);

        if(chars.length === 0)
            throw new Error(`word has no characters in: ${JSON.stringify(value)}`);

        const dependsOn = chars.length === 1
            ? []
            : chars;

        for(const char of dependsOn) {
            {
                const def = findInDic(char);

                const pinyins = lookup.has(char)
                    ? [lookup.get(char).pinyin]
                    : def.pinyin.split(' ').map(numberedToAccent);

                if(pinyins.length === 0)
                    pinyins = [''];

                writeValueLine({
                    word: char,
                    pinyin: pinyins[0],
                    otherPinyin: pinyins.slice(1).join(' '),
                    translations: def.translations,
                    parent: value,
                    level: value.level
                });
            }
        }

        const def = findInDic(value.word);

        writeValueLine({
            ...value,
            otherPinyin: '',
            translations: def.translations
        });
    }
}


