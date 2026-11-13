import { LEVELS } from './levels.js';

const MODE_LABELS = {
  zh: { campaign: '闯关模式', endless: '无尽模式', duo: '双人合作', items: '道具闯关' },
  en: { campaign: 'Campaign', endless: 'Endless', duo: 'Local Co-op', items: 'Item Campaign' },
};

export function shareUrl(locale) {
  if (locale !== 'zh' && locale !== 'en') throw new Error('Unsupported sharing language');
  return locale === 'en' ? 'https://tihuqiche.com/en/' : 'https://tihuqiche.com/';
}

function validateShareResult(result, locale) {
  const validBase =
    result &&
    Object.hasOwn(MODE_LABELS[locale], result.gameMode) &&
    Number.isSafeInteger(result.score) &&
    result.score >= 0 &&
    Number.isFinite(result.distance) &&
    result.distance >= 0 &&
    Number.isSafeInteger(result.fishCollected) &&
    result.fishCollected >= 0;
  if (!validBase) throw new Error('Invalid result for sharing');
  const endless = result.gameMode === 'endless';
  const validLevel = endless
    ? result.levelIndex === null
    : Number.isInteger(result.levelIndex) &&
      result.levelIndex >= 0 &&
      result.levelIndex < LEVELS.length;
  if (!validLevel) throw new Error('Invalid share level');
}

function modeLabel(result, locale) {
  if (result.gameMode === 'endless') return MODE_LABELS[locale][result.gameMode];
  const level = LEVELS[result.levelIndex];
  return `${MODE_LABELS[locale][result.gameMode]} · ${locale === 'en' ? level.en : level.name}`;
}

function englishText(result, locale, mode) {
  const duo = result.gameMode === 'duo';
  const distance = Math.floor(result.distance);
  const subject = duo ? 'We teamed up and scored' : 'I scored';
  const invitation = duo
    ? 'Grab a friend and ride together'
    : 'Ride with my long-beaked buddy and try to beat my score';
  return (
    `${subject} ${result.score} points in Pelican Pedal Run (${mode})! ` +
    `${distance} meters ridden and ${result.fishCollected} fish collected. ` +
    `${invitation}: ${shareUrl(locale)}`
  );
}

function chineseText(result, locale, mode) {
  const duo = result.gameMode === 'duo';
  const distance = Math.floor(result.distance);
  const subject = duo ? '我们' : '我';
  const invitation = duo
    ? '一人一只鹈鹕，一路鸡飞鱼跳，叫上你的搭子，也来骑一程'
    : '来和我的长嘴搭子比一场';
  return (
    `${subject}在《鹈鹕骑车》的【${mode}】${duo ? '合作' : ''}拿下了 ${result.score} 分！` +
    `一路骑过 ${distance} 米，收集 ${result.fishCollected} 条小鱼，` +
    `${invitation}：${shareUrl(locale)}`
  );
}

export function buildShareText(result, locale) {
  validateShareResult(result, locale);
  const mode = modeLabel(result, locale);
  return locale === 'en' ? englishText(result, locale, mode) : chineseText(result, locale, mode);
}

export async function copyShare(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Share text must not be empty');
  if (!globalThis.navigator?.clipboard?.writeText)
    throw new Error('Clipboard unavailable; copy the text manually');
  await globalThis.navigator.clipboard.writeText(text);
}
