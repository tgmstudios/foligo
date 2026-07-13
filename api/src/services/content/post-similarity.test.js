const { findSimilarPostPairs } = require('./post-similarity');

const post = (id, title, content, tags = [], skills = []) => ({
  id,
  title,
  content,
  excerpt: content.slice(0, 100),
  tags: tags.map(name => ({ name })),
  linkedSkills: skills.map(name => ({ name }))
});

describe('findSimilarPostPairs', () => {
  test('links posts with similar subject matter and metadata', () => {
    const pairs = findSimilarPostPairs([
      post('api-1', 'Building a Node API', 'Express routes and PostgreSQL database design', ['backend'], ['Node.js']),
      post('api-2', 'Testing a Node API', 'Integration tests for Express routes backed by PostgreSQL', ['backend'], ['Node.js']),
      post('garden', 'Growing tomatoes', 'Soil, sunlight, watering, and garden maintenance', ['gardening'], ['Horticulture'])
    ]);

    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ sourceId: 'api-1', targetId: 'api-2', linkType: 'similar' });
    expect(pairs[0].score).toBeGreaterThanOrEqual(0.24);
  });

  test('returns no links when posts have no meaningful overlap', () => {
    const pairs = findSimilarPostPairs([
      post('one', 'Mountain photography', 'Camera exposure on snowy alpine trails'),
      post('two', 'Database migrations', 'Safely changing a PostgreSQL production schema')
    ]);

    expect(pairs).toEqual([]);
  });

  test('caps the number of links per post', () => {
    const posts = Array.from({ length: 6 }, (_, index) => (
      post(String(index), `Node API guide ${index}`, 'Node Express API PostgreSQL backend tutorial', ['backend'], ['Node.js'])
    ));
    const pairs = findSimilarPostPairs(posts, { maxLinksPerPost: 2 });
    const counts = new Map();
    pairs.forEach(({ sourceId, targetId }) => {
      counts.set(sourceId, (counts.get(sourceId) || 0) + 1);
      counts.set(targetId, (counts.get(targetId) || 0) + 1);
    });

    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
  });

  test('gives niche posts a reasonable nearest-neighbor link below the main threshold', () => {
    const pairs = findSimilarPostPairs([
      post('robot', 'Foundational robotics project', 'Building a physical robot with motors and electronics'),
      post('game', 'Foundational game project', 'Building an interactive game with digital controls'),
      post('database', 'PostgreSQL operations', 'Production database migrations and query indexes')
    ]);

    expect(pairs).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceId: 'robot', targetId: 'game' })
    ]));
  });
});
