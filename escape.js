//** @param {string} value */
function csvEscape(value) {
    return `"${value.replace(/"/g, '""')}"`;
}


function unEscape(source) {
    return source.slice(1, source.length - 1)
        .replace(/""/g, '"');
}

module.exports = {
    csvEscape,
    unEscape
};
