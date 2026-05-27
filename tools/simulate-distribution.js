#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const runs = Number(process.argv[2]) || 5000;
const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

function element(id) {
  return {
    id,
    textContent: '',
    value: '',
    checked: true,
    classList: { add() {}, remove() {} },
    style: {},
    innerHTML: '',
    addEventListener() {},
    appendChild() {}
  };
}

const elements = new Map();
const context = {
  window: { location: { search: '?debug=1', hash: '' } },
  location: { href: 'http://localhost/index.html?debug=1' },
  URLSearchParams,
  document: {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element(id));
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    createElement() { return element('created'); }
  },
  console: { log() {}, warn() {}, error() {} },
  navigator: { userAgent: 'simulation' },
  URL: { revokeObjectURL() {}, createObjectURL() { return 'blob:simulation'; } },
  fetch: () => Promise.resolve({}),
  alert(message) { throw new Error(`unexpected alert: ${message}`); },
  Math,
  JSON,
  Date,
  Number,
  Object,
  Array,
  String,
  RegExp,
  Promise,
  File: global.File || class File {},
  setTimeout,
  clearTimeout
};

const simulationCode = `
  function simulateRole(role, runs) {
    userRole = role;
    allQuestions = [...baseQuestions, ...(role === 'leader' ? leaderQuestions : memberQuestions)];
    const typeCounts = {};
    const letterCounts = {
      C: 0, D: 0, V: 0, S: 0, R: 0, E: 0, I: 0, G: 0
    };

    for (let run = 0; run < runs; run++) {
      answers = allQuestions.map((question, index) => {
        const optionIndex = Math.floor(Math.random() * question.options.length);
        const option = question.options[optionIndex];
        return {
          letter: option.letter,
          text: option.text,
          scores: getOptionScores(index, optionIndex, option)
        };
      });

      const type = calculateType();
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      for (const letter of type) {
        letterCounts[letter] += 1;
      }
    }

    return { typeCounts, letterCounts };
  }

  globalThis.__simulation = {
    leader: simulateRole('leader', ${runs}),
    member: simulateRole('member', ${runs})
  };
`;

vm.runInNewContext(`${script}\n${simulationCode}`, context);

function printDistribution(role, result) {
  const total = Object.values(result.typeCounts).reduce((sum, count) => sum + count, 0);
  const sortedTypes = Object.entries(result.typeCounts).sort((a, b) => b[1] - a[1]);
  const expected = total / 16;
  const max = sortedTypes[0];
  const min = sortedTypes[sortedTypes.length - 1];

  console.log(`\n${role.toUpperCase()} (${total} runs)`);
  console.log(`Top type: ${max[0]} ${max[1]} (${Math.round(max[1] / total * 100)}%)`);
  console.log(`Low type: ${min[0]} ${min[1]} (${Math.round(min[1] / total * 100)}%)`);
  console.log(`Spread: ${(max[1] / expected).toFixed(2)}x expected / ${(min[1] / expected).toFixed(2)}x expected`);
  console.log('Type distribution:');

  sortedTypes.forEach(([type, count]) => {
    const pct = Math.round(count / total * 1000) / 10;
    console.log(`  ${type.padEnd(4)} ${String(count).padStart(5)}  ${pct.toFixed(1)}%`);
  });

  console.log('Letter distribution:');
  ['C', 'D', 'V', 'S', 'R', 'E', 'I', 'G'].forEach(letter => {
    const dimensionTotal =
      letter === 'C' || letter === 'D' ? result.letterCounts.C + result.letterCounts.D :
      letter === 'V' || letter === 'S' ? result.letterCounts.V + result.letterCounts.S :
      letter === 'R' || letter === 'E' ? result.letterCounts.R + result.letterCounts.E :
      result.letterCounts.I + result.letterCounts.G;
    const pct = Math.round(result.letterCounts[letter] / dimensionTotal * 1000) / 10;
    console.log(`  ${letter}: ${pct.toFixed(1)}%`);
  });
}

printDistribution('leader', context.__simulation.leader);
printDistribution('member', context.__simulation.member);
