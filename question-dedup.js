// Numbered scenario labels and shuffled answer letters do not make a new question.
(function (root) {
  'use strict';
  function identity(q) {
    return q.type + ':' + q.prompt.normalize('NFC')
      .replace(/\s*\((?:Tình huống[^()]*|Bài toán[^()]*|Xử lý sự cố production)\s+\d+\)\s*$/iu, '')
      .replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi-VN');
  }
  function unique(questions, preferred = new Set()) {
    const chosen = new Map();
    for (const q of questions) {
      const key = identity(q), previous = chosen.get(key);
      if (!previous || (preferred.has(q.id) && !preferred.has(previous.id))) chosen.set(key, q);
    }
    return questions.filter(q => chosen.get(identity(q)) === q);
  }
  const api = { identity, unique };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StudyQuestions = api;
})(globalThis);
