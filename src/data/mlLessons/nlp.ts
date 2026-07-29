import type { MlLesson } from './types';

export const NLP_LESSONS: MlLesson[] = [
  {
    id: 'text-preprocessing',
    title: 'Text Preprocessing',
    source: 'Extension',
    unit: 'nlp',
    challengeTaskId: 'ml-nlp-01',
    sections: [
      {
        heading: 'Text is messy',
        body: `<p>Raw text has inconsistent capitalization, punctuation, and word forms that would each be
        treated as a completely different "feature" by a naive model — "Run", "run", and "run." would all
        be distinct tokens without cleanup.</p>`,
      },
      {
        heading: 'The standard pipeline',
        body: `<ol>
          <li><strong>Lowercase</strong> — so "Run" and "run" aren't treated as different words.</li>
          <li><strong>Tokenize</strong> — split text into individual words (tokens).</li>
          <li><strong>Remove stopwords</strong> — drop extremely common, low-information words ("the", "is", "and").</li>
          <li><strong>Stem or lemmatize</strong> — reduce words to a common root ("running", "runs" &rarr; "run").</li>
        </ol>`,
      },
      {
        heading: 'How much cleaning is too much?',
        body: `<p>Aggressive cleaning can throw away real signal — punctuation matters for sentiment ("great!"
        vs "great?"), and modern embedding-based models often need far less preprocessing than classic
        bag-of-words approaches. The right amount of cleaning depends on the model that consumes the text.</p>`,
      },
    ],
  },
  {
    id: 'bag-of-words-tfidf',
    title: 'Bag-of-Words &amp; TF-IDF',
    source: 'Extension',
    unit: 'nlp',
    challengeTaskId: 'ml-nlp-02',
    sections: [
      {
        heading: 'Turning text into numbers',
        body: `<p>The simplest way to featurize text: build a vocabulary of every distinct word across a
        corpus, then represent each document as a vector of word counts — a <strong>bag of words</strong>.
        It discards word order entirely, but is a surprisingly strong baseline for many classification tasks.</p>`,
      },
      {
        heading: 'The problem with raw counts',
        body: `<p>Common words ("the", "a") get huge counts in every document without carrying much
        document-specific meaning, while rare, distinctive words get drowned out just from having smaller
        counts.</p>`,
      },
      {
        heading: 'TF-IDF: weighting by distinctiveness',
        body: `<p><strong>TF-IDF</strong> (Term Frequency &times; Inverse Document Frequency) downweights
        words that appear in many documents (low IDF) and upweights words that appear frequently in one
        document but rarely elsewhere — IDF for a word is roughly log(total documents / documents
        containing the word), so a word in every document scores near 0 regardless of its raw count.</p>`,
      },
    ],
  },
  {
    id: 'word-embeddings',
    title: 'Word Embeddings',
    source: 'Extension',
    unit: 'nlp',
    challengeTaskId: 'ml-nlp-03',
    sections: [
      {
        heading: 'Beyond counting words',
        body: `<p>Bag-of-words treats "good" and "great" as completely unrelated dimensions. <strong>Word
        embeddings</strong> instead represent each word as a dense vector (commonly 100–300 numbers) learned
        so that words used in similar contexts end up with similar vectors.</p>`,
      },
      {
        heading: 'The distributional hypothesis',
        body: `<p>Embedding methods like Word2Vec and GloVe are built on a simple idea: "a word is
        characterized by the company it keeps." By training on which words tend to appear near each other
        across a huge text corpus, the resulting vectors capture real semantic relationships.</p>`,
      },
      {
        heading: 'Vector arithmetic that actually works',
        body: `<p>Famously, well-trained word embeddings support analogies via vector arithmetic:
        vector("king") - vector("man") + vector("woman") lands close to vector("queen"). This is exactly
        cosine similarity from Unit 1, applied to learned word vectors instead of raw feature vectors.</p>`,
      },
    ],
  },
  {
    id: 'sentiment-analysis',
    title: 'Sentiment Analysis Case Study',
    source: 'Extension',
    unit: 'nlp',
    challengeTaskId: 'ml-nlp-04',
    sections: [
      {
        heading: 'Putting the pipeline together',
        body: `<p>Sentiment analysis — classifying text as positive/negative/neutral — is a complete,
        realistic small NLP project: preprocess text, featurize it (bag-of-words/TF-IDF or embeddings), and
        train a classifier (logistic regression and naive Bayes are both strong, fast baselines) on the result.</p>`,
      },
      {
        heading: 'A simple lexicon-based baseline',
        body: `<p>Before reaching for a trained model, a surprisingly effective baseline just counts
        positive and negative words from a predefined sentiment lexicon and compares the totals — no
        training data required, and a useful sanity check against a trained model's results.</p>`,
      },
      {
        heading: 'Where sentiment analysis breaks',
        body: `<p>Sarcasm ("great, another Monday"), negation ("not bad at all"), and domain-specific
        language (words that mean different things in product reviews vs. financial news) are classic
        failure modes — a reminder that no NLP technique here is a solved problem, just a useful
        approximation.</p>`,
      },
    ],
  },
];
