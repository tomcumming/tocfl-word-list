const fs = require('fs');
const cccedict = require('parse-cc-cedict');

const { csvEscape, unEscape } = require('./escape');

const dataDir = './data';
const dictionaryFile = `${dataDir}/cedict_1_0_ts_utf-8_mdbg.txt`;

let seperationCharacter = ',';

if(process.argv.length > 2 && process.argv[2] === '--tabs')
    seperationCharacter = '\t';

    let charLookup = new Map();
const dictionaryDefs = cccedict.parseFile(dictionaryFile);
for(const def of dictionaryDefs)
    charLookup.set(def.traditional, def);

const fileName = './dist/tocfl.tsv';
const contents = fs.readFileSync(`${fileName}`, 'utf8');

let lines = contents
    .split('\n')
    .slice(1);

// write header
{
    const headers = ['Simplified', 'Traditional', 'Pinyin', 'Level', 'Parent']
        .map(v => `"${v}"`)
        .join(seperationCharacter) + '\n';
    process.stdout.write(headers);
}

for(const line of lines) {
    const cells = line
        .split('\t')
        .map(unEscape);

    if(cells.length === 0)
        continue; // final new line

    const [ word, pinyin, level, firstTrn, trns, parent ] = cells;

    const def = charLookup.get(word);
    if(def === undefined) {
        process.stderr.write(`Could not find definition for '${word}'\n`);
        continue;
    }

    if(def.traditional === def.simplified)
        continue; // same as simplified

    const parts = [def.simplified, def.traditional, pinyin, level, parent]
        .map(csvEscape);

    process.stdout.write(parts.join(seperationCharacter) + '\n');
}
