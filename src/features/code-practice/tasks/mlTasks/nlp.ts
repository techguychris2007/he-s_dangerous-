import type { CodeTask } from '../codeTypes';

export const ML_NLP_TASKS: CodeTask[] = [
  {
    id: 'ml-nlp-01',
    title: 'Tokenize and Remove Stopwords',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: NLP',
    prompt:
      'Write preprocess(text, stopwords) that lowercases text, strips any character that is not a letter ' +
      'or a space, splits on whitespace, and removes any token present in the stopwords set. Return the ' +
      'list of remaining tokens, in order.',
    starterCode:
      'def preprocess(text, stopwords):\n' +
      '    # TODO: lowercase, strip non-letters, tokenize, and remove stopwords\n' +
      '    pass\n',
    hints: [
      'Build the cleaned string character by character: keep a character if it is a letter or a space, using str.isalpha() or a space check.',
      'text.lower() first, then .split() on the cleaned string gives you raw tokens.',
      'A list comprehension filters out stopwords: [t for t in tokens if t not in stopwords].',
    ],
    solution:
      'def preprocess(text, stopwords):\n' +
      '    lowered = text.lower()\n' +
      "    cleaned = ''.join(ch if ch.isalpha() or ch == ' ' else ' ' for ch in lowered)\n" +
      '    tokens = cleaned.split()\n' +
      '    return [t for t in tokens if t not in stopwords]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      "stopwords = {'the', 'is', 'a', 'and'}\n" +
      "__check__('basic', preprocess('The Cat is a Cat!', stopwords), ['cat', 'cat'])\n" +
      "__check__('punctuation', preprocess(\"Run, don't stop.\", set()), ['run', 'don', 't', 'stop'])\n" +
      "__check__('all stopwords', preprocess('the is a', stopwords), [])\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-nlp-02',
    title: 'Compute TF-IDF',
    difficulty: 'Hard',
    language: 'python',
    category: 'ML: NLP',
    prompt:
      'Write tfidf(term, doc_tokens, all_docs_tokens) where doc_tokens is the token list for one ' +
      'document and all_docs_tokens is a list of token lists for the whole corpus (including doc_tokens). ' +
      'Return term_frequency * inverse_document_frequency, where TF = count of term in doc_tokens / ' +
      'len(doc_tokens), and IDF = log(number of documents / number of documents containing term), using ' +
      'math.log (natural log).',
    starterCode:
      'import math\n\n' +
      'def tfidf(term, doc_tokens, all_docs_tokens):\n' +
      '    # TODO: return TF(term, doc_tokens) * IDF(term, all_docs_tokens)\n' +
      '    pass\n',
    hints: [
      'TF is doc_tokens.count(term) / len(doc_tokens).',
      'Count how many documents in all_docs_tokens contain term at least once (use `term in doc` for each doc).',
      'IDF is math.log(len(all_docs_tokens) / docs_containing_term). Multiply TF and IDF together for the final answer.',
    ],
    solution:
      'import math\n\n' +
      'def tfidf(term, doc_tokens, all_docs_tokens):\n' +
      '    tf = doc_tokens.count(term) / len(doc_tokens)\n' +
      '    docs_containing = sum(1 for doc in all_docs_tokens if term in doc)\n' +
      '    idf = math.log(len(all_docs_tokens) / docs_containing)\n' +
      '    return tf * idf\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-6\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      "doc1 = ['cat', 'sat', 'on', 'the', 'mat']\n" +
      "doc2 = ['dog', 'sat', 'on', 'the', 'log']\n" +
      "doc3 = ['cat', 'and', 'dog', 'are', 'friends']\n" +
      'corpus = [doc1, doc2, doc3]\n\n' +
      "import math\n" +
      "__check__('word in all docs scores low', tfidf('sat', doc1, corpus), (1/5) * math.log(3/2))\n" +
      "__check__('rare word scores higher', tfidf('mat', doc1, corpus), (1/5) * math.log(3/1))\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-nlp-03',
    title: 'Find the Nearest Word Embedding',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: NLP',
    prompt:
      'Write nearest_word(target_vector, vocabulary) where vocabulary is a dict mapping words to their ' +
      'embedding vectors (lists of numbers). Return the word in vocabulary whose vector has the highest ' +
      'cosine similarity to target_vector — the core operation behind "find similar words."',
    starterCode:
      'def nearest_word(target_vector, vocabulary):\n' +
      '    # TODO: return the word in vocabulary with the highest cosine similarity to target_vector\n' +
      '    pass\n',
    hints: [
      'You need a cosine similarity helper: dot product divided by the product of the two vectors\' L2 norms — same formula as the cosine_similarity task from Unit 1.',
      'Compute the similarity between target_vector and every word\'s vector in vocabulary.',
      'max(vocabulary, key=lambda word: cosine_similarity(target_vector, vocabulary[word])) finds the best match in one line.',
    ],
    solution:
      'def cosine_similarity(a, b):\n' +
      '    dot = sum(x * y for x, y in zip(a, b))\n' +
      '    norm_a = sum(x ** 2 for x in a) ** 0.5\n' +
      '    norm_b = sum(x ** 2 for x in b) ** 0.5\n' +
      '    return dot / (norm_a * norm_b)\n\n' +
      'def nearest_word(target_vector, vocabulary):\n' +
      '    return max(vocabulary, key=lambda word: cosine_similarity(target_vector, vocabulary[word]))\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      "vocab = {\n" +
      "    'cat': [1, 0, 0],\n" +
      "    'dog': [0.9, 0.1, 0],\n" +
      "    'car': [0, 0, 1],\n" +
      "}\n" +
      "__check__('closest to cat-like vector', nearest_word([1, 0, 0], vocab), 'cat')\n" +
      "__check__('closest to car-like vector', nearest_word([0, 0, 5], vocab), 'car')\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-nlp-04',
    title: 'Lexicon-Based Sentiment Baseline',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: NLP',
    prompt:
      "Write lexicon_sentiment(tokens, positive_words, negative_words) that counts how many tokens are in " +
      "positive_words vs. negative_words, and returns 'positive' if the positive count is higher, " +
      "'negative' if the negative count is higher, or 'neutral' if they're equal.",
    starterCode:
      'def lexicon_sentiment(tokens, positive_words, negative_words):\n' +
      "    # TODO: return 'positive', 'negative', or 'neutral' based on word counts\n" +
      '    pass\n',
    hints: [
      'Count matches for each lexicon: sum(1 for t in tokens if t in positive_words), and similarly for negative_words.',
      'Compare the two counts directly.',
      "Three branches: positive count higher -> 'positive', negative higher -> 'negative', otherwise -> 'neutral'.",
    ],
    solution:
      'def lexicon_sentiment(tokens, positive_words, negative_words):\n' +
      '    pos = sum(1 for t in tokens if t in positive_words)\n' +
      '    neg = sum(1 for t in tokens if t in negative_words)\n' +
      '    if pos > neg:\n' +
      "        return 'positive'\n" +
      '    if neg > pos:\n' +
      "        return 'negative'\n" +
      "    return 'neutral'\n",
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      "pos_words = {'good', 'great', 'love'}\n" +
      "neg_words = {'bad', 'terrible', 'hate'}\n" +
      "__check__('positive', lexicon_sentiment(['this', 'is', 'great', 'i', 'love', 'it'], pos_words, neg_words), 'positive')\n" +
      "__check__('negative', lexicon_sentiment(['bad', 'terrible', 'day'], pos_words, neg_words), 'negative')\n" +
      "__check__('neutral tie', lexicon_sentiment(['good', 'bad'], pos_words, neg_words), 'neutral')\n" +
      "__check__('neutral no matches', lexicon_sentiment(['the', 'cat', 'sat'], pos_words, neg_words), 'neutral')\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
