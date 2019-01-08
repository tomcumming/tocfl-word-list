const fs = require('fs');
const cccedict = require('parse-cc-cedict');

const { csvEscape, unEscape } = require('./escape');

const dataDir = './data';

let seperationCharacter = ',';

if(process.argv.length > 2 && process.argv[2] === '--tabs')
    seperationCharacter = '\t';

const fileName = './dist/tocfl.tsv';
const contents = fs.readFileSync(`${fileName}`, 'utf8');

let lines = contents
    .split('\n')
    .slice(1)
    .map(line => line.split('\t').map(unEscape))
    .filter(cells => cells.length > 0); // remove final new-line;

// write header
{
    const headers = ['Pinyin', 'FirstWord', 'AllWords', 'Definitions']
        .map(v => `"${v}"`)
        .join(seperationCharacter) + '\n';
    process.stdout.write(headers);
}

/** Map<string, string[][]> */
let pinyinLookup = new Map();
for(const cells of lines)
{
    if(cells[6] !== '')
        continue;

    if(pinyinLookup.has(cells[1]))
        pinyinLookup.get(cells[1]).push(cells);
    else
        pinyinLookup.set(cells[1], [cells]);
}

let written = new Set();

for(const cells of lines) {

    const [ word, pinyin, otherPinyin, level, firstTrn, trns, parentWord ] = cells;

    if(parentWord !== '')
        continue;

    if(written.has(pinyin))
        continue;
    else
        written.add(pinyin);

    const allWithPinyin = pinyinLookup.get(pinyin);

    const words = allWithPinyin.map(c => c[0]).join(', ');
    const definitions = allWithPinyin.map(c => {
        // This is never not empty... but never mind
        const other = c[2] !== ''
            ? ` (${c[2]})`
            : '';
        return `${c[0]}${other} ${c[4]}`;
    }).join('\n');

    const parts = [pinyin, word, words, definitions]
        .map(csvEscape);

    process.stdout.write(parts.join(seperationCharacter) + '\n');
}
