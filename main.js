const fs = require('fs');
const cccedict = require('parse-cc-cedict');

const dataDir = './data';
const dictionaryFile = `${dataDir}/cedict_1_0_ts_utf-8_mdbg.txt`;

/** Read the word and pinyin columns from a csv file
 * @param {string} fileName
 * @returns {{word: string, pinyin: string}[]}
 */
function readCsv(fileName) {
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
                ? { word: cells[1].trim(), pinyin: cells[3].trim() }
                : { word: cells[0].trim(), pinyin: cells[2].trim() };
        });
}

/** @type {{word: string, pinyin: string}[]} */
const rawValues = process.argv.slice(2)
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
    .map(({ word, pinyin }) => ({
        word: sanitizeValue(word),
        pinyin: sanitizeValue(pinyin)
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

    //** @param {string} value */
    function csvEscape(value) {
        return `"${value.replace(/"/g, '""')}"`;
    }

    /** @param {{word: string, pinyin: string, translations: string[]}} value */
    function writeValueLine(value) {
        if(done.has(value.word))
            return;

        done.add(value.word);

        const line = [
            value.word,
            value.pinyin,
            value.translations.slice(0, 1).join(''),
            value.translations.slice(1).join(', ')
        ]
            .map(csvEscape)
            .join(',');

        process.stdout.write(line + '\n');
    }

    // write csv header
    process.stdout.write(`"Word","Pinyin","First Translation","Other Translations"\n`);

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

                if(lookup.has(char)) {
                    pinyin = lookup.get(char).pinyin;
                }

                writeValueLine({
                    word: char,
                    pinyin: lookup.has(char)
                        ? lookup.get(char).pinyin
                        : def.pinyin,
                    translations: def.translations
                });
            }
        }

        const def = findInDic(value.word);

        writeValueLine({
            ...value,
            translations: def.translations
        });
    }
}


