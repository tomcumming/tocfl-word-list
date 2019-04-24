const fs = require('fs');
const cccedict = require('parse-cc-cedict');

const { csvEscape, unEscape } = require('./escape');

let seperationCharacter = ',';

if(process.argv.length > 2 && process.argv[2] === '--tabs')
    seperationCharacter = '\t';

const fileName = './dist/simplified-and-chars.tsv';
const contents = fs.readFileSync(`${fileName}`, 'utf8');

let lines = contents
    .split('\n')
    .slice(1)
    .map(line => line.split('\t').map(unEscape))
    .filter(cells => cells.length > 0) // remove final new-line;
    .filter(cells => cells[4] === '') // remove extras
    .map(([s, t, p, l, pa, m]) => [s, t, p, l, m]);

// write header
{
    const headers = ['Simplified', 'Traditional', 'Pinyin', 'Level', 'Meaning']
        .map(v => `"${v}"`)
        .join(seperationCharacter) + '\n';
    process.stdout.write(headers);
}

for(const line of lines) {
    const escaped = line.map(cell => csvEscape(cell)).join(seperationCharacter);
    process.stdout.write(escaped);
    process.stdout.write('\n');
}
