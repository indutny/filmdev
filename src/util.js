export const MINUTE = 60;

export function formatDuration(duration) {
  let seconds = Math.floor(duration % MINUTE).toString();
  let minutes = Math.floor(duration / MINUTE).toString();

  if (seconds.length < 2) {
    seconds = `0${seconds}`;
  }
  if (minutes.length < 2) {
    minutes = `0${minutes}`;
  }

  return `${minutes}:${seconds}`;
}
