//@ts-check

/** @param {string} description */
function score(description) {
    let score = 0;
    score += Number(/^CL:/.test(description));
    score += Number(/^see\s/.test(description));
    score += Number(/(^|\s)variant\sof\s/.test(description));
    score += Number(/^surname\s/.test(description));
    score += Number(/(^|\W)archaic(\W|$)/.test(description));
    score += Number(/(^|\W)abbr\./.test(description));
    return score;
}

/** @param {string} first
 * @param {string} second
*/
function sortFn(first, second) {
    return score(first) - score(second);
}

/** Sort descriptions naively with least useful last
 *
 * @param {string[]} descriptions
 * @returns {string[]}
 */
function sortDescriptions(descriptions) {
    const sortDescriptions = descriptions.slice();
    sortDescriptions.sort(sortFn);
    return sortDescriptions;
}

module.exports = {
    sortDescriptions
};
