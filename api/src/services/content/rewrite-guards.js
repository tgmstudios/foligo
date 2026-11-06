// Preserve literal code while allowing the surrounding prose to change.
function codeFragments(markdown) {
  const blocks = [], prose = [];
  let block = null, marker = '', length = 0;
  for (const line of markdown.split(/\r?\n/u)) {
    if (!block) {
      const opening = line.match(/^ {0,3}(`{3,}|~{3,})/u);
      if (opening) { marker = opening[1][0]; length = opening[1].length; block = [line]; }
      else prose.push(line);
    } else {
      block.push(line);
      const closing = line.match(/^ {0,3}(`+|~+)\s*$/u);
      if (closing && closing[1][0] === marker && closing[1].length >= length) {
        blocks.push(block.join('\n')); block = null;
      }
    }
  }
  if (block) blocks.push(block.join('\n'));
  const inline = Array.from(prose.join('\n').matchAll(/(`+)([\s\S]*?)\1/gu), match => match[0]);
  return { blocks, inline };
}
function preservesCode(source, rewritten) {
  return JSON.stringify(codeFragments(source)) === JSON.stringify(codeFragments(rewritten));
}
module.exports = { preservesCode };
