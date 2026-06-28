import { randomInt } from 'crypto';

const ADJECTIVES = [
  'bold', 'calm', 'cold', 'cool', 'dark', 'deep', 'easy', 'fair', 'fast', 'fine',
  'firm', 'flat', 'fond', 'free', 'full', 'glad', 'good', 'grey', 'hard', 'holy',
  'huge', 'kind', 'lame', 'lazy', 'lean', 'lost', 'loud', 'lush', 'mean', 'mild',
  'neat', 'nice', 'open', 'pale', 'pink', 'poor', 'posh', 'pure', 'rare', 'rash',
  'real', 'rich', 'ripe', 'rude', 'safe', 'sane', 'sick', 'slim', 'slow', 'soft',
  'sore', 'sour', 'spry', 'tall', 'tame', 'tart', 'taut', 'thin', 'tidy', 'ugly',
  'vast', 'warm', 'wary', 'weak', 'wild', 'wise', 'zany', 'able', 'acid', 'aged',
  'ajar', 'arid', 'avid', 'bald', 'bare', 'bent', 'blue', 'busy', 'cute', 'damp',
  'dear', 'dire', 'dour', 'drab', 'dual', 'dull', 'epic', 'fake', 'foul', 'glum',
  'gold', 'gray', 'grim', 'gory', 'hazy', 'iffy', 'just', 'keen', 'last', 'late',
];

const NOUNS = [
  'tree', 'lake', 'moon', 'star', 'wolf', 'bear', 'lion', 'bird', 'fish', 'frog',
  'duck', 'swan', 'deer', 'hawk', 'crow', 'wave', 'cave', 'rock', 'hill', 'peak',
  'dune', 'reef', 'pond', 'pool', 'lawn', 'park', 'road', 'path', 'gate', 'wall',
  'roof', 'door', 'tent', 'ship', 'boat', 'raft', 'cart', 'bike', 'lane', 'yard',
  'barn', 'farm', 'mill', 'fort', 'dock', 'pier', 'cove', 'isle', 'sand', 'dust',
  'mist', 'rain', 'snow', 'hail', 'wind', 'gust', 'heat', 'dawn', 'dusk', 'noon',
  'week', 'year', 'hour', 'time', 'date', 'plan', 'idea', 'fact', 'myth', 'tale',
  'song', 'tune', 'beat', 'drum', 'horn', 'bell', 'gong', 'harp', 'lute', 'book',
  'page', 'note', 'card', 'mail', 'post', 'memo', 'logo', 'sign', 'mark', 'seal',
  'coin', 'cash', 'bank', 'fund', 'debt', 'cost', 'fare', 'rent', 'wage', 'gift',
];

function pick(words: string[]): string {
  return words[randomInt(0, words.length)];
}

export function generateSlug(): string {
  const adjective = pick(ADJECTIVES);
  const noun = pick(NOUNS);
  const number = String(randomInt(1, 1000)).padStart(3, '0');
  return `${adjective}-${noun}-${number}`;
}
