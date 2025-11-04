export async function fetchLatestEvents() {
  const res = await fetch("http://localhost:3001/api/events/latest");
  return res.json();
}

export async function fetchAllEvents() {
  const res = await fetch("http://localhost:3001/api/events");
  return res.json();
}

export async function fetchStrangers() {
  const res = await fetch("http://localhost:3001/api/events/strangers");
  return res.json();
}
