const fs = require('fs');

const { csvEscape, unEscape } = require('./escape');

const tocflFileName = './dist/tocfl.tsv';
const tocflContents = fs.readFileSync(`${tocflFileName}`, 'utf8');
const tocflLines = tocflContents
    .split('\n')
    .slice(1)
    .map(line => line.split('\t').map(unEscape))
    .filter(cells => cells.length > 1); // remove final new-line;

/** @type {Map<string, string[]>} */
const tocflByFirstChars = new Map();
for(const [word] of tocflLines) {
    const firstChar = word[0];
    const existing = tocflByFirstChars.get(firstChar);
    tocflByFirstChars.set(firstChar, existing === undefined ? [word] : existing.concat([word]));
}

const sentenceFileName = './data/split-sentences.txt';
const sentenceContents = fs.readFileSync(`${sentenceFileName}`, 'utf8');
const sentenceLines = sentenceContents
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => JSON.parse(line));

const missing = new Set(tocflLines.map(([word]) => word));

for(const [line, _tokens] of sentenceLines)
    for(let start = 0; start < line.length; start += 1) {
        const tocfls = tocflByFirstChars.get(line[start]);
        if(tocfls !== undefined) {
            for(const t of tocfls)
                if(line.includes(t))
                    missing.delete(t);
        }
    }

for(const [word, pinyin, _otherPinyin, level] of tocflLines) {
    if(missing.has(word))
        process.stdout.write(`${level} ${word} ${pinyin}\n`);
}
