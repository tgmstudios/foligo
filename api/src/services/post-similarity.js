const { TfIdf } = require('natural/lib/natural/tfidf');
const { WordTokenizer } = require('natural/lib/natural/tokenizers/regexp_tokenizer');
const PorterStemmer = require('natural/lib/natural/stemmers/porter_stemmer');
const { words: englishStopWords } = require('natural/lib/natural/util/stopwords');

const DEFAULT_THRESHOLD = 0.24;
const DEFAULT_COVERAGE_THRESHOLD = 0.1;
const DEFAULT_MAX_LINKS_PER_POST = 3;
const MAX_CONTENT_LENGTH = 20000;
const stopWords = new Set(englishStopWords);
const tokenizer = new WordTokenizer();

function normalizeText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}+#.-]+/gu, ' ')
    .toLowerCase();
}

function tokenize(value) {
  return tokenizer.tokenize(normalizeText(value))
    .filter(token => token.length > 1 && !stopWords.has(token))
    .map(token => PorterStemmer.stem(token));
}

function names(items) {
  return (items || []).map(item => normalizeText(item.name)).filter(Boolean);
}

function postTokens(post) {
  const title = tokenize(post.title);
  const excerpt = tokenize(post.excerpt);
  const content = tokenize(String(post.content || '').slice(0, MAX_CONTENT_LENGTH));
  const tags = tokenize(names(post.tags).join(' '));
  const skills = tokenize(names(post.linkedSkills).join(' '));

  // Repetition gives concise, curated fields more influence than the full body.
  return [
    ...title, ...title, ...title,
    ...excerpt, ...excerpt,
    ...content,
    ...tags, ...tags, ...tags,
    ...skills, ...skills, ...skills
  ];
}

function cosineSimilarity(left, right) {
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (const value of left.values()) leftMagnitude += value * value;
  for (const value of right.values()) rightMagnitude += value * value;
  for (const [term, value] of left) dotProduct += value * (right.get(term) || 0);

  if (!leftMagnitude || !rightMagnitude) return 0;
  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function jaccardSimilarity(leftValues, rightValues) {
  const left = new Set(leftValues);
  const right = new Set(rightValues);
  if (!left.size || !right.size) return 0;

  let intersection = 0;
  for (const value of left) {
    if (right.has(value)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

function buildVectors(posts) {
  const tfidf = new TfIdf();
  posts.forEach(post => tfidf.addDocument(postTokens(post)));

  return posts.map((_, index) => new Map(
    tfidf.listTerms(index).map(({ term, tfidf: weight }) => [term, weight])
  ));
}

function findSimilarPostPairs(posts, options = {}) {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const coverageThreshold = options.coverageThreshold ?? Math.min(threshold, DEFAULT_COVERAGE_THRESHOLD);
  const maxLinksPerPost = options.maxLinksPerPost ?? DEFAULT_MAX_LINKS_PER_POST;
  if (posts.length < 2) return [];

  const vectors = buildVectors(posts);
  const candidates = [];

  for (let leftIndex = 0; leftIndex < posts.length - 1; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < posts.length; rightIndex += 1) {
      const left = posts[leftIndex];
      const right = posts[rightIndex];
      const textScore = cosineSimilarity(vectors[leftIndex], vectors[rightIndex]);
      const tagScore = jaccardSimilarity(names(left.tags), names(right.tags));
      const skillScore = jaccardSimilarity(names(left.linkedSkills), names(right.linkedSkills));
      const score = (textScore * 0.65) + (tagScore * 0.2) + (skillScore * 0.15);

      if (score >= coverageThreshold) {
        candidates.push({
          sourceId: left.id,
          targetId: right.id,
          linkType: 'similar',
          score: Number(score.toFixed(4)),
          signals: {
            text: Number(textScore.toFixed(4)),
            tags: Number(tagScore.toFixed(4)),
            skills: Number(skillScore.toFixed(4))
          }
        });
      }
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  const linkCounts = new Map();
  const coveredPosts = new Set();
  const selectedKeys = new Set();
  const selected = [];
  const candidateKey = candidate => `${candidate.sourceId}:${candidate.targetId}`;
  const addCandidate = candidate => {
    const sourceCount = linkCounts.get(candidate.sourceId) || 0;
    const targetCount = linkCounts.get(candidate.targetId) || 0;
    if (sourceCount >= maxLinksPerPost || targetCount >= maxLinksPerPost) return false;
    linkCounts.set(candidate.sourceId, sourceCount + 1);
    linkCounts.set(candidate.targetId, targetCount + 1);
    coveredPosts.add(candidate.sourceId);
    coveredPosts.add(candidate.targetId);
    selectedKeys.add(candidateKey(candidate));
    selected.push(candidate);
    return true;
  };

  // First give every post its strongest reasonable connection. Posts with
  // fewer choices go first so broad, highly connected posts cannot consume
  // all of their neighbors' capacity.
  const candidatesByPost = new Map(posts.map(post => [post.id, []]));
  for (const candidate of candidates) {
    candidatesByPost.get(candidate.sourceId).push(candidate);
    candidatesByPost.get(candidate.targetId).push(candidate);
  }
  const postsByConstraint = [...posts].sort((left, right) => {
    const leftCandidates = candidatesByPost.get(left.id);
    const rightCandidates = candidatesByPost.get(right.id);
    return leftCandidates.length - rightCandidates.length
      || (leftCandidates[0]?.score || 0) - (rightCandidates[0]?.score || 0);
  });
  for (const post of postsByConstraint) {
    if (coveredPosts.has(post.id)) continue;
    const bestAvailable = candidatesByPost.get(post.id).find(candidate => {
      const sourceCount = linkCounts.get(candidate.sourceId) || 0;
      const targetCount = linkCounts.get(candidate.targetId) || 0;
      return sourceCount < maxLinksPerPost && targetCount < maxLinksPerPost;
    });
    if (bestAvailable) addCandidate(bestAvailable);
  }

  // Then add the remaining high-confidence relationships up to the degree cap.
  for (const candidate of candidates) {
    if (candidate.score < threshold) break;
    if (!selectedKeys.has(candidateKey(candidate))) addCandidate(candidate);
  }

  return selected.sort((left, right) => right.score - left.score);
}

module.exports = {
  DEFAULT_MAX_LINKS_PER_POST,
  DEFAULT_COVERAGE_THRESHOLD,
  DEFAULT_THRESHOLD,
  findSimilarPostPairs
};
