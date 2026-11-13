import { collectFish } from './rules.js';

const PICKUP_TYPES = Object.freeze(['fish', 'shield', 'item']);
const LANE_WIDTH = 3.4;
const LANE_TOLERANCE = 1.08;
const PICKUP_REACH = 1.45;
const OBSTACLE_REACH = 0.65;
const MAGNET_REACH = 12;
const FISH_HEIGHT_OFFSET = 1.35;
const FISH_HEIGHT_TOLERANCE = 1;
const JUMP_CLEAR_HEIGHT = 1.18;

const isPickup = (type) => PICKUP_TYPES.includes(type);

// Swept contact uses the same previous/current tick for both players, including lane and height.
function contact(player, previous, entity) {
  const magnet = entity.type === 'fish' && player.magnetRemaining > 0;
  const before = previous || player;
  const start = before.distance;
  const end = player.distance;
  const reach = magnet ? MAGNET_REACH : isPickup(entity.type) ? PICKUP_REACH : OBSTACLE_REACH;
  if (entity.at < start - PICKUP_REACH || entity.at > end + reach) return null;
  const fraction =
    end > start ? Math.max(0, Math.min(1, (entity.at - reach - start) / (end - start))) : 0;
  const x = before.x + (player.x - before.x) * fraction;
  if (!magnet && Math.abs(x - (entity.lane - 1) * LANE_WIDTH) > LANE_TOLERANCE) return null;
  const jumpY = before.jumpY + (player.jumpY - before.jumpY) * fraction;
  if (
    entity.type === 'fish' &&
    !magnet &&
    Math.abs(jumpY + FISH_HEIGHT_OFFSET - entity.height) >= FISH_HEIGHT_TOLERANCE
  )
    return null;
  if (!isPickup(entity.type) && entity.at > end + OBSTACLE_REACH) return null;
  return { player, fraction, jumpY };
}

function pickupWinner(contacts, entity) {
  const eligible = contacts.filter(
    (candidate) => entity.type !== 'item' || candidate.player.itemSlot === null,
  );
  eligible.sort((left, right) => {
    const fractionDelta = Math.abs(left.fraction - right.fraction);
    if (fractionDelta > 1e-8) return left.fraction - right.fraction;
    return ((left.player.id + entity.id) % 2) - ((right.player.id + entity.id) % 2);
  });
  return eligible[0]?.player ?? null;
}

function applyPickup(entity, player, onEvent) {
  if (entity.type === 'fish') collectFish(player);
  if (entity.type === 'shield') player.shield = true;
  if (entity.type === 'item') player.itemSlot = entity.item;
  entity.resolved = true;
  onEvent(entity.type, player, entity);
}

function isSafe(entity, contactPoint, player) {
  if (entity.type === 'hurdle') return contactPoint.jumpY > JUMP_CLEAR_HEIGHT;
  if (entity.type === 'gate') return player.duck > 0 && contactPoint.jumpY < 0.1;
  return false;
}

function applyObstacle(entity, contactPoint, onEvent) {
  const player = contactPoint.player;
  entity.resolvedBy ||= [];
  if (entity.resolvedBy.includes(player.id)) return;
  entity.resolvedBy.push(player.id);
  if (isSafe(entity, contactPoint, player) || player.invincible > 0) return;
  player.invincible = 1.8;
  if (player.shield) {
    player.shield = false;
    onEvent('shieldHit', player, entity);
    return;
  }
  player.hp--;
  onEvent('hit', player, entity);
}

export function resolveCollisions(game, entities, { previous = [], onEvent = () => {} } = {}) {
  if (game.mode !== 'playing') return;
  for (const entity of entities) {
    if (entity.resolved) continue;
    const contacts = game.players
      .filter((player) => player.status === 'running' && player.hp > 0)
      .map((player) => contact(player, previous[player.id], entity))
      .filter(Boolean);
    if (isPickup(entity.type)) {
      const winner = pickupWinner(contacts, entity);
      if (winner) applyPickup(entity, winner, onEvent);
      continue;
    }
    for (const contactPoint of contacts) applyObstacle(entity, contactPoint, onEvent);
  }
}
