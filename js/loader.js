// Assuming URL format like https://yoursite.com/event1.html or with query param ?event=event1
// events.js
export default eventsData = {
  "event1": {
    name: "Charity Run 2025",
    location: "New York Central Park",
    date: "2025-09-15",
    description: "Join us for a charity run to support local schools.",
  },
  "event2": {
    name: "Food Drive",
    location: "Community Center, Brooklyn",
    date: "2025-10-10",
    description: "Help  us collect food for families in need.",
  },
  // add as many events as you want
};

export function getEventKeyFromURL() {
  // Option 1: from path
  const path = window.location.pathname; // e.g., /event1.html
  const page = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.')); // "event1"
  if (eventsData[page]) return page;

  // Option 2: from query string ?event=event1
  const urlParams = new URLSearchParams(window.location.search);
  const eventParam = urlParams.get("event");
  if (eventParam && eventsData[eventParam]) return eventParam;

  return null;
}

export function loadEventData() {
  const eventKey = getEventKeyFromURL();
  if (!eventKey) {
    console.warn("No event key found in URL, using default content");
    return;
  }

  const event = eventsData[eventKey];

  // Update DOM with event info
  document.getElementById("event-name").textContent = event.name;
  document.getElementById("event-location").textContent = event.location;
  document.getElementById("event-date").textContent = event.date;
  document.getElementById("event-description").textContent = event.description;
}

// Run after DOM loaded
