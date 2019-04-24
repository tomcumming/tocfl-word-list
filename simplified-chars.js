const fs = require('fs');
const cccedict = require('parse-cc-cedict');

const { csvEscape, unEscape } = require('./escape');

const dataDir = './data';
const dictionaryFile = `${dataDir}/cedict_1_0_ts_utf-8_mdbg.txt`;

let seperationCharacter = ',';

if(process.argv.length > 2 && process.argv[2] === '--tabs')
    seperationCharacter = '\t';

/** @type Map<string, Definition> */
let tradDefLookup = new Map();

const dictionaryDefs = cccedict.parseFile(dictionaryFile);
for(const def of dictionaryDefs)
    tradDefLookup.set(def.traditional, def);

const fileName = './dist/tocfl-and-chars.tsv';
const contents = fs.readFileSync(`${fileName}`, 'utf8');

let lines = contents
    .split('\n')
    .slice(1)
    .map(line => line.split('\t').map(unEscape))
    .filter(cells => cells.length > 0); // remove final new-line;

// write header
{
    const headers = ['Simplified', 'Traditional', 'Pinyin', 'Level', 'Parent', 'Meaning']
        .map(v => `"${v}"`)
        .join(seperationCharacter) + '\n';
    process.stdout.write(headers);
}

/** Map<string, string[]> */
let tradEntreesLookup = new Map();
for(const cells of lines)
    tradEntreesLookup.set(cells[0], cells);


/** @type Map<string, string[][]> */
let simpLookup = new Map();
for(const cells of lines) {
    const [ word ] = cells;

    const def = tradDefLookup.get(word);
    if(def === undefined)
        continue; // cant find def

    if(def.traditional === def.simplified)
        continue; // same as simplified

    const entree = tradEntreesLookup.get(word);
    if(entree === undefined)
        throw new Error(`Could not find '${word}'`);

    if(simpLookup.has(def.simplified))
        simpLookup.get(def.simplified).push(entree);
    else
        simpLookup.set(def.simplified, [entree]);
}

let written = new Set();

for(const cells of lines) {

    const [ word, pinyin, otherPinyin, level, firstTrn, trns, parent ] = cells;

    const def = tradDefLookup.get(word);
    if(def === undefined) {
        process.stderr.write(`Could not find definition for '${word}'\n`);
        continue;
    }

    if(def.simplified === def.traditional)
        continue;

    if(written.has(def.simplified))
        continue; // duplicate

    written.add(def.simplified);

    const simps = simpLookup.get(def.simplified);
    if(simps === undefined)
        continue;

    const trads = Array.from(new Set(simps.map(s => s[0])))
        .join(', ');

    const pinyins = Array.from(new Set(simps.map(s => s[1]))).reduce((p, c) => p.concat(c), [])
        .join(', ');

    const levels = Array.from(new Set(simps.map(s => s[3])))
        .join(', ');

    const parents = Array.from(new Set(simps.map(s => s[6]).filter(x => x !== '')))
        .join(', ');

    const parts = [def.simplified, trads, pinyins, levels, parents, firstTrn]
        .map(csvEscape);

    process.stdout.write(parts.join(seperationCharacter) + '\n');
}
